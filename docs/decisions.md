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

## 2026-07-20 — Review workflow (Stage 3)

- **pg_trgm fuzzy matching.** Item suggestions come from Postgres
  trigram similarity over catalog names and confirmed aliases —
  deterministic, indexed, explainable, no model call.
- **API errors are i18n payloads.** Every error is {code, context}
  (e.g. invoiceError.totalMismatch + the two amounts in cents); the
  frontend translates and formats. No English sentences from the server.
- **Manual entry form is permanent.** Built as the Stage 3 invoice
  source; stays as the fallback when OCR misreads a photo.
- **User-typed money parsed server-side** by the same deterministic
  parse_money used everywhere ("25,00" and "$1,234.56" both work).

## 2026-10-29 — Hardening before Stage 4 (auth, ledger timing, review safety)

- **Email + password login, sessions in Postgres.** argon2id password
  hashes; the browser holds a random token in an httpOnly, Secure,
  SameSite=Lax cookie and only its SHA-256 hash is stored. Sessions last
  30 days; deactivating a user or resetting a password ends theirs at
  once. No public sign-up: the first owner is created with
  `python -m app.create_owner`, staff by the owner inside the app.
  Emails stay in Postgres and never go to a model call.
- **Two roles, one restaurant per database.** Staff enter invoices and
  view everything. Confirming lines, posting to the ledger, creating
  items/suppliers and managing staff are owner-only — posting is the
  last check before the append-only ledger, and a quantity typo isn't
  caught by the totals check. Consequence: staff can't add a brand-new
  supplier; the owner adds it first.
- **Audit trail.** invoices.created_by / posted_by / posted_at,
  invoice_lines.confirmed_by (NULL when filled from a saved spelling),
  item_aliases.confirmed_by. Not shown in the UI yet.
- **Stocktakes count at end of day, in restaurant time.** A count is
  compared with the balance of everything dated on or before the count
  day (same-day deliveries count as on the shelf), not the balance at
  posting time. Days are taken in RESTAURANT_TIMEZONE (default
  America/Toronto), not the database's UTC.
- **Known limitation — late invoices after a posted count.** An invoice
  dated on or before an already-posted stocktake makes stock at that
  count date differ from what was counted. Can't happen yet (there's no
  stocktake screen); to decide when stocktake entry is built. Options
  considered: automatic correcting entry at the count date, or refusing
  such invoices.
- **No weight↔volume mapping.** Confirming "5KG" onto an item counted in
  ml (or "3L" onto grams) is refused: it would need a density, which no
  hand-written table has. Count ("each") can map onto anything.
- **Saved spellings never change silently.** Re-confirming a spelling
  with a different item or pack size asks the owner: update it for
  future invoices, or use the new values on this line only.
- **CI on every push.** GitHub Actions runs pytest against a throwaway
  Postgres 17 (database tests must run there, never skip) plus the
  frontend lint, Vitest tests and build.

## 2026-10-29 — Login brute-force protection

- **Wrong passwords are counted per email address**, from any computer
  (table `login_failures`). 5 misses within 15 minutes, or 20 within 24
  hours, lock that email until enough of them are older than the window.
  An attacker gets about 20 guesses per account per day; someone fumbling
  their password waits 15 minutes at worst. The limits are a constant
  (`LOGIN_LIMITS` in auth.py), not a setting.
- **A lock reveals nothing.** Unknown emails are counted and locked exactly
  like real ones. A locked email is refused (429 + Retry-After, message
  "try again in 12 min") before the password or the account is looked at:
  even the right password fails, so the answer never says whether a guess
  was right or an account exists. Refused tries don't count, so hammering
  a locked email doesn't extend the lock.
- **Getting back in:** wait, or the owner resets the staff member's
  password, which lifts the lock. Devices already logged in are never
  affected. Known trade-off: someone who knows an email (e.g. the
  owner's) can keep it locked by repeating wrong passwords; only new
  logins are blocked. There is no unlock command for a locked-out owner.
- **Login failures are returned, not raised.** get_db rolls back
  everything a raising request wrote, which would silently erase each
  failure. Test requests now run in a savepoint rolled back the same way,
  so tests see what production sees (they would have passed otherwise).
- **Logins for one email take turns** (a Postgres advisory lock held until
  the request's transaction ends), so a burst of parallel guesses can't
  all slip past the check before their failures are saved.
- **Failures are kept a day**, then deleted at the next successful login.
- **No per-IP limit yet.** It needs each visitor's real address, which
  depends on the hosting's proxy setup; misconfigured, every visitor
  would share the proxy's address and one attacker would lock everyone
  out. Revisit when choosing hosting.
