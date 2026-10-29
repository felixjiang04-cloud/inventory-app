-- Brute-force protection for logins (see LOGIN_LIMITS in app/auth.py).
-- One row per wrong email-or-password attempt. The email is stored as
-- typed (normalized) whether or not an account has it, so an unknown
-- email is locked exactly like a real one. Rows older than a day count
-- toward no limit and are deleted at the next successful login.
CREATE TABLE login_failures (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email      text NOT NULL,
    failed_at  timestamptz NOT NULL DEFAULT now()
);

-- "this email's failures in the last day"
CREATE INDEX login_failures_email_idx ON login_failures (email, failed_at);
-- "everyone's failures older than a day" (the cleanup)
CREATE INDEX login_failures_failed_at_idx ON login_failures (failed_at);
