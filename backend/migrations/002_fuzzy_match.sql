-- Deterministic fuzzy matching for the review queue.
-- pg_trgm scores text similarity by shared 3-letter chunks ("trigrams"):
-- similarity('TOMATE ROMA', 'Tomates Roma') is high, no model involved.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX items_name_trgm_idx
    ON items USING gin (name gin_trgm_ops);

CREATE INDEX item_aliases_raw_text_trgm_idx
    ON item_aliases USING gin (raw_text gin_trgm_ops);
