"""Turn the AI's transcription of an invoice photo into a form draft.

Deterministic code only (CLAUDE.md: LLMs never do arithmetic). The AI
returns text exactly as printed (see llm.py). Here we:
- parse amounts and quantities with the same parse_money / parse_quantity
  used for typed invoices,
- read the date only when its format leaves no doubt (never guess),
- suggest the supplier by fuzzy name match,
- and list every problem — unreadable or missing values, totals that
  don't add up — so the person checking the form knows where to look.

The draft holds every field as the entry form shows it (text), so the
person can correct anything before saving; saving re-validates it all.
"""

import datetime
import re
from dataclasses import dataclass

import psycopg

from app.ledger import ValidationError, parse_money, parse_quantity, validate_invoice

MONEY_FIELDS = ("subtotal", "gst", "qst", "other_tax", "total")
TAX_FIELDS = ("gst", "qst", "other_tax")  # a tax not printed on the invoice = 0
SUPPLIER_MATCH_MIN = 0.3  # pg_trgm similarity needed to suggest a supplier


@dataclass
class Draft:
    supplier_name_read: str  # as printed; shown so the person can compare
    supplier_id: int | None  # suggested match from the supplier list
    invoice_number: str
    invoice_date: str  # YYYY-MM-DD, or "" when it couldn't be read for sure
    invoice_date_read: str  # as printed
    lines: list[dict]  # {"raw_text", "quantity", "line_total"} as form text
    subtotal: str
    gst: str
    qst: str
    other_tax: str
    total: str
    problems: list[ValidationError]  # i18n codes, like every other error


# ---------------------------------------------------------------------------
# Dates (hand-written rules)
# ---------------------------------------------------------------------------

# Month names as printed on English and French invoices (lowercase,
# trailing dot removed).
MONTHS = {
    "jan": 1, "january": 1, "janv": 1, "janvier": 1,
    "feb": 2, "february": 2, "févr": 2, "fevr": 2, "février": 2, "fevrier": 2,
    "mar": 3, "march": 3, "mars": 3,
    "apr": 4, "april": 4, "avr": 4, "avril": 4,
    "may": 5, "mai": 5,
    "jun": 6, "june": 6, "juin": 6,
    "jul": 7, "july": 7, "juil": 7, "juillet": 7,
    "aug": 8, "august": 8, "août": 8, "aout": 8,
    "sep": 9, "sept": 9, "september": 9, "septembre": 9,
    "oct": 10, "october": 10, "octobre": 10,
    "nov": 11, "november": 11, "novembre": 11,
    "dec": 12, "december": 12, "déc": 12, "décembre": 12, "decembre": 12,
}  # fmt: skip

