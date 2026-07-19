-- Initial ledger schema.
-- Conventions:
--   * money is ALWAYS integer cents (bigint) — never floats
--   * quantities are ALWAYS integer base units: grams, milliliters, or "each"
--   * ledger_entries is append-only, enforced by trigger at the bottom

CREATE TABLE suppliers (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- The owner's canonical catalog ("Roma tomatoes", base unit grams).
CREATE TABLE items (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    base_unit   text NOT NULL CHECK (base_unit IN ('g', 'ml', 'each')),
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- A supplier's spelling of an item, plus the owner-confirmed conversion:
-- qty_per_unit = how many base units one invoice-unit of this alias holds.
-- e.g. "ROMA TOM 5KG" -> item=tomatoes, qty_per_unit=5000 (grams per case).
CREATE TABLE item_aliases (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id   bigint NOT NULL REFERENCES suppliers(id),
    raw_text      text NOT NULL,
    item_id       bigint NOT NULL REFERENCES items(id),
    qty_per_unit  bigint NOT NULL CHECK (qty_per_unit > 0),
    confirmed_at  timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (supplier_id, raw_text)
);

CREATE TABLE invoices (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id      bigint NOT NULL REFERENCES suppliers(id),
    invoice_number   text,
    invoice_date     date NOT NULL,
    subtotal_cents   bigint NOT NULL CHECK (subtotal_cents >= 0),
    gst_cents        bigint NOT NULL DEFAULT 0 CHECK (gst_cents >= 0),
    qst_cents        bigint NOT NULL DEFAULT 0 CHECK (qst_cents >= 0),
    other_tax_cents  bigint NOT NULL DEFAULT 0 CHECK (other_tax_cents >= 0),
    total_cents      bigint NOT NULL,
    status           text NOT NULL DEFAULT 'pending_review'
                     CHECK (status IN ('pending_review', 'posted', 'voided')),
    image_path       text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    -- the printed total must equal the parts, or the invoice may not exist here
    CHECK (subtotal_cents + gst_cents + qst_cents + other_tax_cents = total_cents)
);

CREATE TABLE invoice_lines (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id        bigint NOT NULL REFERENCES invoices(id),
    raw_text          text NOT NULL,
    quantity          numeric NOT NULL CHECK (quantity > 0),
    line_total_cents  bigint NOT NULL CHECK (line_total_cents >= 0),
    -- NULL until the owner confirms the item match in the review queue
    item_id           bigint REFERENCES items(id),
    qty_canonical     bigint CHECK (qty_canonical > 0),
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stocktakes (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    taken_at    timestamptz NOT NULL DEFAULT now(),
    notes       text,
    posted_at   timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stocktake_lines (
    id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stocktake_id           bigint NOT NULL REFERENCES stocktakes(id),
    item_id                bigint NOT NULL REFERENCES items(id),
    counted_qty_canonical  bigint NOT NULL CHECK (counted_qty_canonical >= 0),
    UNIQUE (stocktake_id, item_id)
);

-- The append-only heart. Balances are ALWAYS computed as SUM over this
-- table by deterministic code — nothing else is a source of truth.
CREATE TABLE ledger_entries (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id            bigint NOT NULL REFERENCES items(id),
    entry_type         text NOT NULL
                       CHECK (entry_type IN ('purchase', 'stocktake_adjustment', 'reversal')),
    qty_delta          bigint NOT NULL,
    cost_delta_cents   bigint NOT NULL,
    occurred_on        date NOT NULL,
    source_type        text NOT NULL
                       CHECK (source_type IN ('invoice_line', 'stocktake_line', 'ledger_entry')),
    source_id          bigint NOT NULL,
    -- UNIQUE: an entry can be reversed at most once
    reverses_entry_id  bigint UNIQUE REFERENCES ledger_entries(id),
    created_at         timestamptz NOT NULL DEFAULT now(),
    -- exactly the reversal entries point at what they reverse
    CHECK ((entry_type = 'reversal') = (reverses_entry_id IS NOT NULL))
);

CREATE INDEX ledger_entries_item_idx ON ledger_entries (item_id);

-- Append-only enforcement: even buggy future code cannot UPDATE or DELETE.
CREATE FUNCTION forbid_ledger_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'ledger_entries is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_entries_append_only
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION forbid_ledger_mutation();
