from fractions import Fraction

from app.ledger import parse_money, parse_quantity, validate_invoice


# --- parse_money -----------------------------------------------------------


def test_plain_decimal() -> None:
    assert parse_money("12.34") == 1234


def test_french_decimal_comma() -> None:
    assert parse_money("12,34") == 1234


def test_currency_symbol_and_thousands() -> None:
    assert parse_money("$1,234.56") == 123456


def test_french_thousands_space() -> None:
    assert parse_money("1 234,56") == 123456


def test_whole_number_is_dollars() -> None:
    assert parse_money("12") == 1200


def test_single_comma_with_three_digits_is_thousands() -> None:
    assert parse_money("1,234") == 123400


def test_parenthesized_is_negative() -> None:
    assert parse_money("(5.00)") == -500


def test_unparseable_returns_none() -> None:
    assert parse_money("") is None
    assert parse_money("N/A") is None
    assert parse_money("..") is None


# --- parse_quantity --------------------------------------------------------


def test_quantity_decimal_point_and_comma() -> None:
    assert parse_quantity("2.5") == Fraction(5, 2)
    assert parse_quantity("2,5") == Fraction(5, 2)


def test_quantity_unparseable_returns_none() -> None:
    assert parse_quantity("beaucoup") is None
    assert parse_quantity("") is None


# --- validate_invoice ------------------------------------------------------


def test_consistent_invoice_has_no_errors() -> None:
    # two lines, GST 5% and QST 9.975% as printed on a real QC invoice
    errors = validate_invoice(
        line_totals_cents=[1000, 2350],
        subtotal_cents=3350,
        gst_cents=168,
        qst_cents=334,
        other_tax_cents=0,
        total_cents=3852,
    )
    assert errors == []


def test_line_totals_off_by_one_cent_is_rejected() -> None:
    errors = validate_invoice(
        line_totals_cents=[1000, 2349],
        subtotal_cents=3350,
        gst_cents=168,
        qst_cents=334,
        other_tax_cents=0,
        total_cents=3852,
    )
    assert [e.code for e in errors] == ["invoiceError.lineTotalsMismatch"]
    assert errors[0].context == {"linesSumCents": 3349, "subtotalCents": 3350}


def test_total_not_matching_parts_is_rejected() -> None:
    errors = validate_invoice(
        line_totals_cents=[3350],
        subtotal_cents=3350,
        gst_cents=168,
        qst_cents=334,
        other_tax_cents=0,
        total_cents=3900,
    )
    assert [e.code for e in errors] == ["invoiceError.totalMismatch"]


def test_empty_invoice_is_rejected() -> None:
    errors = validate_invoice(
        line_totals_cents=[],
        subtotal_cents=0,
        gst_cents=0,
        qst_cents=0,
        other_tax_cents=0,
        total_cents=0,
    )
    assert [e.code for e in errors] == ["invoiceError.noLines"]


def test_negative_amount_is_rejected() -> None:
    errors = validate_invoice(
        line_totals_cents=[-500, 4000],
        subtotal_cents=3500,
        gst_cents=0,
        qst_cents=0,
        other_tax_cents=0,
        total_cents=3500,
    )
    assert "invoiceError.negativeAmount" in [e.code for e in errors]
