"""Turning the AI's transcription into a form draft.

Mostly pure functions; the supplier-suggestion test uses the database.
"""

import datetime

import pytest

from app.extraction import build_draft, format_cents, parse_invoice_date, suggest_supplier


def answer(**overrides) -> dict:
    """A clean AI answer for a two-line invoice; override any part."""
    base = {
        "supplier_name": "Marché Central",
        "invoice_number": "F-1001",
        "invoice_date": "2026-10-01",
        "lines": [
            {"description": "TOMATE ROMA 5KG", "quantity": "2", "line_total": "30,00"},
            {"description": "HUILE OLIVE 3L", "quantity": "1", "line_total": "25.00"},
        ],
        "subtotal": "55,00",
        "gst": "2,75",
        "qst": "5,49",
        "other_tax": "",
        "total": "63,24",
    }
    base.update(overrides)
    return base


def codes(draft) -> list[str]:
    return [p.code for p in draft.problems]


# --- clean and messy values -----------------------------------------------------


def test_clean_answer_gives_a_ready_draft_with_no_problems() -> None:
    draft = build_draft(answer())

    assert draft.problems == []
    assert draft.invoice_date == "2026-10-01"
    assert draft.lines[0] == {
        "raw_text": "TOMATE ROMA 5KG",
        "quantity": "2",
        "line_total": "30.00",
    }
    assert (draft.subtotal, draft.gst, draft.qst, draft.total) == (
        "55.00",
        "2.75",
        "5.49",
        "63.24",
    )
    assert draft.other_tax == "0"  # not printed = no such tax


def test_messy_printed_amounts_are_parsed_like_typed_ones() -> None:
    draft = build_draft(
        answer(
            lines=[{"description": "RIZ 10KG", "quantity": "1,5", "line_total": "1 234,56 $"}],
            subtotal="$1,234.56",
            gst="0",
            qst="0",
            total="1234.56",
        )
    )
    assert draft.problems == []
    assert draft.lines[0]["quantity"] == "1.5"
    assert draft.lines[0]["line_total"] == "1234.56"


def test_unreadable_amount_is_kept_as_read_and_flagged() -> None:
    draft = build_draft(answer(qst="cinq"))
    assert draft.qst == "cinq"  # left for the person to fix
    (problem,) = draft.problems
    assert problem.code == "extractionError.unreadable"
    assert problem.context == {"field": "qst", "read": "cinq"}


def test_quantity_with_a_unit_is_flagged_with_its_line_number() -> None:
    lines = answer()["lines"]
    lines[1]["quantity"] = "1 CS"
    (problem,) = build_draft(answer(lines=lines)).problems
    assert problem.code == "extractionError.unreadable"
    assert problem.context == {"field": "quantity", "read": "1 CS", "line": 2}


def test_missing_total_is_flagged() -> None:
    assert codes(build_draft(answer(total=""))) == ["extractionError.missing"]


def test_totals_that_dont_add_up_are_flagged_not_fixed() -> None:
    draft = build_draft(answer(total="99,99"))
    assert draft.total == "99.99"  # never "corrected"
    assert codes(draft) == ["invoiceError.totalMismatch"]


def test_empty_rows_are_skipped() -> None:
    lines = answer()["lines"] + [{"description": "", "quantity": "", "line_total": ""}]
    assert len(build_draft(answer(lines=lines)).lines) == 2


def test_bare_numbers_from_the_model_are_accepted() -> None:
    draft = build_draft(
        answer(
            lines=[{"description": "RIZ", "quantity": 2, "line_total": 20.5}],
            subtotal=20.5,
            gst=0,
            qst=0,
            total="20,50",
        )
    )
    assert draft.problems == []
    assert draft.lines[0]["line_total"] == "20.50"


def test_no_lines_read_is_flagged() -> None:
    assert "invoiceError.noLines" in codes(build_draft(answer(lines=[])))


def test_cents_format_for_the_form() -> None:
    assert format_cents(123456) == "1234.56"
    assert format_cents(5) == "0.05"
    assert format_cents(-500) == "-5.00"


# --- dates: read for sure, or not at all ----------------------------------------


@pytest.mark.parametrize(
    ("printed", "expected"),
    [
        ("2026-10-01", datetime.date(2026, 10, 1)),
        ("2026/10/01", datetime.date(2026, 10, 1)),
        ("2026年10月1日", datetime.date(2026, 10, 1)),
        ("25/10/2026", datetime.date(2026, 10, 25)),  # 25 can only be a day
        ("10/25/2026", datetime.date(2026, 10, 25)),
        ("05/05/2026", datetime.date(2026, 5, 5)),  # same either way
        ("1er octobre 2026", datetime.date(2026, 10, 1)),
        ("1 oct. 2026", datetime.date(2026, 10, 1)),
        ("Oct. 1, 2026", datetime.date(2026, 10, 1)),
        ("15 août 2026", datetime.date(2026, 8, 15)),
        ("03/04/2026", None),  # March 4 or April 3? Never guess.
        ("31/02/2026", None),  # no such day
        ("01/10/26", None),  # two-digit year
        ("", None),
        ("bientôt", None),
    ],
)
def test_invoice_dates(printed, expected) -> None:
    assert parse_invoice_date(printed) == expected


def test_unclear_date_is_left_blank_and_flagged() -> None:
    draft = build_draft(answer(invoice_date="03/04/2026"))
    assert draft.invoice_date == ""
    assert draft.invoice_date_read == "03/04/2026"
    (problem,) = draft.problems
    assert problem.code == "extractionError.dateUnclear"


# --- supplier suggestion (database) ------------------------------------------------


def test_supplier_is_suggested_by_fuzzy_name(conn) -> None:
    marche = conn.execute(
        "INSERT INTO suppliers (name) VALUES ('Marché Central') RETURNING id"
    ).fetchone()["id"]
    conn.execute("INSERT INTO suppliers (name) VALUES ('Boulangerie Rive-Sud')")

    assert suggest_supplier(conn, "MARCHÉ CENTRAL INC.") == marche
    assert suggest_supplier(conn, "Poissonnerie du Port") is None
    assert suggest_supplier(conn, "") is None


def test_supplier_problems_say_what_happened(conn) -> None:
    from app.extraction import draft_from_answer

    unknown = draft_from_answer(conn, answer(supplier_name="Poissonnerie du Port"))
    assert ("extractionError.unknownSupplier", {"name": "Poissonnerie du Port"}) in [
        (p.code, p.context) for p in unknown.problems
    ]

    unread = draft_from_answer(conn, answer(supplier_name=""))
    assert ("extractionError.missing", {"field": "supplier", "read": ""}) in [
        (p.code, p.context) for p in unread.problems
    ]
    assert "extractionError.unknownSupplier" not in [p.code for p in unread.problems]