_YEAR_FIRST = re.compile(r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$")  # 2026-10-01
_CHINESE = re.compile(r"^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$")  # 2026年10月1日
_YEAR_LAST = re.compile(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$")  # 25/10/2026
_DAY_MONTH_YEAR = re.compile(r"^(\d{1,2})(?:er)?\s+(\D+?)\.?\s+(\d{4})$")  # 1er oct. 2026
_MONTH_DAY_YEAR = re.compile(r"^(\D+?)\.?\s+(\d{1,2}),?\s+(\d{4})$")  # Oct 1, 2026


def _make_date(year: int, month: int, day: int) -> datetime.date | None:
    try:
        return datetime.date(year, month, day)
    except ValueError:  # e.g. 31 February
        return None


def parse_invoice_date(text: str) -> datetime.date | None:
    """The date printed on an invoice, or None when it can't be read for
    sure. "03/04/2026" could be March 4 or April 3, so it gives None — the
    person picks. "25/10/2026" can only be October 25."""
    s = " ".join(text.strip().lower().split())
    if match := _YEAR_FIRST.match(s) or _CHINESE.match(s):
        year, month, day = (int(g) for g in match.groups())
        return _make_date(year, month, day)
    if match := _YEAR_LAST.match(s):
        a, b, year = (int(g) for g in match.groups())
        if a == b or (a > 12 and b <= 12):  # day/month (or both the same)
            return _make_date(year, b, a)
        if b > 12 and a <= 12:  # month/day
            return _make_date(year, a, b)
        return None  # both could be a month: ambiguous
    if match := _DAY_MONTH_YEAR.match(s):
        day, month_name, year = match.groups()
        month = MONTHS.get(month_name.rstrip("."))
        return _make_date(int(year), month, int(day)) if month else None
    if match := _MONTH_DAY_YEAR.match(s):
        month_name, day, year = match.groups()
        month = MONTHS.get(month_name.rstrip("."))
        return _make_date(int(year), month, int(day)) if month else None
    return None


# ---------------------------------------------------------------------------
# The draft
# ---------------------------------------------------------------------------


def format_cents(cents: int) -> str:
    """Integer cents as form text: 123456 -> "1234.56"."""
    sign = "-" if cents < 0 else ""
    return f"{sign}{abs(cents) // 100}.{abs(cents) % 100:02d}"


def _text(source: dict, key: str) -> str:
    """One value of the AI's answer as clean text ("" when absent)."""
    value = source.get(key, "")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        value = str(value)  # asked for text, but accept a bare number
    return value.strip() if isinstance(value, str) else ""


def build_draft(answer: dict) -> Draft:
    """Form draft from the AI's answer (pure function, no database)."""
    problems: list[ValidationError] = []

    def problem(code: str, field: str, read: str = "", line: int | None = None):
        context: dict = {"field": field, "read": read}
        if line is not None:
            context["line"] = line
        problems.append(ValidationError(code, context))

    def money(field: str, read: str, line: int | None = None) -> tuple[str, int | None]:
        """Form text and cents for one amount (cents None if unreadable)."""
        if read == "":
            if field in TAX_FIELDS:
                return "0", 0
            problem("extractionError.missing", field, line=line)
            return "", None
        cents = parse_money(read)
        if cents is None:
            problem("extractionError.unreadable", field, read, line)
            return read, None  # keep what was read so the person can fix it
        return format_cents(cents), cents

    lines: list[dict] = []
    line_cents: list[int | None] = []
    raw_lines = answer.get("lines")
    for item in raw_lines if isinstance(raw_lines, list) else []:
        if not isinstance(item, dict):
            continue
        description = _text(item, "description")
        quantity_read = _text(item, "quantity")
        total_read = _text(item, "line_total")
        if not (description or quantity_read or total_read):
            continue  # an empty row, not a line
        number = len(lines) + 1
        if not description:
            problem("extractionError.missing", "raw_text", line=number)
        quantity = parse_quantity(quantity_read) if quantity_read else None
        if quantity is None or quantity <= 0:
            code = "extractionError.unreadable" if quantity_read else "extractionError.missing"
            problem(code, "quantity", quantity_read, number)
            quantity_text = quantity_read
        else:
            quantity_text = quantity_read.replace(",", ".")
        total_text, cents = money("line_total", total_read, number)
        lines.append(
            {"raw_text": description, "quantity": quantity_text, "line_total": total_text}
        )
        line_cents.append(cents)

    amounts = {field: money(field, _text(answer, field)) for field in MONEY_FIELDS}

    # Only when every amount was readable can the totals be checked here;
    # otherwise the person fixes the unreadable ones first (saving checks).
    cents = {field: value for field, (_, value) in amounts.items()}
    if None not in line_cents and None not in cents.values():
        problems.extend(
            validate_invoice(
                line_cents,  # type: ignore[arg-type]  (no None, checked above)
                cents["subtotal"],
                cents["gst"],
                cents["qst"],
                cents["other_tax"],
                cents["total"],
            )
        )

    date_read = _text(answer, "invoice_date")
    date = parse_invoice_date(date_read)
    if date is None:
        code = "extractionError.dateUnclear" if date_read else "extractionError.missing"
        problem(code, "invoice_date", date_read)

    return Draft(
        supplier_name_read=_text(answer, "supplier_name"),
        supplier_id=None,
        invoice_number=_text(answer, "invoice_number"),
        invoice_date=date.isoformat() if date else "",
        invoice_date_read=date_read,
        lines=lines,
        subtotal=amounts["subtotal"][0],
        gst=amounts["gst"][0],
        qst=amounts["qst"][0],
        other_tax=amounts["other_tax"][0],
        total=amounts["total"][0],
        problems=problems,
    )


def suggest_supplier(conn: psycopg.Connection, name: str) -> int | None:
    """Best fuzzy match for a supplier name read off a photo, or None."""
    if not name:
        return None
    row = conn.execute(
        """
        SELECT id FROM suppliers
        WHERE similarity(name, %(name)s) >= %(min)s
        ORDER BY similarity(name, %(name)s) DESC, id
        LIMIT 1
        """,
        {"name": name, "min": SUPPLIER_MATCH_MIN},
    ).fetchone()
    return row["id"] if row else None


def draft_from_answer(conn: psycopg.Connection, answer: dict) -> Draft:
    """The full draft: parsed fields, problems, and a supplier suggestion."""
    draft = build_draft(answer)
    draft.supplier_id = suggest_supplier(conn, draft.supplier_name_read)
    if draft.supplier_id is None:
        draft.problems.append(
            ValidationError(
                "extractionError.unknownSupplier", {"name": draft.supplier_name_read}
            )
        )
    return draft
