"""The AI layer, with the model server faked: no network, no GPU."""

import base64
import json
from pathlib import Path

import httpx
import pytest

from app import llm
from app.config import settings
from app.llm import ModelError, ModelUnavailable, read_invoice_photo

ANSWER = {
    "supplier_name": "Marché Test",
    "invoice_number": "F-1001",
    "invoice_date": "2026-10-01",
    "lines": [{"description": "TOMATE ROMA 5KG", "quantity": "2", "line_total": "30,00"}],
    "subtotal": "30,00",
    "gst": "1,50",
    "qst": "2,99",
    "other_tax": "",
    "total": "34,49",
}


@pytest.fixture
def ai_configured(monkeypatch):
    monkeypatch.setattr(settings, "llm_base_url", "http://model.test/v1/")
    monkeypatch.setattr(settings, "ocr_model", "some-ocr-model")
    monkeypatch.setattr(settings, "llm_api_key", "")


def fake_server(monkeypatch, *, status=200, content="", raises=None):
    """Replace the HTTP call with a fake model server. Returns the list of
    requests it received, so tests can check what was sent."""
    received = []

    def fake_post(url, json, headers, timeout):
        received.append({"url": url, "json": json, "headers": headers})
        if raises is not None:
            raise raises
        body = {"choices": [{"message": {"content": content}}]}
        return httpx.Response(status, json=body, request=httpx.Request("POST", url))

    monkeypatch.setattr(llm.httpx, "post", fake_post)
    return received


def test_sends_an_openai_style_request_with_the_photo(monkeypatch, ai_configured) -> None:
    received = fake_server(monkeypatch, content=json.dumps(ANSWER))

    assert read_invoice_photo(b"jpeg bytes") == ANSWER

    (request,) = received
    assert request["url"] == "http://model.test/v1/chat/completions"
    body = request["json"]
    assert body["model"] == "some-ocr-model"
    assert body["temperature"] == 0
    image_part, text_part = body["messages"][0]["content"]
    assert image_part["image_url"]["url"] == (
        "data:image/jpeg;base64," + base64.b64encode(b"jpeg bytes").decode()
    )
    assert "Do not calculate" in text_part["text"]
    assert body["response_format"]["json_schema"]["schema"] == llm.INVOICE_SCHEMA
    assert "Authorization" not in request["headers"]


def test_sends_the_api_key_only_when_one_is_configured(monkeypatch, ai_configured) -> None:
    monkeypatch.setattr(settings, "llm_api_key", "k-123")
    received = fake_server(monkeypatch, content=json.dumps(ANSWER))
    read_invoice_photo(b"x")
    assert received[0]["headers"]["Authorization"] == "Bearer k-123"


def test_accepts_an_answer_wrapped_in_a_code_fence(monkeypatch, ai_configured) -> None:
    fake_server(monkeypatch, content="```json\n" + json.dumps(ANSWER) + "\n```")
    assert read_invoice_photo(b"x") == ANSWER


def test_no_model_configured_means_unavailable(monkeypatch) -> None:
    monkeypatch.setattr(settings, "llm_base_url", "")
    with pytest.raises(ModelUnavailable):
        read_invoice_photo(b"x")


@pytest.mark.parametrize(
    "problem", [httpx.ConnectError("refused"), httpx.ReadTimeout("too slow")]
)
def test_unreachable_or_slow_server_means_unavailable(
    monkeypatch, ai_configured, problem
) -> None:
    fake_server(monkeypatch, raises=problem)
    with pytest.raises(ModelUnavailable):
        read_invoice_photo(b"x")


@pytest.mark.parametrize("status", [429, 503])
def test_busy_or_failing_server_means_unavailable(monkeypatch, ai_configured, status) -> None:
    fake_server(monkeypatch, status=status)
    with pytest.raises(ModelUnavailable):
        read_invoice_photo(b"x")


@pytest.mark.parametrize(
    ("status", "content"),
    [(400, ""), (200, "Sorry, I cannot read this photo."), (200, "[1, 2, 3]")],
)
def test_unusable_answers_are_errors(monkeypatch, ai_configured, status, content) -> None:
    fake_server(monkeypatch, status=status, content=content)
    with pytest.raises(ModelError):
        read_invoice_photo(b"x")


def test_no_provider_is_named_in_the_ai_layer() -> None:
    # CLAUDE.md: never hardcode a provider; everything comes from .env
    source = Path(llm.__file__).read_text(encoding="utf-8").lower()
    for name in ("ollama", "vllm", "zhipu", "bigmodel", "z.ai", "openai.com", "glm"):
        assert name not in source, f"provider name {name!r} found in llm.py"
