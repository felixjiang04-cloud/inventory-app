"""The one place in the app that talks to an AI model.

CLAUDE.md rules this file follows:
- Model calls go through this layer, configured entirely from .env
  (server address, model name, optional key) using the OpenAI-style chat
  API that most model servers speak. No provider is named in code.
- The model only TRANSCRIBES. Every value it returns is text exactly as
  printed; app/extraction.py parses and checks it with deterministic code.
  The model never calculates, converts or corrects anything.
"""

import base64
import json

import httpx

from app.config import settings


class ModelUnavailable(Exception):
    """The model server could not be reached, timed out, or is overloaded.
    Worth trying again later: the photo is kept and waits to be read."""


class ModelError(Exception):
    """The model server answered, but not with something usable (a refused
    request, or text that isn't the JSON we asked for)."""


def _text_field() -> dict:
    return {"type": "string"}


# The shape the model must fill in. Every value is a string copied exactly
# as printed on the invoice ("" when not printed) — never a computed number.
INVOICE_SCHEMA = {
    "type": "object",
    "properties": {
        "supplier_name": _text_field(),
        "invoice_number": _text_field(),
        "invoice_date": _text_field(),
        "lines": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": _text_field(),
                    "quantity": _text_field(),
                    "line_total": _text_field(),
                },
                "required": ["description", "quantity", "line_total"],
            },
        },
        "subtotal": _text_field(),
        "gst": _text_field(),
        "qst": _text_field(),
        "other_tax": _text_field(),
        "total": _text_field(),
    },
    "required": [
        "supplier_name",
        "invoice_number",
        "invoice_date",
        "lines",
        "subtotal",
        "gst",
        "qst",
        "other_tax",
        "total",
    ],
}

# What we ask the model to do. Tuned on real photos (test-invoices/) with
# `python -m app.ocr_check`.
PROMPT = (
    "Transcribe this supplier invoice into JSON with exactly these keys:\n"
    + json.dumps(
        {
            "supplier_name": "",
            "invoice_number": "",
            "invoice_date": "",
            "lines": [{"description": "", "quantity": "", "line_total": ""}],
            "subtotal": "",
            "gst": "",
            "qst": "",
            "other_tax": "",
            "total": "",
        }
    )
    + "\nRules: copy every value exactly as printed, as text. Do not "
    "calculate, convert, round or correct anything. Use \"\" for anything "
    "not printed. One entry in lines per printed item line. gst is the "
    "GST/TPS amount, qst the QST/TVQ amount, other_tax any other tax."
)


def _parse_json_answer(content: str) -> dict:
    """The model's answer as a dict. Tolerates a ```json fence around it."""
    text = content.strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end < start:
        raise ModelError("answer contains no JSON object")
    try:
        answer = json.loads(text[start : end + 1])
    except ValueError as exc:
        raise ModelError("answer is not valid JSON") from exc
    if not isinstance(answer, dict):
        raise ModelError("answer is not a JSON object")
    return answer


def read_invoice_photo(jpeg: bytes) -> dict:
    """Send a prepared invoice photo (see photos.py) to the configured
    model and return its transcription — every value still text."""
    if not settings.llm_base_url or not settings.ocr_model:
        raise ModelUnavailable("no AI model configured (LLM_BASE_URL, OCR_MODEL)")

    image_url = "data:image/jpeg;base64," + base64.b64encode(jpeg).decode()
    body = {
        "model": settings.ocr_model,
        "temperature": 0,  # same photo, same answer as far as possible
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
        # asks the server to force its output into this exact shape
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "invoice", "schema": INVOICE_SCHEMA},
        },
    }
    headers = {}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"

    try:
        response = httpx.post(
            settings.llm_base_url.rstrip("/") + "/chat/completions",
            json=body,
            headers=headers,
            timeout=settings.llm_timeout_seconds,
        )
    except httpx.HTTPError as exc:  # unreachable, refused, timed out
        raise ModelUnavailable(f"model server unreachable: {exc}") from exc

    if response.status_code >= 500 or response.status_code == 429:
        raise ModelUnavailable(f"model server busy or failing ({response.status_code})")
    if response.status_code >= 400:
        raise ModelError(f"model server refused the request ({response.status_code})")
    try:
        content = response.json()["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise ModelError("unexpected answer format from the model server") from exc
    return _parse_json_answer(content)
