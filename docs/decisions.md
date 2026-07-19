# Decision log

Running record of significant technical decisions and why they were made.
Newest entries at the bottom.

## 2026-07-19 — Tech stack (Stage 1)

- **Backend: Python + FastAPI.** Readable for a learning developer,
  strong ecosystem for data validation (the heart of the ledger), and
  first-class Postgres support. Tests with pytest.
- **Frontend: React + Vite (TypeScript).** Mature i18n tooling
  (react-i18next) for ZH/FR/EN, and the invoice-review screen will need
  real interactivity. Vite dev server proxies `/api` to the backend.
- **Database: Neon managed Postgres (free tier).** Nothing to install
  or maintain locally; connection string lives in `.env`.
- **Photo intake: phone-browser upload.** The restaurant owner opens
  the web app on their phone and uploads a photo. Simplest flow that
  matches real usage; messaging-platform intake (e.g. WeChat) deferred.
