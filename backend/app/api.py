"""HTTP API for the review/confirm workflow.

Error payloads are always {"code": <i18n key>, "context": {...}} —
never English sentences. The frontend translates the code.
"""

import datetime
from decimal import Decimal
from fractions import Fraction
from typing import Literal

import psycopg
from fastapi import APIRouter, Depends, HTTPException
from psycopg import errors
from pydantic import BaseModel, Field

from app.deps import get_db
from app.ledger import (
    LedgerError,
    item_balance,
    parse_money,
    parse_quantity,
    post_invoice,
    validate_invoice,
)
from app.units import guess_qty_per_unit

router = APIRouter(prefix="/api")


def _error(status: int, code: str, **context) -> HTTPException:
    return HTTPException(status, detail={"code": code, "context": context})


# ---------------------------------------------------------------------------
# Suppliers and items
# ---------------------------------------------------------------------------


class SupplierIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ItemIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    base_unit: Literal["g", "ml", "each"]


@router.get("/suppliers")
def list_suppliers(conn: psycopg.Connection = Depends(get_db)):
    return conn.execute("SELECT id, name FROM suppliers ORDER BY name").fetchall()


@router.post("/suppliers", status_code=201)
def create_supplier(body: SupplierIn, conn: psycopg.Connection = Depends(get_db)):
    try:
        with conn.transaction():
            return conn.execute(
                "INSERT INTO suppliers (name) VALUES (%s) RETURNING id, name",
                (body.name.strip(),),
            ).fetchone()
    except errors.UniqueViolation:
        raise _error(409, "apiError.duplicateName", name=body.name.strip()) from None


@router.get("/items")
def list_items(conn: psycopg.Connection = Depends(get_db)):
    return conn.execute(
        "SELECT id, name, base_unit FROM items WHERE active ORDER BY name"
    ).fetchall()


@router.post("/items", status_code=201)
def create_item(body: ItemIn, conn: psycopg.Connection = Depends(get_db)):
    try:
        with conn.transaction():
            return conn.execute(
                """
                INSERT INTO items (name, base_unit)
                VALUES (%s, %s) RETURNING id, name, base_unit
                """,
                (body.name.strip(), body.base_unit),
            ).fetchone()
    except errors.UniqueViolation:
        raise _error(409, "apiError.duplicateName", name=body.name.strip()) from None


# ---------------------------------------------------------------------------
# Invoice entry
# ---------------------------------------------------------------------------


class InvoiceLineIn(BaseModel):
    raw_text: str = Field(min_length=1)
    quantity: str  # user-typed, parsed deterministically below
    line_total: str


class InvoiceIn(BaseModel):
    supplier_id: int
    invoice_date: datetime.date
    invoice_number: str | None = None
    lines: list[InvoiceLineIn]
    subtotal: str
    gst: str = "0"
    qst: str = "0"
    other_tax: str = "0"
    total: str


