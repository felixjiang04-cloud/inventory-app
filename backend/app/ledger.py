"""Deterministic ledger operations.

Every number a user ever sees comes from these functions reading the
Postgres ledger — never from a model. All money is integer cents; all
quantities are integer base units (see units.py).

Validation errors carry i18n keys (e.g. "invoiceError.noLines"), not
English text — the frontend translates them.
"""

import datetime
import re
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from fractions import Fraction

import psycopg
from psycopg import errors

from app.config import settings


# ---------------------------------------------------------------------------
# Parsing (pure functions — no database, no I/O)
# ---------------------------------------------------------------------------

_NON_MONEY = re.compile(r"[^\d.,]")
_NON_DIGIT = re.compile(r"\D")


def parse_money(text: str) -> int | None:
    """Parse a money amount as printed on an invoice into integer cents.

    Deterministic rules (no locale guessing):
    - currency symbols, letters, and spaces are stripped
    - "(5.00)" or a minus sign means negative
    - if both "," and "." appear, the rightmost one is the decimal separator
    - a single separator followed by 1-2 digits is a decimal separator;
      followed by 3+ digits it is a thousands separator ("1,234" = 1234.00)
    Returns None when the text cannot be parsed.
    """
    raw = text.strip()
    if not raw:
        return None
    negative = ("-" in raw) or (raw.startswith("(") and raw.endswith(")"))
    s = _NON_MONEY.sub("", raw)
    if not s or _NON_DIGIT.sub("", s) == "":
        return None

    last_dot, last_comma = s.rfind("."), s.rfind(",")
    decimal_sep: str | None
    if last_dot >= 0 and last_comma >= 0:
        decimal_sep = "." if last_dot > last_comma else ","
    elif last_dot >= 0 or last_comma >= 0:
        sep = "." if last_dot >= 0 else ","
        digits_after = len(s) - max(last_dot, last_comma) - 1
        one_separator = s.count(sep) == 1
        decimal_sep = sep if one_separator and 1 <= digits_after <= 2 else None
    else:
        decimal_sep = None

    if decimal_sep is not None:
        idx = s.rfind(decimal_sep)
        int_digits = _NON_DIGIT.sub("", s[:idx])
        frac_digits = _NON_DIGIT.sub("", s[idx + 1 :])
        if not (1 <= len(frac_digits) <= 2):
            return None
        cents = int(int_digits or "0") * 100 + int(frac_digits.ljust(2, "0"))
    else:
        cents = int(_NON_DIGIT.sub("", s)) * 100

    return -cents if negative else cents


def parse_quantity(text: str) -> Fraction | None:
    """Parse a quantity like "2.5" or "2,5" into an exact Fraction."""
    s = text.strip().replace(",", ".")
    if not s:
        return None
    try:
        return Fraction(Decimal(s))
    except (InvalidOperation, ValueError):
        return None


# ---------------------------------------------------------------------------
# Invoice validation (pure function)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ValidationError:
    code: str  # i18n key, translated by the frontend
    context: dict = field(default_factory=dict)


def validate_invoice(
    line_totals_cents: list[int],
    subtotal_cents: int,
    gst_cents: int,
    qst_cents: int,
    other_tax_cents: int,
    total_cents: int,
) -> list[ValidationError]:
    """Check that an invoice's numbers are internally consistent.

    Empty list means valid. This runs before anything reaches the
    ledger, and again inside post_invoice as a second line of defense.
    """
    problems: list[ValidationError] = []

    if not line_totals_cents:
        problems.append(ValidationError("invoiceError.noLines"))

    negatives = [
        c
        for c in (
            *line_totals_cents,
            subtotal_cents,
            gst_cents,
            qst_cents,
            other_tax_cents,
            total_cents,
        )
        if c < 0
    ]
    if negatives:
        problems.append(ValidationError("invoiceError.negativeAmount"))

    lines_sum = sum(line_totals_cents)
    if line_totals_cents and lines_sum != subtotal_cents:
        problems.append(
            ValidationError(
                "invoiceError.lineTotalsMismatch",
                {"linesSumCents": lines_sum, "subtotalCents": subtotal_cents},
            )
        )

    parts = subtotal_cents + gst_cents + qst_cents + other_tax_cents
    if parts != total_cents:
        problems.append(
            ValidationError(
                "invoiceError.totalMismatch",
                {"partsSumCents": parts, "totalCents": total_cents},
            )
        )

    return problems


# ---------------------------------------------------------------------------
# Ledger operations (database)
# ---------------------------------------------------------------------------


class LedgerError(Exception):
    """A ledger rule was violated. `code` is an i18n key."""

    def __init__(self, code: str, **context):
        super().__init__(code)
        self.code = code
        self.context = context


@dataclass(frozen=True)
class Balance:
    qty: int  # integer base units of the item (g / ml / each)
    cost_cents: int  # net spend recorded against the item


