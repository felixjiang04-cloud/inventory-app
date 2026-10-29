"""Logins, sessions, roles and "who did what".

The first tests are pure functions; the rest run against real Postgres
through the rolled-back `conn` (see conftest.py).
"""

import hashlib
from datetime import datetime, timedelta, timezone

import pytest
from psycopg import errors

from app import auth
from app.auth import (
    SESSION_COOKIE,
    hash_password,
    locked_until,
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


NOW = datetime(2026, 10, 29, 12, 0, tzinfo=timezone.utc)


def minutes_ago(*minutes: int) -> list[datetime]:
    return [NOW - timedelta(minutes=m) for m in minutes]


def test_five_failures_within_15_minutes_lock_an_email() -> None:
    assert locked_until([], NOW) is None
    assert locked_until(minutes_ago(1, 2, 3, 4), NOW) is None
    # the 5th newest failure was 10 minutes ago: 5 more minutes to wait
    assert locked_until(minutes_ago(1, 2, 3, 4, 10), NOW) == NOW + timedelta(minutes=5)
    # a failure 15 minutes old no longer counts
    assert locked_until(minutes_ago(1, 2, 3, 4, 15), NOW) is None


def test_twenty_failures_within_a_day_lock_an_email() -> None:
    # one failure every half hour: never 5 within 15 minutes
    nineteen = minutes_ago(*range(30, 600, 30))
    assert len(nineteen) == 19
    assert locked_until(nineteen, NOW) is None

    twenty = nineteen + minutes_ago(600)
    # locked until the oldest of the twenty is a day old
    assert locked_until(twenty, NOW) == NOW - timedelta(minutes=600) + timedelta(days=1)


def test_when_both_limits_are_reached_the_later_end_wins() -> None:
    # 5 failures right now (15-minute lock), plus 15 earlier today
    failures = minutes_ago(0, 0, 0, 0, 0) + minutes_ago(*range(60, 960, 60))
    assert len(failures) == 20
    assert locked_until(failures, NOW) == NOW - timedelta(minutes=900) + timedelta(days=1)


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


# --- brute-force protection --------------------------------------------------
# Inside one test, Postgres' now() stays fixed (it is the time the test's
# transaction began), so waits come out exact: 15 minutes, not 14:59.


def fail_logins(client, email, times=5):
    for _ in range(times):
        assert login(client, email, "wrong password").status_code == 401


def failure_count(conn, email) -> int:
    return conn.execute(
        "SELECT count(*) AS n FROM login_failures WHERE email = %s", (email,)
    ).fetchone()["n"]


def test_five_wrong_passwords_lock_the_email(
    conn, anon_client, make_user, test_password, monkeypatch
) -> None:
    make_user("ana@resto.ca")
    # typed differently, still one email: one counter
    for typed in [
        "ana@resto.ca",
        "ANA@resto.ca",
        " Ana@Resto.ca",
        "ana@RESTO.CA",
        "Ana@resto.ca ",
    ]:
        assert login(anon_client, typed, "wrong password").status_code == 401
    # each failure was kept, although its request ended in an error
    assert failure_count(conn, "ana@resto.ca") == 5

    def must_not_run(*args):
        raise AssertionError("a locked email's password was checked")

    monkeypatch.setattr(auth, "password_matches", must_not_run)

    response = login(anon_client, "ana@resto.ca", test_password)  # even the right one

    assert response.status_code == 429
    assert response.json() == {
        "detail": {"code": "authError.tooManyAttempts", "context": {"minutes": 15}}
    }
    assert response.headers["retry-after"] == "900"
    assert failure_count(conn, "ana@resto.ca") == 5  # a refused try doesn't count


def test_an_unknown_email_is_locked_exactly_like_a_real_one(anon_client, make_user) -> None:
    make_user("ana@resto.ca")
    fail_logins(anon_client, "ana@resto.ca")
    fail_logins(anon_client, "nobody@resto.ca")

    real = login(anon_client, "ana@resto.ca", "another guess")
    unknown = login(anon_client, "nobody@resto.ca", "another guess")

    assert real.status_code == unknown.status_code == 429
    assert real.json() == unknown.json()
    assert real.headers["retry-after"] == unknown.headers["retry-after"]


def test_the_lock_lifts_once_the_failures_are_15_minutes_old(
    conn, anon_client, make_user, test_password
) -> None:
    make_user("ana@resto.ca")
    fail_logins(anon_client, "ana@resto.ca")
    assert login(anon_client, "ana@resto.ca", test_password).status_code == 429

    conn.execute("UPDATE login_failures SET failed_at = failed_at - interval '15 minutes'")

    assert login(anon_client, "ana@resto.ca", test_password).status_code == 200


def test_a_successful_login_wipes_earlier_failures(
    conn, anon_client, make_user, test_password
) -> None:
    make_user("ana@resto.ca")
    fail_logins(anon_client, "ana@resto.ca", times=4)
    assert login(anon_client, "ana@resto.ca", test_password).status_code == 200
    assert failure_count(conn, "ana@resto.ca") == 0

    # 8 failures within 15 minutes, but only 4 since the last success
    fail_logins(anon_client, "ana@resto.ca", times=4)
    assert login(anon_client, "ana@resto.ca", test_password).status_code == 200


def test_twenty_failures_in_a_day_lock_the_email(
    conn, anon_client, make_user, test_password
) -> None:
    make_user("ana@resto.ca")
    # 20 failures two hours ago (one row per number from 1 to 20)
    conn.execute(
        """
        INSERT INTO login_failures (email, failed_at)
        SELECT 'ana@resto.ca', now() - interval '2 hours' FROM generate_series(1, 20)
        """
    )

    response = login(anon_client, "ana@resto.ca", test_password)

    assert response.status_code == 429
    assert response.json()["detail"]["context"] == {"minutes": 22 * 60}


def test_an_owner_password_reset_unlocks_the_staff_member(
    client, make_client, make_user
) -> None:
    staff_id = make_user("bo@resto.ca")
    fail_logins(make_client(), "bo@resto.ca")
    assert login(make_client(), "bo@resto.ca", "brand-new-pass").status_code == 429

    response = client.put(
        f"/api/users/{staff_id}/password", json={"password": "brand-new-pass"}
    )

    assert response.status_code == 204
    assert login(make_client(), "bo@resto.ca", "brand-new-pass").status_code == 200


def test_failures_older_than_a_day_are_deleted_at_the_next_login(
    conn, anon_client, make_user, test_password
) -> None:
    make_user("ana@resto.ca")
    conn.execute(
        """
        INSERT INTO login_failures (email, failed_at) VALUES
            ('old@resto.ca', now() - interval '25 hours'),
            ('recent@resto.ca', now() - interval '1 hour')
        """
    )

    assert login(anon_client, "ana@resto.ca", test_password).status_code == 200

    left = [row["email"] for row in conn.execute("SELECT email FROM login_failures")]
    assert left == ["recent@resto.ca"]


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