@router.post("/invoices", status_code=201)
def create_invoice(body: InvoiceIn, conn: psycopg.Connection = Depends(get_db)):
    field_errors: list[dict] = []

    def money(field: str, text: str) -> int:
        cents = parse_money(text)
        if cents is None:
            field_errors.append(
                {"code": "invoiceError.badNumber", "context": {"field": field}}
            )
            return 0
        return cents

    subtotal = money("subtotal", body.subtotal)
    gst = money("gst", body.gst)
    qst = money("qst", body.qst)
    other_tax = money("other_tax", body.other_tax)
    total = money("total", body.total)

    parsed_lines: list[tuple[str, Fraction, int]] = []
    for index, line in enumerate(body.lines):
        quantity = parse_quantity(line.quantity)
        if quantity is None or quantity <= 0:
            field_errors.append(
                {
                    "code": "invoiceError.badNumber",
                    "context": {"field": "quantity", "line": index + 1},
                }
            )
            quantity = Fraction(1)
        cents = money(f"line_total:{index + 1}", line.line_total)
        parsed_lines.append((line.raw_text.strip(), quantity, cents))

    if field_errors:
        raise HTTPException(422, detail={"errors": field_errors})

    problems = validate_invoice(
        [cents for _, _, cents in parsed_lines], subtotal, gst, qst, other_tax, total
    )
    if problems:
        raise HTTPException(
            422,
            detail={
                "errors": [{"code": p.code, "context": p.context} for p in problems]
            },
        )

    supplier = conn.execute(
        "SELECT id FROM suppliers WHERE id = %s", (body.supplier_id,)
    ).fetchone()
    if supplier is None:
        raise _error(404, "apiError.supplierNotFound", supplierId=body.supplier_id)

    with conn.transaction():
        invoice = conn.execute(
            """
            INSERT INTO invoices (supplier_id, invoice_number, invoice_date,
                                  subtotal_cents, gst_cents, qst_cents,
                                  other_tax_cents, total_cents)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                body.supplier_id,
                body.invoice_number,
                body.invoice_date,
                subtotal,
                gst,
                qst,
                other_tax,
                total,
            ),
        ).fetchone()

        auto_confirmed = 0
        for raw_text, quantity, cents in parsed_lines:
            # "confirm once, reused forever": a previously confirmed alias
            # fills in the item and quantity automatically.
            alias = conn.execute(
                """
                SELECT item_id, qty_per_unit FROM item_aliases
                WHERE supplier_id = %s AND raw_text = %s
                      AND confirmed_at IS NOT NULL
                """,
                (body.supplier_id, raw_text),
            ).fetchone()
            item_id = qty_canonical = None
            if alias is not None:
                item_id = alias["item_id"]
                qty_canonical = int(
                    quantity * alias["qty_per_unit"] + Fraction(1, 2)
                )
                auto_confirmed += 1
            # exact Fraction -> exact Decimal for the numeric column
            # (parse_quantity only ever produces terminating decimals)
            db_quantity = Decimal(quantity.numerator) / Decimal(quantity.denominator)
            conn.execute(
                """
                INSERT INTO invoice_lines (invoice_id, raw_text, quantity,
                                           line_total_cents, item_id, qty_canonical)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (invoice["id"], raw_text, db_quantity, cents, item_id, qty_canonical),
            )

    return {
        "id": invoice["id"],
        "status": "pending_review",
        "autoConfirmedLines": auto_confirmed,
    }


# ---------------------------------------------------------------------------
# Review queue
# ---------------------------------------------------------------------------


@router.get("/invoices")
def list_invoices(
    status: str = "pending_review", conn: psycopg.Connection = Depends(get_db)
):
    return conn.execute(
        """
        SELECT i.id, s.name AS supplier_name, i.invoice_number,
               i.invoice_date, i.total_cents, i.status,
               COUNT(l.id) AS line_count,
               COUNT(l.id) FILTER (WHERE l.item_id IS NULL) AS unconfirmed_lines
        FROM invoices i
        JOIN suppliers s ON s.id = i.supplier_id
        LEFT JOIN invoice_lines l ON l.invoice_id = i.id
        WHERE i.status = %s
        GROUP BY i.id, s.name
        ORDER BY i.invoice_date DESC, i.id DESC
        """,
        (status,),
    ).fetchall()


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: int, conn: psycopg.Connection = Depends(get_db)):
    invoice = conn.execute(
        """
        SELECT i.*, s.name AS supplier_name
        FROM invoices i JOIN suppliers s ON s.id = i.supplier_id
        WHERE i.id = %s
        """,
        (invoice_id,),
    ).fetchone()
    if invoice is None:
        raise _error(404, "apiError.invoiceNotFound", invoiceId=invoice_id)

    lines = conn.execute(
        """
        SELECT l.id, l.raw_text, l.quantity, l.line_total_cents,
               l.item_id, l.qty_canonical, it.name AS item_name,
               it.base_unit AS item_base_unit
        FROM invoice_lines l LEFT JOIN items it ON it.id = l.item_id
        WHERE l.invoice_id = %s ORDER BY l.id
        """,
        (invoice_id,),
    ).fetchall()

    for line in lines:
        guess = guess_qty_per_unit(line["raw_text"])
        line["prefill"] = (
            {"baseUnit": guess[0], "qtyPerUnit": guess[1]} if guess else None
        )
        line["quantity"] = str(line["quantity"])  # Decimal -> JSON-safe string

    invoice["lines"] = lines
    return invoice


