"""API workflow tests: entry form -> review queue -> confirm -> post."""


def make_supplier(client, name="Marché API") -> int:
    response = client.post("/api/suppliers", json={"name": name})
    assert response.status_code == 201
    return response.json()["id"]


def make_item(client, name, base_unit="g") -> int:
    response = client.post("/api/items", json={"name": name, "base_unit": base_unit})
    assert response.status_code == 201
    return response.json()["id"]


def make_invoice(client, supplier_id, **overrides):
    payload = {
        "supplier_id": supplier_id,
        "invoice_date": "2026-07-18",
        "invoice_number": "F-1001",
        "lines": [
            {"raw_text": "TOMATE ROMA 5KG", "quantity": "2", "line_total": "30.00"},
            {"raw_text": "HUILE OLIVE 3L", "quantity": "1", "line_total": "25,00"},
        ],
        "subtotal": "55.00",
        "gst": "2.75",
        "qst": "5.49",
        "total": "63.24",
    }
    payload.update(overrides)
    return client.post("/api/invoices", json=payload)


def test_full_workflow_entry_confirm_post(client, conn) -> None:
    supplier = make_supplier(client)
    tomatoes = make_item(client, "Tomates Roma")
    oil = make_item(client, "Huile d'olive", base_unit="ml")

    # 1) entry form
    response = make_invoice(client, supplier)
    assert response.status_code == 201
    invoice_id = response.json()["id"]
    assert response.json()["autoConfirmedLines"] == 0

    # 2) it appears in the review queue with 2 unconfirmed lines
    queue = client.get("/api/invoices").json()
    assert [inv["id"] for inv in queue] == [invoice_id]
    assert queue[0]["unconfirmed_lines"] == 2

    detail = client.get(f"/api/invoices/{invoice_id}").json()
    line_tom, line_oil = detail["lines"]
    # deterministic prefill read the size out of the raw text
    assert line_tom["prefill"] == {"baseUnit": "g", "qtyPerUnit": 5000}
    assert line_oil["prefill"] == {"baseUnit": "ml", "qtyPerUnit": 3000}

    # 3) fuzzy suggestions find the right item despite different spelling
    suggestions = client.get(
        f"/api/invoice-lines/{line_tom['id']}/suggestions"
    ).json()
    assert suggestions and suggestions[0]["item_id"] == tomatoes

    # 4) confirm both lines (tomatoes: 2 cases x 5 kg)
    response = client.put(
        f"/api/invoice-lines/{line_tom['id']}/confirm",
        json={"item_id": tomatoes, "qty_per_unit": 5000},
    )
    assert response.status_code == 200
    assert response.json()["qty_canonical"] == 10000
    client.put(
        f"/api/invoice-lines/{line_oil['id']}/confirm",
        json={"item_id": oil, "qty_per_unit": 3000},
    )

    # 5) post to ledger
    response = client.post(f"/api/invoices/{invoice_id}/post")
    assert response.status_code == 200
    balances = {row["item_id"]: row for row in response.json()["balances"]}
    assert balances[tomatoes]["qty"] == 10000
    assert balances[tomatoes]["cost_cents"] == 3000
    assert balances[oil]["qty"] == 3000

    # 6) queue is empty again
    assert client.get("/api/invoices").json() == []


def test_second_invoice_auto_confirms_via_alias(client) -> None:
    supplier = make_supplier(client)
    tomatoes = make_item(client, "Tomates Roma")
    oil = make_item(client, "Huile d'olive", base_unit="ml")

    first = make_invoice(client, supplier).json()["id"]
    detail = client.get(f"/api/invoices/{first}").json()
    for line, item, qpu in zip(detail["lines"], (tomatoes, oil), (5000, 3000)):
        client.put(
            f"/api/invoice-lines/{line['id']}/confirm",
            json={"item_id": item, "qty_per_unit": qpu},
        )

    # same supplier, same spellings -> arrives fully confirmed
    response = make_invoice(client, supplier, invoice_number="F-1002")
    assert response.json()["autoConfirmedLines"] == 2
    queue = client.get("/api/invoices").json()
    assert {inv["invoice_number"]: inv["unconfirmed_lines"] for inv in queue}[
        "F-1002"
    ] == 0


def test_inconsistent_totals_rejected_with_i18n_code(client) -> None:
    supplier = make_supplier(client)
    response = make_invoice(client, supplier, total="99.99")
    assert response.status_code == 422
    codes = [e["code"] for e in response.json()["detail"]["errors"]]
    assert codes == ["invoiceError.totalMismatch"]


def test_unparseable_money_rejected(client) -> None:
    supplier = make_supplier(client)
    response = make_invoice(client, supplier, subtotal="cinquante-cinq")
    assert response.status_code == 422
    errors = response.json()["detail"]["errors"]
    assert errors[0]["code"] == "invoiceError.badNumber"
    assert errors[0]["context"]["field"] == "subtotal"


def test_posting_unconfirmed_invoice_returns_409(client) -> None:
    supplier = make_supplier(client)
    invoice_id = make_invoice(client, supplier).json()["id"]
    response = client.post(f"/api/invoices/{invoice_id}/post")
    assert response.status_code == 409
    assert response.json()["code"] == "ledgerError.unconfirmedLines"


