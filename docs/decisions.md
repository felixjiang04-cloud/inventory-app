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

## 2026-07-20 — Ledger design (Stage 2)

- **Append-only ledger with reversals.** Rows in `ledger_entries` are
  never edited or deleted (DB trigger enforces it). Fixes are opposite
  entries linked to what they cancel. Reports stay explainable forever.
- **Purchases + stocktakes.** Invoices add stock; periodic counts
  correct it. The gap is shrinkage — no daily usage logging burden.
- **Raw SQL via psycopg, no ORM.** Every query visible; plain numbered
  SQL migration files with a tiny runner (no Alembic).
- **Integer everything.** Money = cents; quantities = whole grams /
  milliliters / "each". Floats never touch ledger math.
- **CAD only, GST/QST stored separately** — matches printed QC invoices.
- **Owner-confirmed alias factors.** The hand-written units table
  prefill suggestions; the factor stored per supplier-spelling
  ("ROMA TOM 5KG" = 5000 g) is confirmed once by the owner, reused
  after. Handles pack sizes with no model at runtime.
- **Tests run on a Neon "test" branch** of the real database, each test
  in a rolled-back transaction — realistic Postgres, zero leftover data.
