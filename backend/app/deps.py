from collections.abc import Generator

import psycopg

from app.db import get_connection


def get_db() -> Generator[psycopg.Connection, None, None]:
    """One database connection per request.

    Commits when the request succeeds, rolls back when it raises —
    so a half-finished request never leaves half-written data.
    Tests override this with a connection that is always rolled back.
    """
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