def test_duplicate_item_name_returns_409(client) -> None:
    make_item(client, "Riz")
    response = client.post("/api/items", json={"name": "Riz", "base_unit": "g"})
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "apiError.duplicateName"


def test_confirm_rejects_weight_line_on_volume_item(client, conn) -> None:
    supplier = make_supplier(client)
    oil = make_item(client, "Huile d'olive", base_unit="ml")
    tomato_case = make_item(client, "Caisse de tomates", base_unit="each")
    invoice_id = make_invoice(client, supplier).json()["id"]
    line_tom = client.get(f"/api/invoices/{invoice_id}").json()["lines"][0]
    assert line_tom["raw_text"] == "TOMATE ROMA 5KG"

    # "5KG" onto an item counted in milliliters: blocked, nothing written
    response = client.put(
        f"/api/invoice-lines/{line_tom['id']}/confirm",
        json={"item_id": oil, "qty_per_unit": 5000},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == {
        "code": "confirmError.unitMismatch",
        "context": {"textUnit": "g", "itemUnit": "ml"},
    }
    line = conn.execute(
        "SELECT item_id FROM invoice_lines WHERE id = %s", (line_tom["id"],)
    ).fetchone()
    assert line["item_id"] is None
    assert conn.execute("SELECT COUNT(*) AS n FROM item_aliases").fetchone()["n"] == 0

    # counting the 5 kg case as 1 "each" is allowed
    response = client.put(
        f"/api/invoice-lines/{line_tom['id']}/confirm",
        json={"item_id": tomato_case, "qty_per_unit": 1},
    )
    assert response.status_code == 200


# --- saved spellings ("aliases") never change silently ----------------------


def confirm(client, line_id, item_id, qty_per_unit, alias_choice=None):
    body = {"item_id": item_id, "qty_per_unit": qty_per_unit}
    if alias_choice is not None:
        body["alias_choice"] = alias_choice
    return client.put(f"/api/invoice-lines/{line_id}/confirm", json=body)


def saved_alias(conn, raw_text):
    return conn.execute(
        "SELECT item_id, qty_per_unit FROM item_aliases WHERE raw_text = %s",
        (raw_text,),
    ).fetchone()


def tomato_spelling_saved_as_5kg(client):
    """Two pending invoices with "TOMATE ROMA 5KG"; the first is confirmed
    as 5000 g per case. Returns (tomatoes item id, second line id)."""
    supplier = make_supplier(client)
    tomatoes = make_item(client, "Tomates Roma")
    first = make_invoice(client, supplier).json()["id"]
    second = make_invoice(client, supplier, invoice_number="F-1002").json()["id"]
    line_1 = client.get(f"/api/invoices/{first}").json()["lines"][0]
    line_2 = client.get(f"/api/invoices/{second}").json()["lines"][0]
    assert confirm(client, line_1["id"], tomatoes, 5000).status_code == 200
    return tomatoes, line_2["id"]


def test_changing_a_saved_spelling_asks_first(client, conn) -> None:
    tomatoes, line_id = tomato_spelling_saved_as_5kg(client)

    # same text, but now 4 kg per case: refused until the owner chooses
    response = confirm(client, line_id, tomatoes, 4000)
    assert response.status_code == 409
    assert response.json()["detail"] == {
        "code": "confirmError.aliasConflict",
        "context": {
            "savedItemName": "Tomates Roma",
            "savedQtyPerUnit": 5000,
            "savedBaseUnit": "g",
            "newItemName": "Tomates Roma",
            "newQtyPerUnit": 4000,
            "newBaseUnit": "g",
        },
    }
    # nothing was written
    line = conn.execute(
        "SELECT item_id FROM invoice_lines WHERE id = %s", (line_id,)
    ).fetchone()
    assert line["item_id"] is None
    assert saved_alias(conn, "TOMATE ROMA 5KG") == {
        "item_id": tomatoes,
        "qty_per_unit": 5000,
    }


def test_line_only_choice_keeps_the_saved_spelling(client, conn) -> None:
    tomatoes, line_id = tomato_spelling_saved_as_5kg(client)

    response = confirm(client, line_id, tomatoes, 4000, alias_choice="line_only")

    assert response.status_code == 200
    assert response.json()["qty_canonical"] == 8000  # 2 cases x 4000 g
    assert saved_alias(conn, "TOMATE ROMA 5KG")["qty_per_unit"] == 5000


def test_update_choice_changes_future_invoices(client, conn) -> None:
    tomatoes, line_id = tomato_spelling_saved_as_5kg(client)

    response = confirm(client, line_id, tomatoes, 4000, alias_choice="update")

    assert response.status_code == 200
    assert saved_alias(conn, "TOMATE ROMA 5KG")["qty_per_unit"] == 4000
    supplier = conn.execute("SELECT id FROM suppliers").fetchone()["id"]
    later = make_invoice(client, supplier, invoice_number="F-1003").json()["id"]
    auto_filled = client.get(f"/api/invoices/{later}").json()["lines"][0]
    assert auto_filled["qty_canonical"] == 8000


def test_reconfirming_identical_values_needs_no_choice(client) -> None:
    tomatoes, line_id = tomato_spelling_saved_as_5kg(client)
    assert confirm(client, line_id, tomatoes, 5000).status_code == 200
