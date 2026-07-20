# Ledger design

Plain-language guide to the Stage 2 schema. The SQL lives in
`backend/migrations/001_initial.sql`; the operations in
`backend/app/ledger.py`.

## The one big idea: append-only

`ledger_entries` works like a bank statement. Rows are only ever
**added** — never edited, never deleted. A Postgres trigger enforces
this at the database level, so even buggy code cannot break it.

An item's stock level is not stored anywhere. It is always **computed**:
the SUM of all `qty_delta` values for that item. Same for money spent
(`cost_delta_cents`). This is why reports are trustworthy: every number
can be traced back to the exact entries that produced it.

Mistakes are fixed the way accountants fix them: a **reversal** entry
with the opposite sign, linked to the entry it cancels
(`reverses_entry_id`, which the DB guarantees is used at most once per
entry). History stays complete; balances come out right.

## Units and money

- Money: integer **cents** (`bigint`). Never floats — floats lose cents.
- Quantities: integer **base units** — grams, milliliters, or "each".
  2.5 kg is stored as 2500 g. Conversion factors come from the
  hand-written table in `backend/app/units.py` (a CLAUDE.md rule:
  never model-generated).

## How an invoice becomes ledger entries

1. A row in `invoices` + its `invoice_lines` (from OCR later; status
   `pending_review`). The DB itself refuses invoices whose
   subtotal + GST + QST + other ≠ total.
2. The owner confirms each line's item match in the review queue.
   Confirmed spellings are remembered in `item_aliases` — including the
   owner-confirmed factor "one invoice-unit of this alias = N base
   units" — so next month's identical line needs no confirmation.
3. `post_invoice()` re-validates everything (lines sum to subtotal,
   totals consistent, every line confirmed), then writes one `purchase`
   entry per line and marks the invoice `posted`. All inside one
   transaction: it fully happens or it fully doesn't.

## Stocktakes

A stocktake records what was actually counted on the shelf
(`stocktake_lines.counted_qty_canonical`). Posting one computes
`delta = counted − current balance` per item and writes a
`stocktake_adjustment` entry. Quantity is corrected; cost is untouched
(counting doesn't change what was spent). The gap between the two is
shrinkage — usage, waste, or loss — which weekly reports can surface.

## Worked example

Invoice: 2 × "ROMA TOM 5KG" @ 30.00 $ and 1 × "HUILE OLIVE 3L" @ 25.00 $,
GST 2.75 $, QST 5.49 $, total 63.24 $.

| # | entry               | item     | qty_delta | cost_delta |
|---|---------------------|----------|-----------|------------|
| 1 | purchase            | tomatoes | +10 000 g | +30.00 $   |
| 2 | purchase            | oil      | +3 000 ml | +25.00 $   |
| 3 | stocktake_adjustment| tomatoes | −6 200 g  | 0          |
| 4 | reversal (of #2)    | oil      | −3 000 ml | −25.00 $   |

Balances after: tomatoes 3 800 g / 30.00 $ spent; oil 0 ml / 0 $.
Every step remains visible forever.
