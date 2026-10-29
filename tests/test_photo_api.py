"""Invoice photos through the API, with the AI faked (no GPU needed)."""

import io

import pytest
from PIL import Image

from app import photo_routes, photos
from app.config import settings
from app.llm import ModelError, ModelUnavailable

AI_ANSWER = {
    "supplier_name": "MARCHÉ CENTRAL INC.",
    "invoice_number": "F-2001",
    "invoice_date": "2026-10-01",
    "lines": [
        {"description": "TOMATE ROMA 5KG", "quantity": "2", "line_total": "30,00"},
        {"description": "HUILE OLIVE 3L", "quantity": "1", "line_total": "25,00"},
    ],
    "subtotal": "55,00",
    "gst": "2,75",
    "qst": "5,49",
    "other_tax": "",
    "total": "63,24",
}


@pytest.fixture(autouse=True)
def photo_dir(tmp_path, monkeypatch):
    """Photos go to a throwaway folder during tests."""
    monkeypatch.setattr(settings, "photo_dir", str(tmp_path))
    return tmp_path


class FakeAI:
    """Stands in for the model server. Set `.result` to the answer it gives,
    or to an exception it raises."""

    def __init__(self):
        self.result: dict | Exception = AI_ANSWER
        self.calls = 0

    def __call__(self, jpeg: bytes) -> dict:
        self.calls += 1
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


@pytest.fixture
def ai(monkeypatch) -> FakeAI:
    fake = FakeAI()
    monkeypatch.setattr(photo_routes, "read_invoice_photo", fake)
    return fake


def jpeg_bytes() -> bytes:
    out = io.BytesIO()
    Image.new("RGB", (1200, 1600), "white").save(out, "JPEG")
    return out.getvalue()


def upload(client, data: bytes | None = None, content_type: str = "image/jpeg"):
    return client.post(
        "/api/invoice-photos",
        files={"photo": ("IMG_0042.jpg", data or jpeg_bytes(), content_type)},
    )


def user_id(conn, email: str) -> int:
    return conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()["id"]


# --- reading ------------------------------------------------------------------


def test_staff_photo_is_read_into_a_prefilled_draft(
    client, staff_client, conn, ai, photo_dir
) -> None:
    supplier = client.post("/api/suppliers", json={"name": "Marché Central"}).json()["id"]

    response = upload(staff_client)

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "read"
    draft = body["draft"]
    assert draft["supplier_id"] == supplier  # fuzzy match on the printed name
    assert draft["invoice_date"] == "2026-10-01"
    assert draft["lines"][0] == {
        "raw_text": "TOMATE ROMA 5KG",
        "quantity": "2",
        "line_total": "30.00",
    }
    assert draft["total"] == "63.24"
    assert draft["problems"] == []

    # one cleaned JPEG kept under a random name, never the phone's file name
    (saved,) = photo_dir.iterdir()
    assert saved.suffix == ".jpg" and "IMG_0042" not in saved.name
    row = conn.execute(
        "SELECT status, uploaded_by, extraction FROM invoice_photos WHERE id = %s",
        (body["id"],),
    ).fetchone()
    assert row["status"] == "read"
    assert row["uploaded_by"] == user_id(conn, "staff@example.test")
    assert row["extraction"] == AI_ANSWER  # the AI's raw text, kept as evidence


def test_ai_offline_keeps_the_photo_waiting_then_reads_it_later(staff_client, ai) -> None:
    ai.result = ModelUnavailable("server off")

    body = upload(staff_client).json()

    assert body["status"] == "waiting"
    assert body["draft"] is None
    waiting = staff_client.get("/api/invoice-photos").json()
    assert [(p["id"], p["status"]) for p in waiting] == [(body["id"], "waiting")]

    ai.result = AI_ANSWER  # the server is back
    again = staff_client.post(f"/api/invoice-photos/{body['id']}/read").json()
    assert again["status"] == "read"
    assert again["draft"]["total"] == "63.24"


def test_unusable_ai_answer_marks_the_photo_failed(staff_client, ai) -> None:
    ai.result = ModelError("not JSON")
    body = upload(staff_client).json()
    assert body["status"] == "failed"
    assert body["draft"] is None


def test_a_non_image_is_refused_and_nothing_is_kept(
    staff_client, conn, ai, photo_dir
) -> None:
    response = upload(staff_client, b"%PDF-1.7 not a photo", "application/pdf")

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "photoError.notAnImage"
    assert ai.calls == 0
    assert list(photo_dir.iterdir()) == []
    assert conn.execute("SELECT COUNT(*) AS n FROM invoice_photos").fetchone()["n"] == 0


def test_a_too_large_upload_is_refused(staff_client, ai, monkeypatch) -> None:
    monkeypatch.setattr(photos, "MAX_UPLOAD_BYTES", 1000)
    response = upload(staff_client)
    assert response.status_code == 413
    assert response.json()["detail"]["code"] == "photoError.tooLarge"


# --- from photo to invoice -----------------------------------------------------


def test_saving_the_invoice_links_the_photo_exactly_once(client, conn, ai) -> None:
    client.post("/api/suppliers", json={"name": "Marché Central"})
    photo = upload(client).json()
    draft = photo["draft"]
    invoice_form = {
        "supplier_id": draft["supplier_id"],
        "invoice_date": draft["invoice_date"],
        "invoice_number": draft["invoice_number"],
        "lines": draft["lines"],
        "subtotal": draft["subtotal"],
        "gst": draft["gst"],
        "qst": draft["qst"],
        "other_tax": draft["other_tax"],
        "total": draft["total"],
        "photo_id": photo["id"],
    }

    response = client.post("/api/invoices", json=invoice_form)

    assert response.status_code == 201
    invoice_id = response.json()["id"]
    assert client.get(f"/api/invoices/{invoice_id}").json()["photo_id"] == photo["id"]
    linked = conn.execute(
        """
        SELECT p.invoice_id, i.image_path = p.file_name AS same_file
        FROM invoice_photos p JOIN invoices i ON i.id = p.invoice_id
        WHERE p.id = %s
        """,
        (photo["id"],),
    ).fetchone()
    assert linked == {"invoice_id": invoice_id, "same_file": True}
    assert client.get("/api/invoice-photos").json() == []  # no longer pending

    # the same photo can't become a second invoice, or be read again
    second = client.post("/api/invoices", json=invoice_form)
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "photoError.alreadyUsed"
    reread = client.post(f"/api/invoice-photos/{photo['id']}/read")
    assert reread.status_code == 409


def test_the_photo_can_be_viewed_by_logged_in_users_only(
    staff_client, anon_client, ai
) -> None:
    photo_id = upload(staff_client).json()["id"]

    response = staff_client.get(f"/api/invoice-photos/{photo_id}/image")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"

    assert anon_client.get(f"/api/invoice-photos/{photo_id}/image").status_code == 401


def test_unknown_photo_is_not_found(client) -> None:
    response = client.get("/api/invoice-photos/999999")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "photoError.notFound"
