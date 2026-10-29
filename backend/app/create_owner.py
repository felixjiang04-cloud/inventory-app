r"""Create an owner account: the very first login, or an extra owner.

Usage, from the repo root (PowerShell):
    $env:PYTHONPATH = "backend"; backend\.venv\Scripts\python -m app.create_owner
Git Bash:
    PYTHONPATH=backend backend/.venv/Scripts/python -m app.create_owner

Asks for the email and the password interactively. The password is typed
hidden, so it never lands in your shell history or in any file. Staff
accounts are created later by the owner, inside the app.
"""

import getpass
import sys

import psycopg
from psycopg import errors

from app.auth import (
    MIN_PASSWORD_LENGTH,
    hash_password,
    looks_like_email,
    normalize_email,
)
from app.db import get_connection


def create_owner(conn: psycopg.Connection, email: str, password: str) -> int:
    """Insert an owner; returns its id. Raises UniqueViolation if taken."""
    return conn.execute(
        """
        INSERT INTO users (email, password_hash, role)
        VALUES (%s, %s, 'owner') RETURNING id
        """,
        (normalize_email(email), hash_password(password)),
    ).fetchone()["id"]


def main() -> int:
    email = normalize_email(input("Owner email: "))
    if not looks_like_email(email):
        print("That doesn't look like an email address.")
        return 1
    password = getpass.getpass(
        f"Password (at least {MIN_PASSWORD_LENGTH} characters, hidden): "
    )
    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"Too short: use at least {MIN_PASSWORD_LENGTH} characters.")
        return 1
    if getpass.getpass("Same password again: ") != password:
        print("The two passwords don't match.")
        return 1

    with get_connection() as conn:
        try:
            user_id = create_owner(conn, email, password)
        except errors.UniqueViolation:
            print(f"{email} already has an account.")
            return 1
        conn.commit()
    print(f"Owner account created for {email} (user id {user_id}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