@router.get("/invoice-lines/{line_id}/suggestions")
def line_suggestions(line_id: int, conn: psycopg.Connection = Depends(get_db)):
    line = conn.execute(
        """
        SELECT l.raw_text, i.supplier_id
        FROM invoice_lines l JOIN invoices i ON i.id = l.invoice_id
        WHERE l.id = %s
        """,
        (line_id,),
    ).fetchone()
    if line is None:
        raise _error(404, "apiError.lineNotFound", lineId=line_id)

    # Deterministic trigram similarity against catalog names AND known
    # confirmed spellings; the best score per item wins.
    rows = conn.execute(
        """
        SELECT item_id, name, base_unit, qty_per_unit, MAX(score) AS score
        FROM (
            SELECT it.id AS item_id, it.name, it.base_unit,
                   NULL::bigint AS qty_per_unit,
                   similarity(it.name, %(text)s) AS score
            FROM items it WHERE it.active
            UNION ALL
            SELECT a.item_id, it.name, it.base_unit,
                   a.qty_per_unit,
                   similarity(a.raw_text, %(text)s) AS score
            FROM item_aliases a JOIN items it ON it.id = a.item_id
            WHERE a.confirmed_at IS NOT NULL
        ) candidates
        WHERE score > 0.1
        GROUP BY item_id, name, base_unit, qty_per_unit
        ORDER BY MAX(score) DESC
        LIMIT 5
        """,
        {"text": line["raw_text"]},
    ).fetchall()
    return rows


# ---------------------------------------------------------------------------
# Confirmation and posting
# ---------------------------------------------------------------------------


class ConfirmLineIn(BaseModel):
    item_id: int
    qty_per_unit: int = Field(gt=0)  # base units per ONE invoice unit


@router.put("/invoice-lines/{line_id}/confirm")
def confirm_line(
    line_id: int, body: ConfirmLineIn, conn: psycopg.Connection = Depends(get_db)
):
    line = conn.execute(
        """
        SELECT l.id, l.raw_text, l.quantity, i.supplier_id, i.status
        FROM invoice_lines l JOIN invoices i ON i.id = l.invoice_id
        WHERE l.id = %s
        """,
        (line_id,),
    ).fetchone()
    if line is None:
        raise _error(404, "apiError.lineNotFound", lineId=line_id)
    if line["status"] != "pending_review":
        raise _error(409, "ledgerError.invoiceNotPending", status=line["status"])

    item = conn.execute(
        "SELECT id, name, base_unit FROM items WHERE id = %s AND active",
        (body.item_id,),
    ).fetchone()
    if item is None:
        raise _error(404, "apiError.itemNotFound", itemId=body.item_id)

    qty_canonical = int(
        Fraction(line["quantity"]) * body.qty_per_unit + Fraction(1, 2)
    )
    with conn.transaction():
        conn.execute(
            "UPDATE invoice_lines SET item_id = %s, qty_canonical = %s WHERE id = %s",
            (body.item_id, qty_canonical, line_id),
        )
        conn.execute(
            """
            INSERT INTO item_aliases (supplier_id, raw_text, item_id,
                                      qty_per_unit, confirmed_at)
            VALUES (%s, %s, %s, %s, now())
            ON CONFLICT (supplier_id, raw_text)
            DO UPDATE SET item_id = EXCLUDED.item_id,
                          qty_per_unit = EXCLUDED.qty_per_unit,
                          confirmed_at = now()
            """,
            (line["supplier_id"], line["raw_text"], body.item_id, body.qty_per_unit),
        )
    return {
        "id": line_id,
        "item_id": body.item_id,
        "item_name": item["name"],
        "item_base_unit": item["base_unit"],
        "qty_canonical": qty_canonical,
    }


@router.post("/invoices/{invoice_id}/post")
def post_invoice_endpoint(
    invoice_id: int, conn: psycopg.Connection = Depends(get_db)
):
    entry_ids = post_invoice(conn, invoice_id)  # raises LedgerError -> 409

    balances = conn.execute(
        """
        SELECT DISTINCT l.item_id, it.name, it.base_unit
        FROM invoice_lines l JOIN items it ON it.id = l.item_id
        WHERE l.invoice_id = %s
        """,
        (invoice_id,),
    ).fetchall()
    for row in balances:
        balance = item_balance(conn, row["item_id"])
        row["qty"] = balance.qty
        row["cost_cents"] = balance.cost_cents
    return {"entryIds": entry_ids, "balances": balances}
