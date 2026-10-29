"""Logins, sessions, roles and "who did what".

The first tests are pure functions; the rest run against real Postgres
through the rolled-back `conn` (see conftest.py).
"""

import hashlib

import pytest
from psycopg import errors

from app.auth import (
    SESSION_COOKIE,
    hash_password,
    looks_like_email,
    normalize_email,
    password_matches,
)
from app.create_owner import create_owner
from app.main import app

# --- pure helpers ----------------------------------------------------------


def test_passwords_are_stored_as_argon2id_hashes() -> None:
    stored = hash_password("s3cret-enough")
    assert stored.startswith("$argon2id$")
    assert "s3cret-enough" not in stored
    assert password_matches(stored, "s3cret-enough")
    assert not password_matches(stored, "S3cret-enough")
    assert not password_matches("not a hash at all", "s3cret-enough")


def test_emails_are_normalized_and_checked() -> None:
    assert normalize_email("  Ana@Resto.CA ") == "ana@resto.ca"
    assert looks_like_email("ana@resto.ca")
    assert not looks_like_email("ana@resto")
    assert not looks_like_email("ana resto.ca")


# --- logging in and out ----------------------------------------------------


def login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_login_sets_a_safe_cookie_and_me_works(anon_client, make_user) -> None:
    make_user("ana@resto.ca", role="owner", password="right password")

    response = login(anon_client, "  ANA@resto.ca", "right password")

    assert response.status_code == 200
    assert response.json()["role"] == "owner"
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie
    me = anon_client.get("/api/auth/me").json()
    assert me["email"] == "ana@resto.ca"
    assert me["role"] == "owner"


def test_wrong_password_and_unknown_email_look_identical(anon_client, make_user) -> None:
    make_user("ana@resto.ca", password="right password")

    wrong_password = login(anon_client, "ana@resto.ca", "wrong password")
    unknown_email = login(anon_client, "nobody@resto.ca", "right password")

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json() == {
        "detail": {"code": "authError.invalidCredentials", "context": {}}
    }


def test_only_a_hash_of_the_session_token_is_stored(conn, anon_client, make_user) -> None:
    make_user("ana@resto.ca", password="right password")
    login(anon_client, "ana@resto.ca", "right password")
    token = anon_client.cookies[SESSION_COOKIE]

    stored = [row["token_hash"] for row in conn.execute("SELECT token_hash FROM sessions")]

    assert token not in stored
    assert hashlib.sha256(token.encode()).hexdigest() in stored


def test_logout_ends_the_session_for_good(client, make_client) -> None:
    token = client.cookies[SESSION_COOKIE]

    assert client.post("/api/auth/logout").status_code == 204

    assert client.get("/api/auth/me").status_code == 401
    # even someone who copied the old cookie is locked out
    thief = make_client()
    thief.cookies.set(SESSION_COOKIE, token)
    assert thief.get("/api/auth/me").status_code == 401


def test_expired_session_is_rejected(conn, client) -> None:
    conn.execute("UPDATE sessions SET expires_at = now() - interval '1 second'")
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "authError.notLoggedIn"


# --- every route is protected -----------------------------------------------

PUBLIC_ROUTES = {"/api/health", "/api/auth/login", "/api/auth/logout"}


def all_api_routes():
    # The OpenAPI schema lists every path and method the app serves,
    # including those of included routers.
    for path, operations in app.openapi()["paths"].items():
        if path.startswith("/api"):
            for method in operations:
                yield method.upper(), path


def test_every_api_route_except_login_requires_a_login(anon_client) -> None:
    # Walks the app's real route table, so an endpoint added later without
    # protection makes this test fail.
    checked = 0
    for method, path in all_api_routes():
        if path in PUBLIC_ROUTES:
            continue
        concrete = path.replace("{invoice_id}", "1").replace("{line_id}", "1")
        concrete = concrete.replace("{user_id}", "1")
        response = anon_client.request(method, concrete, json={})
        assert response.status_code == 401, f"{method} {path} is not protected"
        checked += 1
    assert checked >= 12  # sanity: the walk really found the routes


OWNER_ONLY = [
    ("POST", "/api/suppliers", {"name": "Marché"}),
    ("POST", "/api/items", {"name": "Riz", "base_unit": "g"}),
    ("PUT", "/api/invoice-lines/1/confirm", {"item_id": 1, "qty_per_unit": 1}),
    ("POST", "/api/invoices/1/post", {}),
    ("GET", "/api/users", None),
    ("POST", "/api/users", {"email": "x@resto.ca", "password": "long enough"}),
    ("PUT", "/api/users/1/active", {"active": False}),
    ("PUT", "/api/users/1/password", {"password": "long enough"}),
]


@pytest.mark.parametrize(("method", "path", "body"), OWNER_ONLY)
def test_staff_cannot_use_owner_only_routes(staff_client, method, path, body) -> None:
    response = staff_client.request(method, path, json=body)
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "authError.ownerOnly"


