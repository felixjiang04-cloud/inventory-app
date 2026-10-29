"""Logins, sessions and roles.

- Passwords are stored only as argon2id hashes: salted and deliberately
  slow, so a stolen database copy can't be turned back into passwords.
- Logging in creates a session. The browser keeps a random token in an
  httpOnly cookie (page JavaScript can't read it); the database keeps only
  the token's SHA-256 hash, so a database copy can't be used to log in.
- Two roles. "owner": everything. "staff": enter invoices and look around;
  confirming lines, posting, the catalog and staff accounts are owner-only.

Errors are i18n payloads like everywhere else (see errors.py).
"""

import hashlib
import re
import secrets
from dataclasses import dataclass

import psycopg
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import APIRouter, Cookie, Depends, Response
from psycopg import errors
from pydantic import BaseModel, Field

from app.config import settings
from app.deps import get_db
from app.errors import api_error

SESSION_COOKIE = "session"
MIN_PASSWORD_LENGTH = 8

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
    user = conn.execute(
        "SELECT id, email, role, password_hash FROM users WHERE email = %s AND active",
        (normalize_email(body.email),),
    ).fetchone()
    # Same error, and about the same time, whether the email or the password
    # was wrong (or the account was deactivated).
    known_hash = user["password_hash"] if user else _DUMMY_HASH
    if not password_matches(known_hash, body.password) or user is None:
        raise api_error(401, "authError.invalidCredentials")

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
        "UPDATE users SET password_hash = %s WHERE id = %s RETURNING id",
        (hash_password(body.password), user_id),
    ).fetchone()
    if user is None:
        raise api_error(404, "userError.notFound", userId=user_id)
    # sessions opened with the old password end now
    conn.execute("DELETE FROM sessions WHERE user_id = %s", (user_id,))
