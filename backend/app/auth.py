"""Logins, sessions and roles.

- Passwords are stored only as argon2id hashes: salted and deliberately
  slow, so a stolen database copy can't be turned back into passwords.
- Logging in creates a session. The browser keeps a random token in an
  httpOnly cookie (page JavaScript can't read it); the database keeps only
  the token's SHA-256 hash, so a database copy can't be used to log in.
- Two roles. "owner": everything. "staff": enter invoices and look around;
  confirming lines, posting, the catalog and staff accounts are owner-only.
- Brute-force protection: an email address with too many wrong passwords
  is refused for a while (see LOGIN_LIMITS).

Errors are i18n payloads like everywhere else (see errors.py).
"""

import hashlib
import math
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

import psycopg
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import APIRouter, Cookie, Depends, Response
from psycopg import errors
from pydantic import BaseModel, Field

from app.config import settings
from app.deps import get_db
from app.errors import api_error, api_error_response

SESSION_COOKIE = "session"
MIN_PASSWORD_LENGTH = 8

# Brute-force protection. Each (max failures, window) pair limits one email
# address, whether or not an account has it: max_failures wrong passwords
# within the window refuse that email until enough of them are older than
# the window. The short limit stops quick guessing; the daily one caps a
# patient attacker at about 20 guesses per account per day.
LOGIN_LIMITS = [(5, timedelta(minutes=15)), (20, timedelta(hours=24))]
# Older failures count toward no limit, so they are deleted.
LOGIN_FAILURES_KEPT = max(window for _, window in LOGIN_LIMITS)

_hasher = PasswordHasher()  # argon2id, the library's recommended settings
# Checked against when an email is unknown, so a wrong email takes as long
# as a wrong password: response times don't reveal which emails exist.
_DUMMY_HASH = _hasher.hash("not-a-real-password")
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ---------------------------------------------------------------------------
# Small pure helpers (tested without a database)
# ---------------------------------------------------------------------------


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def password_matches(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def normalize_email(email: str) -> str:
    """Emails are stored lowercase, so "Ana@X.ca" and "ana@x.ca" are one user."""
    return email.strip().lower()


def looks_like_email(email: str) -> bool:
    return _EMAIL.match(email) is not None


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def locked_until(failures: list[datetime], now: datetime) -> datetime | None:
    """When an email whose logins failed at these times may try again, or
    None if it may try now (see LOGIN_LIMITS)."""
    ends = []
    for max_failures, window in LOGIN_LIMITS:
        recent = sorted((t for t in failures if t > now - window), reverse=True)
        if len(recent) >= max_failures:
            # Once the max_failures-th newest is older than the window,
            # fewer than max_failures are left inside it.
            ends.append(recent[max_failures - 1] + window)
    return max(ends, default=None)


def _email_lock_key(email: str) -> int:
    """The number naming this email's lock in Postgres (advisory locks are
    named by a 64-bit integer, so the email is hashed down to one)."""
    digest = hashlib.sha256(email.encode()).digest()
    return int.from_bytes(digest[:8], "big", signed=True)


# ---------------------------------------------------------------------------
# Dependencies: who is calling, and may they do this?
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class User:
    id: int
    email: str
    role: str  # "owner" or "staff"


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    conn: psycopg.Connection = Depends(get_db),
) -> User:
    """The logged-in user, or 401. Every /api route except login uses this."""
    if session_token:
        row = conn.execute(
            """
            SELECT u.id, u.email, u.role
            FROM sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = %s AND s.expires_at > now() AND u.active
            """,
            (_token_hash(session_token),),
        ).fetchone()
        if row is not None:
            return User(**row)
    raise api_error(401, "authError.notLoggedIn")


def require_owner(user: User = Depends(get_current_user)) -> User:
    """The logged-in owner, or 403 for staff."""
    if user.role != "owner":
        raise api_error(403, "authError.ownerOnly")
    return user


def _user_json(user) -> dict:
    return {"id": user["id"], "email": user["email"], "role": user["role"]}


# ---------------------------------------------------------------------------
# /api/auth: log in, log out, who am I
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api/auth")


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=256)


