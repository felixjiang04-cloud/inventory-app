import psycopg
from psycopg.rows import dict_row

from app.config import settings


def get_connection(url: str | None = None) -> psycopg.Connection:
    """Open a Postgres connection (rows come back as dicts).

    Defaults to the main database from .env; pass an explicit URL to
    target another database (e.g. the test branch).
    """
    return psycopg.connect(url or settings.database_url, row_factory=dict_row)
