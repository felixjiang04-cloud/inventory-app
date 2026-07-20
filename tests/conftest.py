import pytest

from app import migrate
from app.config import settings
from app.db import get_connection


@pytest.fixture(scope="session")
def test_db_url() -> str:
    """Connection string of the Neon test branch; skips DB tests if unset."""
    if not settings.database_url_test:
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
