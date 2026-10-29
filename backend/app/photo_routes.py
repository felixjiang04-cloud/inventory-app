"""Invoice photos: upload one, have the AI read it, look at it again.

The flow: a phone uploads a photo -> it is cleaned (photos.py) and saved
-> the AI transcribes it (llm.py) -> deterministic code turns that into a
form draft (extraction.py) -> the person checks the prefilled form and
saves it as an invoice (POST /api/invoices with photo_id).

If the AI server can't be reached, the photo is kept with status
"waiting" and can be read again later; typing by hand always works.
Owner and staff may upload, the same as typing an invoice.
"""

import uuid
from dataclasses import asdict
from pathlib import Path

import psycopg
from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import FileResponse
from psycopg.types.json import Jsonb

from app import photos
from app.auth import User, get_current_user
from app.config import settings
from app.deps import get_db
from app.errors import api_error
from app.extraction import draft_from_answer
from app.llm import ModelError, ModelUnavailable, read_invoice_photo

router = APIRouter(
    prefix="/api/invoice-photos", dependencies=[Depends(get_current_user)]
)


def _photo_path(file_name: str) -> Path:
    return Path(settings.photo_dir) / file_name


def _get_photo(conn: psycopg.Connection, photo_id: int):
    photo = conn.execute(
        """
        SELECT id, file_name, status, extraction, invoice_id
        FROM invoice_photos WHERE id = %s
        """,
        (photo_id,),
    ).fetchone()
    if photo is None:
        raise api_error(404, "photoError.notFound", photoId=photo_id)
    return photo


def _read(conn: psycopg.Connection, photo_id: int, jpeg: bytes) -> dict:
    """Ask the AI to read the photo; record and report the outcome."""
    try:
        answer = read_invoice_photo(jpeg)
    except ModelUnavailable as exc:
        conn.execute(
            "UPDATE invoice_photos SET status = 'waiting', last_error = %s WHERE id = %s",
            (str(exc), photo_id),
        )
        return {"id": photo_id, "status": "waiting", "draft": None}
    except ModelError as exc:
        conn.execute(
            "UPDATE invoice_photos SET status = 'failed', last_error = %s WHERE id = %s",
            (str(exc), photo_id),
        )
        return {"id": photo_id, "status": "failed", "draft": None}

    conn.execute(
        """
        UPDATE invoice_photos
        SET status = 'read', extraction = %s, read_at = now(), last_error = NULL
        WHERE id = %s
        """,
        (Jsonb(answer), photo_id),
    )
    draft = draft_from_answer(conn, answer)
    return {"id": photo_id, "status": "read", "draft": asdict(draft)}


@router.post("", status_code=201)
def upload_photo(
    photo: UploadFile,
    user: User = Depends(get_current_user),
    conn: psycopg.Connection = Depends(get_db),
):
    data = photo.file.read(photos.MAX_UPLOAD_BYTES + 1)
    if len(data) > photos.MAX_UPLOAD_BYTES:
        raise api_error(
            413, "photoError.tooLarge", maxMb=photos.MAX_UPLOAD_BYTES // (1024 * 1024)
        )
    try:
        jpeg = photos.prepare_photo(data)
    except photos.NotAnImage:
        raise api_error(422, "photoError.notAnImage") from None

    file_name = f"{uuid.uuid4().hex}.jpg"  # random: never the uploader's name
    row = conn.execute(
        """
        INSERT INTO invoice_photos (file_name, uploaded_by)
        VALUES (%s, %s) RETURNING id
        """,
        (file_name, user.id),
    ).fetchone()
    path = _photo_path(file_name)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(jpeg)
    return _read(conn, row["id"], jpeg)


@router.get("")
def list_unused_photos(conn: psycopg.Connection = Depends(get_db)):
    """Photos not saved as an invoice yet (waiting, failed, or read but
    not saved), newest first — so none is ever forgotten."""
    return conn.execute(
        """
        SELECT p.id, p.status, p.uploaded_at, u.email AS uploaded_by
        FROM invoice_photos p JOIN users u ON u.id = p.uploaded_by
        WHERE p.invoice_id IS NULL
        ORDER BY p.uploaded_at DESC, p.id DESC
        """
    ).fetchall()


@router.get("/{photo_id}")
def get_photo(photo_id: int, conn: psycopg.Connection = Depends(get_db)):
    photo = _get_photo(conn, photo_id)
    draft = None
    if photo["status"] == "read":
        # rebuilt from the stored answer: same answer, same draft
        draft = asdict(draft_from_answer(conn, photo["extraction"]))
    return {
        "id": photo_id,
        "status": photo["status"],
        "invoice_id": photo["invoice_id"],
        "draft": draft,
    }


@router.post("/{photo_id}/read")
def read_again(photo_id: int, conn: psycopg.Connection = Depends(get_db)):
    photo = _get_photo(conn, photo_id)
    if photo["invoice_id"] is not None:
        raise api_error(409, "photoError.alreadyUsed", invoiceId=photo["invoice_id"])
    path = _photo_path(photo["file_name"])
    if not path.is_file():
        raise api_error(404, "photoError.fileMissing", photoId=photo_id)
    return _read(conn, photo_id, path.read_bytes())


@router.get("/{photo_id}/image")
def photo_image(photo_id: int, conn: psycopg.Connection = Depends(get_db)):
    photo = _get_photo(conn, photo_id)
    path = _photo_path(photo["file_name"])
    if not path.is_file():
        raise api_error(404, "photoError.fileMissing", photoId=photo_id)
    return FileResponse(
        path, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"}
    )