@router.post("/login")
def login(
    body: LoginIn, response: Response, conn: psycopg.Connection = Depends(get_db)
):
    email = normalize_email(body.email)
    # Logins for one email take turns: this lock is held until the request's
    # transaction ends. Otherwise a burst of parallel guesses would all pass
    # the check below before any of their failures was saved.
    conn.execute("SELECT pg_advisory_xact_lock(%s)", (_email_lock_key(email),))
    now = conn.execute("SELECT now()").fetchone()["now"]
    failures = [
        row["failed_at"]
        for row in conn.execute(
            "SELECT failed_at FROM login_failures WHERE email = %s AND failed_at > %s",
            (email, now - LOGIN_FAILURES_KEPT),
        )
    ]
    until = locked_until(failures, now)
    if until is not None:
        # Refused without looking at the password or the account: during a
        # lock even the right password fails (or the lock would tell an
        # attacker when they guessed right), and an unknown email gets the
        # very same answer as a real one. Not counted as another failure.
        seconds = math.ceil((until - now).total_seconds())
        return api_error_response(
            429,
            "authError.tooManyAttempts",
            headers={"Retry-After": str(seconds)},
            minutes=math.ceil(seconds / 60),
        )

    user = conn.execute(
        "SELECT id, email, role, password_hash FROM users WHERE email = %s AND active",
        (email,),
    ).fetchone()
    # Same error, and about the same time, whether the email or the password
    # was wrong (or the account was deactivated).
    known_hash = user["password_hash"] if user else _DUMMY_HASH
    if not password_matches(known_hash, body.password) or user is None:
        conn.execute("INSERT INTO login_failures (email) VALUES (%s)", (email,))
        # Returned, not raised: get_db undoes everything a raising request
        # wrote, which would erase the failure just recorded.
        return api_error_response(401, "authError.invalidCredentials")

    # The right password wipes this email's slate; failures too old to
    # count toward any limit are dropped for everyone.
    conn.execute("DELETE FROM login_failures WHERE email = %s", (email,))
    conn.execute(
        "DELETE FROM login_failures WHERE failed_at < %s", (now - LOGIN_FAILURES_KEPT,)
    )

    token = secrets.token_urlsafe(32)
    conn.execute(
        """
        INSERT INTO sessions (token_hash, user_id, expires_at)
        VALUES (%s, %s, now() + make_interval(days => %s))
        """,
        (_token_hash(token), user["id"], settings.session_days),
    )
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=settings.session_days * 24 * 3600,
        httponly=True,  # page JavaScript can't read it
        samesite="lax",  # other sites can't make the browser send it on a POST
        secure=settings.session_cookie_secure,  # HTTPS only
        path="/",
    )
    return _user_json(user)


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    conn: psycopg.Connection = Depends(get_db),
):
    if session_token:
        conn.execute(
            "DELETE FROM sessions WHERE token_hash = %s", (_token_hash(session_token),)
        )
    response.delete_cookie(
        SESSION_COOKIE,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.session_cookie_secure,
    )


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "role": user.role}


# ---------------------------------------------------------------------------
# /api/users: the owner manages staff accounts
# ---------------------------------------------------------------------------

users_router = APIRouter(prefix="/api/users", dependencies=[Depends(require_owner)])


class NewStaffIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=256)


class PasswordIn(BaseModel):
    password: str = Field(max_length=256)


class ActiveIn(BaseModel):
    active: bool


def _check_password(password: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise api_error(422, "userError.passwordTooShort", min=MIN_PASSWORD_LENGTH)


@users_router.get("")
def list_users(conn: psycopg.Connection = Depends(get_db)):
    return conn.execute(
        "SELECT id, email, role, active FROM users ORDER BY role, email"
    ).fetchall()


@users_router.post("", status_code=201)
def create_staff(body: NewStaffIn, conn: psycopg.Connection = Depends(get_db)):
    email = normalize_email(body.email)
    if not looks_like_email(email):
        raise api_error(422, "userError.badEmail")
    _check_password(body.password)
    try:
        with conn.transaction():
            return conn.execute(
                """
                INSERT INTO users (email, password_hash, role)
                VALUES (%s, %s, 'staff')
                RETURNING id, email, role, active
                """,
                (email, hash_password(body.password)),
            ).fetchone()
    except errors.UniqueViolation:
        raise api_error(409, "userError.emailTaken", email=email) from None


@users_router.put("/{user_id}/active")
def set_active(
    user_id: int,
    body: ActiveIn,
    owner: User = Depends(require_owner),
    conn: psycopg.Connection = Depends(get_db),
):
    if user_id == owner.id and not body.active:
        raise api_error(409, "userError.cannotDeactivateSelf")
    user = conn.execute(
        "UPDATE users SET active = %s WHERE id = %s RETURNING id, email, role, active",
        (body.active, user_id),
    ).fetchone()
    if user is None:
        raise api_error(404, "userError.notFound", userId=user_id)
    if not body.active:
        # logged out everywhere, immediately — not at the next expiry
        conn.execute("DELETE FROM sessions WHERE user_id = %s", (user_id,))
    return user


@users_router.put("/{user_id}/password", status_code=204)
def reset_password(
    user_id: int, body: PasswordIn, conn: psycopg.Connection = Depends(get_db)
):
    _check_password(body.password)
    user = conn.execute(
        "UPDATE users SET password_hash = %s WHERE id = %s RETURNING id, email",
        (hash_password(body.password), user_id),
    ).fetchone()
    if user is None:
        raise api_error(404, "userError.notFound", userId=user_id)
    # sessions opened with the old password end now, and a lock from earlier
    # wrong passwords is lifted, so the new password works at once
    conn.execute("DELETE FROM sessions WHERE user_id = %s", (user_id,))
    conn.execute("DELETE FROM login_failures WHERE email = %s", (user["email"],))
