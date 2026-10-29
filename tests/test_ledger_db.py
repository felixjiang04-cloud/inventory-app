"""Ledger operations against real Postgres (the Neon test branch).

Uses the rolled-back `conn` fixture from conftest.py — no test leaves
data behind.
"""

import datetime

import pytest
from psycopg import errors

from app.ledger import (
    Balance,
    LedgerError,
    item_balance,
    all_balances,
    post_invoice,
    post_stocktake,
    reverse_entry,
)
from app.config import settings


@pytest.fixture(autouse=True)
def montreal_time(monkeypatch):
    """These tests are written in Montreal local time, whatever .env says."""
    monkeypatch.setattr(settings, "restaurant_timezone", "America/Toronto")


# --- seed helpers ----------------------------------------------------------


def make_supplier(conn, name: str = "Marché Test") -> int:
    return conn.execute(
        "INSERT INTO suppliers (name) VALUES (%s) RETURNING id", (name,)
    ).fetchone()["id"]


def make_item(conn, name: str, base_unit: str = "g") -> int:
    return conn.execute(
        "INSERT INTO items (name, base_unit) VALUES (%s, %s) RETURNING id",
        (name, base_unit),
    ).fetchone()["id"]


def make_invoice(
    conn,
    supplier_id: int,
    lines,
    gst: int = 0,
    qst: int = 0,
    invoice_date: datetime.date = datetime.date(2026, 7, 15),
) -> int:
    """lines: list of (raw_text, quantity, line_total_cents, item_id, qty_canonical)."""
    subtotal = sum(line[2] for line in lines)
    invoice_id = conn.execute(
        """
        INSERT INTO invoices (supplier_id, invoice_date, subtotal_cents,
                              gst_cents, qst_cents, total_cents)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """,
        (
            supplier_id,
            invoice_date,
            subtotal,
            gst,
            qst,
            subtotal + gst + qst,
        ),
    ).fetchone()["id"]
    for raw, qty, cents, item_id, qty_canonical in lines:
        conn.execute(
            """
            INSERT INTO invoice_lines (invoice_id, raw_text, quantity,
                                       line_total_cents, item_id, qty_canonical)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (invoice_id, raw, qty, cents, item_id, qty_canonical),
        )
    return invoice_id


def make_stocktake(conn, counts: dict[int, int], taken_at: str | None = None) -> int:
    """taken_at: e.g. "2026-07-20 23:30 America/Toronto"; default = now."""
    stocktake_id = conn.execute(
        """
        INSERT INTO stocktakes (taken_at)
        VALUES (COALESCE(%s::timestamptz, now())) RETURNING id
        """,
        (taken_at,),
    ).fetchone()["id"]
    for item_id, counted in counts.items():
        conn.execute(
            """
            INSERT INTO stocktake_lines (stocktake_id, item_id,
                                         counted_qty_canonical)
            VALUES (%s, %s, %s)
            """,
            (stocktake_id, item_id, counted),
        )
    return stocktake_id


# --- tests -----------------------------------------------------------------


def test_post_invoice_creates_entries_and_balances(conn) -> None:
    supplier = make_supplier(conn)
    tomatoes = make_item(conn, "Tomates Roma")
    oil = make_item(conn, "Huile d'olive", base_unit="ml")
    invoice = make_invoice(
        conn,
        supplier,
        [
            # qty_canonical is the line's TOTAL: 2 cases x 5 kg = 10000 g
            ("ROMA TOM 5KG", 2, 3000, tomatoes, 10000),
            ("HUILE OLIVE 3L", 1, 2500, oil, 3000),
        ],
        gst=275,
        qst=549,
    )

    entry_ids = post_invoice(conn, invoice)

    assert len(entry_ids) == 2
    assert item_balance(conn, tomatoes) == Balance(qty=10000, cost_cents=3000)
    assert item_balance(conn, oil) == Balance(qty=3000, cost_cents=2500)
    status = conn.execute(
        "SELECT status FROM invoices WHERE id = %s", (invoice,)
    ).fetchone()["status"]
    assert status == "posted"


def test_posting_twice_is_rejected(conn) -> None:
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    invoice = make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)])
    post_invoice(conn, invoice)

    with pytest.raises(LedgerError) as excinfo:
        post_invoice(conn, invoice)
    assert excinfo.value.code == "ledgerError.invoiceNotPending"


def test_unconfirmed_line_blocks_posting(conn) -> None:
    supplier = make_supplier(conn)
    invoice = make_invoice(
        conn, supplier, [("MYSTERY ITEM", 1, 999, None, None)]
    )

    with pytest.raises(LedgerError) as excinfo:
        post_invoice(conn, invoice)
    assert excinfo.value.code == "ledgerError.unconfirmedLines"
    # and nothing reached the ledger
    assert all_balances(conn) == {}


def test_stocktake_adjusts_balance_but_not_cost(conn) -> None:
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    invoice = make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)])
    post_invoice(conn, invoice)

    stocktake = make_stocktake(conn, {rice: 3800})
    entry_ids = post_stocktake(conn, stocktake)

    assert len(entry_ids) == 1
    assert item_balance(conn, rice) == Balance(qty=3800, cost_cents=2000)


def test_stocktake_matching_balance_writes_nothing(conn) -> None:
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    invoice = make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)])
    post_invoice(conn, invoice)

    stocktake = make_stocktake(conn, {rice: 10000})
    assert post_stocktake(conn, stocktake) == []
    assert item_balance(conn, rice) == Balance(qty=10000, cost_cents=2000)


def test_stocktake_ignores_invoice_dated_after_the_count(conn) -> None:
    # Count on Jul 20; a delivery dated Jul 21 gets posted BEFORE the count
    # is posted. The count must be compared with the Jul 20 balance only.
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    post_invoice(conn, make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)]))
    stocktake = make_stocktake(
        conn, {rice: 3800}, taken_at="2026-07-20 15:00 America/Toronto"
    )
    later = make_invoice(
        conn,
        supplier,
        [("RIZ 5KG", 1, 1000, rice, 5000)],
        invoice_date=datetime.date(2026, 7, 21),
    )
    post_invoice(conn, later)

    post_stocktake(conn, stocktake)

    # what was counted, plus the delivery that came after the count
    assert item_balance(conn, rice).qty == 3800 + 5000
    assert item_balance(conn, rice, as_of=datetime.date(2026, 7, 20)).qty == 3800


def test_stocktake_treats_same_day_invoice_as_already_counted(conn) -> None:
    # End-of-day rule: goods invoiced on the count day were on the shelf.
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    post_invoice(conn, make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)]))
    same_day = make_invoice(
        conn,
        supplier,
        [("RIZ 5KG", 1, 1000, rice, 5000)],
        invoice_date=datetime.date(2026, 7, 20),
    )
    post_invoice(conn, same_day)
    stocktake = make_stocktake(
        conn, {rice: 3800}, taken_at="2026-07-20 15:00 America/Toronto"
    )

    post_stocktake(conn, stocktake)

    assert item_balance(conn, rice).qty == 3800


def test_late_evening_count_is_dated_in_restaurant_time(conn) -> None:
    # 23:30 in Montreal is already 03:30 the next day in UTC.
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    post_invoice(conn, make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)]))
    next_morning = make_invoice(
        conn,
        supplier,
        [("RIZ 5KG", 1, 1000, rice, 5000)],
        invoice_date=datetime.date(2026, 7, 21),
    )
    post_invoice(conn, next_morning)
    stocktake = make_stocktake(
        conn, {rice: 3800}, taken_at="2026-07-20 23:30 America/Toronto"
    )

    (entry_id,) = post_stocktake(conn, stocktake)

    entry = conn.execute(
        "SELECT occurred_on, qty_delta FROM ledger_entries WHERE id = %s",
        (entry_id,),
    ).fetchone()
    assert entry["occurred_on"] == datetime.date(2026, 7, 20)
    assert entry["qty_delta"] == 3800 - 10000  # next morning's delivery excluded


def test_reversal_is_dated_today_in_restaurant_time(conn) -> None:
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    (entry_id,) = post_invoice(
        conn, make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)])
    )

    reversal_id = reverse_entry(conn, entry_id)

    row = conn.execute(
        """
        SELECT occurred_on = (now() AT TIME ZONE 'America/Toronto')::date
               AS is_local_today
        FROM ledger_entries WHERE id = %s
        """,
        (reversal_id,),
    ).fetchone()
    assert row["is_local_today"]


def test_reversal_restores_balance_and_cannot_repeat(conn) -> None:
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    invoice = make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)])
    (entry_id,) = post_invoice(conn, invoice)

    reverse_entry(conn, entry_id)
    assert item_balance(conn, rice) == Balance(qty=0, cost_cents=0)

    with pytest.raises(LedgerError) as excinfo:
        reverse_entry(conn, entry_id)
    assert excinfo.value.code == "ledgerError.alreadyReversed"


def test_ledger_is_append_only_at_database_level(conn) -> None:
    supplier = make_supplier(conn)
    rice = make_item(conn, "Riz")
    invoice = make_invoice(conn, supplier, [("RIZ 10KG", 1, 2000, rice, 10000)])
    (entry_id,) = post_invoice(conn, invoice)

    with pytest.raises(errors.RaiseException):
        with conn.transaction():
            conn.execute(
                "UPDATE ledger_entries SET qty_delta = 1 WHERE id = %s",
                (entry_id,),
            )
    with pytest.raises(errors.RaiseException):
        with conn.transaction():
            conn.execute(
                "DELETE FROM ledger_entries WHERE id = %s", (entry_id,)
            )
    # entry is untouched
    assert item_balance(conn, rice) == Balance(qty=10000, cost_cents=2000)
