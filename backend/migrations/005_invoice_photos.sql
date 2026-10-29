-- Invoice photos and what the AI read from them (Stage 4).
-- The file itself lives in PHOTO_DIR; only its (random) name is stored.
-- Only the cleaned copy is kept: upright, shrunk, no metadata (no GPS).

CREATE TABLE invoice_photos (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_name    text NOT NULL UNIQUE,
    uploaded_by  bigint NOT NULL REFERENCES users(id),
    uploaded_at  timestamptz NOT NULL DEFAULT now(),
    -- waiting: not read yet (e.g. the AI server was off); can be retried
    -- read:    the AI's answer is in `extraction`
    -- failed:  the AI answered with something unusable; type it by hand
    status       text NOT NULL DEFAULT 'waiting'
                 CHECK (status IN ('waiting', 'read', 'failed')),
    -- the AI's raw answer: every value text exactly as printed, unchecked
    extraction   jsonb,
    read_at      timestamptz,
    -- technical detail of the last failure, for debugging (never shown)
    last_error   text,
    -- the invoice saved from this photo; a photo becomes at most one invoice
    invoice_id   bigint UNIQUE REFERENCES invoices(id)
);

CREATE INDEX invoice_photos_unused_idx ON invoice_photos (uploaded_at)
    WHERE invoice_id IS NULL;
