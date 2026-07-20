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


def make_invoice(conn, supplier_id: int, lines, gst: int = 0, qst: int = 0) -> int:
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
            datetime.date(2026, 7, 15),
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


def make_stocktake(conn, counts: dict[int, int]) -> int:
    stocktake_id = conn.execute(
        "INSERT INTO stocktakes DEFAULT VALUES RETURNING id"
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
