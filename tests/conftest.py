import os

import pytest

from app import migrate
from app.config import settings
from app.db import get_connection


@pytest.fixture(scope="session")
def test_db_url() -> str:
    """Connection string of the test database; skips DB tests if unset.

    CI sets REQUIRE_DB_TESTS=1: there a missing database FAILS the run
    instead of quietly skipping every database test.
    """
    if not settings.database_url_test:
        if os.environ.get("REQUIRE_DB_TESTS") == "1":
            pytest.fail("REQUIRE_DB_TESTS=1 but DATABASE_URL_TEST is not set")
        pytest.skip("DATABASE_URL_TEST not set in .env — skipping database tests")
    migrate.apply_migrations(settings.database_url_test)
    return settings.database_url_test


@pytest.fixture
def conn(test_db_url):
    """A connection whose transaction is always rolled back after the test.

    Every test starts from a clean database and leaves no trace, so tests
    can run in any order, any number of times.
    """
    with get_connection(test_db_url) as connection:
        with connection.transaction(force_rollback=True):
            yield connection


TEST_PASSWORD = "correct horse battery staple"


@pytest.fixture
def make_client(conn):
    """Factory for API test clients whose requests share the rolled-back
    test connection. Each client has its own cookies — like its own browser."""
    from fastapi.testclient import TestClient

    from app.deps import get_db
    from app.main import app

    def override():
        # Like the real get_db: a request that raises leaves nothing behind.
        # Here that is a savepoint rolled back (the test's own transaction
        # stays open), so tests never keep writes that production undoes.
        with conn.transaction():
            yield conn

    app.dependency_overrides[get_db] = override
    try:
        # https: the login cookie is Secure, so it only travels over https
        yield lambda: TestClient(app, base_url="https://testserver")
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def make_user(conn):
    """Factory: insert a user straight into the database, return its id."""
    from app.auth import hash_password

    def make(email: str, role: str = "staff", password: str = TEST_PASSWORD) -> int:
        return conn.execute(
            """
            INSERT INTO users (email, password_hash, role)
            VALUES (%s, %s, %s) RETURNING id
            """,
            (email, hash_password(password), role),
        ).fetchone()["id"]

    return make


@pytest.fixture
def test_password() -> str:
    """The password every make_user() account gets unless told otherwise."""
    return TEST_PASSWORD


def _logged_in(client, email: str):
    response = client.post(
        "/api/auth/login", json={"email": email, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, response.text
    return client


@pytest.fixture
def client(make_client, make_user):
    """API client logged in as the owner, through the real login endpoint."""
    make_user("owner@example.test", role="owner")
    return _logged_in(make_client(), "owner@example.test")


@pytest.fixture
def staff_client(make_client, make_user):
    """API client logged in as a staff member."""
    make_user("staff@example.test", role="staff")
    return _logged_in(make_client(), "staff@example.test")


@pytest.fixture
def anon_client(make_client):
    """API client that never logged in."""
    return make_client()
