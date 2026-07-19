# Restaurant Inventory Service (working name)

A trilingual (ZH/FR/EN) inventory web app for small restaurants.

**Pipeline:** photo intake → GLM-OCR extraction → normalization →
deterministic ledger (Postgres) → weekly reports + rule-based alerts.

## Layout

| Folder | Purpose |
| --- | --- |
| `backend/` | OCR pipeline, ledger, reports, alerts |
| `frontend/` | Web interface for restaurant owners |
| `tests/` | Automated tests (ledger math, normalization) |
| `docs/` | Design notes and decisions |
| `test-invoices/` | Redacted sample invoices for testing extraction |

Project rules and architecture constraints live in [CLAUDE.md](CLAUDE.md).

## Setup

Secrets (API keys, database passwords) live in a `.env` file in the
project root. That file is gitignored and must never be committed.