# --- staff accounts -----------------------------------------------------------


def test_owner_creates_staff_who_can_then_log_in(client, make_client) -> None:
    response = client.post(
        "/api/users", json={"email": "Bo@Resto.ca", "password": "kitchen-123"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "bo@resto.ca"
    assert response.json()["role"] == "staff"  # the app only makes staff

    assert login(make_client(), "bo@resto.ca", "kitchen-123").status_code == 200


@pytest.mark.parametrize(
    ("body", "status", "code"),
    [
        ({"email": "bo@resto", "password": "kitchen-123"}, 422, "userError.badEmail"),
        ({"email": "bo@resto.ca", "password": "short"}, 422, "userError.passwordTooShort"),
        ({"email": "OWNER@example.test", "password": "kitchen-123"}, 409, "userError.emailTaken"),
    ],
)
def test_bad_staff_accounts_are_refused(client, body, status, code) -> None:
    response = client.post("/api/users", json=body)
    assert response.status_code == status
    assert response.json()["detail"]["code"] == code


def user_id(conn, email) -> int:
    return conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()["id"]


def test_deactivated_staff_is_logged_out_and_cannot_log_back_in(
    client, staff_client, make_client, conn, test_password
) -> None:
    staff_id = user_id(conn, "staff@example.test")
    assert staff_client.get("/api/auth/me").status_code == 200

    response = client.put(f"/api/users/{staff_id}/active", json={"active": False})

    assert response.status_code == 200
    assert staff_client.get("/api/auth/me").status_code == 401  # immediately
    assert login(make_client(), "staff@example.test", test_password).status_code == 401


def test_password_reset_replaces_the_old_one(
    client, staff_client, make_client, conn, test_password
) -> None:
    staff_id = user_id(conn, "staff@example.test")

    response = client.put(
        f"/api/users/{staff_id}/password", json={"password": "brand-new-pass"}
    )

    assert response.status_code == 204
    assert staff_client.get("/api/auth/me").status_code == 401  # old session ended
    assert login(make_client(), "staff@example.test", test_password).status_code == 401
    assert login(make_client(), "staff@example.test", "brand-new-pass").status_code == 200


def test_owner_cannot_deactivate_themself(client) -> None:
    me = client.get("/api/auth/me").json()
    response = client.put(f"/api/users/{me['id']}/active", json={"active": False})
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "userError.cannotDeactivateSelf"


# --- who did what ---------------------------------------------------------------


def test_invoice_records_who_entered_confirmed_and_posted_it(
    client, staff_client, conn
) -> None:
    owner_id = user_id(conn, "owner@example.test")
    staff_id = user_id(conn, "staff@example.test")
    supplier = client.post("/api/suppliers", json={"name": "Marché"}).json()["id"]
    rice = client.post("/api/items", json={"name": "Riz", "base_unit": "g"}).json()["id"]

    # staff enters the invoice...
    response = staff_client.post(
        "/api/invoices",
        json={
            "supplier_id": supplier,
            "invoice_date": "2026-10-01",
            "lines": [{"raw_text": "RIZ 10KG", "quantity": "1", "line_total": "20.00"}],
            "subtotal": "20.00",
            "total": "20.00",
        },
    )
    assert response.status_code == 201
    invoice_id = response.json()["id"]
    line_id = conn.execute(
        "SELECT id FROM invoice_lines WHERE invoice_id = %s", (invoice_id,)
    ).fetchone()["id"]
    # ...but may not confirm or post it
    assert staff_client.post(f"/api/invoices/{invoice_id}/post").status_code == 403

    # the owner confirms and posts
    client.put(
        f"/api/invoice-lines/{line_id}/confirm",
        json={"item_id": rice, "qty_per_unit": 10000},
    )
    assert client.post(f"/api/invoices/{invoice_id}/post").status_code == 200

    invoice = conn.execute(
        "SELECT created_by, posted_by, posted_at FROM invoices WHERE id = %s",
        (invoice_id,),
    ).fetchone()
    assert invoice["created_by"] == staff_id
    assert invoice["posted_by"] == owner_id
    assert invoice["posted_at"] is not None
    line = conn.execute(
        "SELECT confirmed_by FROM invoice_lines WHERE id = %s", (line_id,)
    ).fetchone()
    assert line["confirmed_by"] == owner_id
    alias = conn.execute("SELECT confirmed_by FROM item_aliases").fetchone()
    assert alias["confirmed_by"] == owner_id


# --- the create-owner command ----------------------------------------------------


def test_create_owner_command_makes_an_owner_who_can_log_in(conn, anon_client) -> None:
    create_owner(conn, " Chef@Resto.ca ", "owner-pass-123")

    response = login(anon_client, "chef@resto.ca", "owner-pass-123")
    assert response.status_code == 200
    assert response.json()["role"] == "owner"

    with pytest.raises(errors.UniqueViolation):
        with conn.transaction():
            create_owner(conn, "chef@resto.ca", "another-pass-1")