def post_invoice(conn: psycopg.Connection, invoice_id: int) -> list[int]:
    """Turn a fully-confirmed invoice into ledger entries (one per line).

    Transactional: either every entry is written and the invoice is
    marked posted, or nothing happens at all.
    """
    with conn.transaction():
        invoice = conn.execute(
            "SELECT * FROM invoices WHERE id = %s FOR UPDATE", (invoice_id,)
        ).fetchone()
        if invoice is None:
            raise LedgerError("ledgerError.invoiceNotFound", invoiceId=invoice_id)
        if invoice["status"] != "pending_review":
            raise LedgerError(
                "ledgerError.invoiceNotPending", status=invoice["status"]
            )

        lines = conn.execute(
            "SELECT * FROM invoice_lines WHERE invoice_id = %s ORDER BY id",
            (invoice_id,),
        ).fetchall()

        unconfirmed = [
            line["id"]
            for line in lines
            if line["item_id"] is None or line["qty_canonical"] is None
        ]
        if unconfirmed:
            raise LedgerError(
                "ledgerError.unconfirmedLines", lineIds=unconfirmed
            )

        problems = validate_invoice(
            [line["line_total_cents"] for line in lines],
            invoice["subtotal_cents"],
            invoice["gst_cents"],
            invoice["qst_cents"],
            invoice["other_tax_cents"],
            invoice["total_cents"],
        )
        if problems:
            raise LedgerError(
                "ledgerError.validationFailed",
                errors=[(p.code, p.context) for p in problems],
            )

        entry_ids = []
        for line in lines:
            row = conn.execute(
                """
                INSERT INTO ledger_entries
                    (item_id, entry_type, qty_delta, cost_delta_cents,
                     occurred_on, source_type, source_id)
                VALUES (%s, 'purchase', %s, %s, %s, 'invoice_line', %s)
                RETURNING id
                """,
                (
                    line["item_id"],
                    line["qty_canonical"],
                    line["line_total_cents"],
                    invoice["invoice_date"],
                    line["id"],
                ),
            ).fetchone()
            entry_ids.append(row["id"])

        conn.execute(
            "UPDATE invoices SET status = 'posted' WHERE id = %s", (invoice_id,)
        )
    return entry_ids


def item_balance(
    conn: psycopg.Connection, item_id: int, as_of: datetime.date | None = None
) -> Balance:
    """Sum of an item's entries — all of them, or only those dated on or
    before `as_of` (the balance at the end of that day)."""
    row = conn.execute(
        """
        SELECT COALESCE(SUM(qty_delta), 0) AS qty,
               COALESCE(SUM(cost_delta_cents), 0) AS cost
        FROM ledger_entries
        WHERE item_id = %s
          AND (%s::date IS NULL OR occurred_on <= %s::date)
        """,
        (item_id, as_of, as_of),
    ).fetchone()
    return Balance(qty=row["qty"], cost_cents=row["cost"])


def all_balances(conn: psycopg.Connection) -> dict[int, Balance]:
    rows = conn.execute(
        """
        SELECT item_id,
               SUM(qty_delta) AS qty,
               SUM(cost_delta_cents) AS cost
        FROM ledger_entries GROUP BY item_id
        """
    ).fetchall()
    return {
        row["item_id"]: Balance(qty=row["qty"], cost_cents=row["cost"])
        for row in rows
    }


def post_stocktake(conn: psycopg.Connection, stocktake_id: int) -> list[int]:
    """Record counted stock levels as adjustment entries.

    For each counted item: delta = counted - balance at the END OF THE
    COUNT DAY. Not the balance now: an invoice dated after the count but
    posted before this stocktake would otherwise be wrongly cancelled out.
    Cost is untouched — a stocktake corrects quantity, not money spent.
    """
    with conn.transaction():
        # count_date = the calendar day of the count, in the restaurant's zone
        stocktake = conn.execute(
            """
            SELECT *, (taken_at AT TIME ZONE %s)::date AS count_date
            FROM stocktakes WHERE id = %s FOR UPDATE
            """,
            (settings.restaurant_timezone, stocktake_id),
        ).fetchone()
        if stocktake is None:
            raise LedgerError(
                "ledgerError.stocktakeNotFound", stocktakeId=stocktake_id
            )
        if stocktake["posted_at"] is not None:
            raise LedgerError("ledgerError.stocktakeAlreadyPosted")

        lines = conn.execute(
            "SELECT * FROM stocktake_lines WHERE stocktake_id = %s ORDER BY id",
            (stocktake_id,),
        ).fetchall()

        entry_ids = []
        for line in lines:
            delta = line["counted_qty_canonical"] - item_balance(
                conn, line["item_id"], as_of=stocktake["count_date"]
            ).qty
            if delta == 0:
                continue
            row = conn.execute(
                """
                INSERT INTO ledger_entries
                    (item_id, entry_type, qty_delta, cost_delta_cents,
                     occurred_on, source_type, source_id)
                VALUES (%s, 'stocktake_adjustment', %s, 0, %s,
                        'stocktake_line', %s)
                RETURNING id
                """,
                (
                    line["item_id"],
                    delta,
                    stocktake["count_date"],
                    line["id"],
                ),
            ).fetchone()
            entry_ids.append(row["id"])

        conn.execute(
            "UPDATE stocktakes SET posted_at = now() WHERE id = %s",
            (stocktake_id,),
        )
    return entry_ids


def reverse_entry(conn: psycopg.Connection, entry_id: int) -> int:
    """Append the exact opposite of an existing entry (never edits it).

    The database guarantees an entry can only be reversed once.
    """
    with conn.transaction():
        entry = conn.execute(
            "SELECT * FROM ledger_entries WHERE id = %s", (entry_id,)
        ).fetchone()
        if entry is None:
            raise LedgerError("ledgerError.entryNotFound", entryId=entry_id)
        try:
            row = conn.execute(
                """
                INSERT INTO ledger_entries
                    (item_id, entry_type, qty_delta, cost_delta_cents,
                     occurred_on, source_type, source_id, reverses_entry_id)
                VALUES (%s, 'reversal', %s, %s,
                        (now() AT TIME ZONE %s)::date,  -- today, restaurant time
                        'ledger_entry', %s, %s)
                RETURNING id
                """,
                (
                    entry["item_id"],
                    -entry["qty_delta"],
                    -entry["cost_delta_cents"],
                    settings.restaurant_timezone,
                    entry_id,
                    entry_id,
                ),
            ).fetchone()
        except errors.UniqueViolation:
            raise LedgerError(
                "ledgerError.alreadyReversed", entryId=entry_id
            ) from None
    return row["id"]
