-- Logins, roles, and "who did what".
-- One restaurant per database: every user is its owner or one of its staff.

CREATE TABLE users (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- stored lowercase, so UNIQUE is effectively case-insensitive
    email          text NOT NULL UNIQUE CHECK (email = lower(email)),
    -- argon2id hash; the password itself is never stored
    password_hash  text NOT NULL,
    role           text NOT NULL CHECK (role IN ('owner', 'staff')),
    -- deactivated users can't log in; their past actions stay attributed
    active         boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now()
);

-- One row per logged-in browser. The browser holds a random token in a
-- cookie; only its SHA-256 hash is stored here, so a copy of this table
-- can't be used to log in.
CREATE TABLE sessions (
    token_hash  text PRIMARY KEY,
    user_id     bigint NOT NULL REFERENCES users(id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions (user_id);

-- Who did what. NULL on rows from before logins existed.
ALTER TABLE invoices
    ADD COLUMN created_by  bigint REFERENCES users(id),
    ADD COLUMN posted_by   bigint REFERENCES users(id),
    ADD COLUMN posted_at   timestamptz;

-- NULL when the line was filled in automatically from a saved spelling;
-- item_aliases.confirmed_by then says who confirmed that spelling.
ALTER TABLE invoice_lines
    ADD COLUMN confirmed_by  bigint REFERENCES users(id);

ALTER TABLE item_aliases
    ADD COLUMN confirmed_by  bigint REFERENCES users(id);
