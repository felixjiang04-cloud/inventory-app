"""Apply SQL migrations from backend/migrations in filename order.

Usage (from the repo root):  python -m app.migrate
Already-applied files are recorded in schema_migrations and skipped,
so running this repeatedly is safe.
"""

from pathlib import Path

from app.db import get_connection

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


def apply_migrations(url: str | None = None) -> list[str]:
    """Apply pending migrations; returns the filenames newly applied."""
    applied_now: list[str] = []
    with get_connection(url) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename    text PRIMARY KEY,
                applied_at  timestamptz NOT NULL DEFAULT now()
            )
            """
        )
        already = {
            row["filename"]
            for row in conn.execute("SELECT filename FROM schema_migrations")
        }
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            if path.name in already:
                continue
            conn.execute(path.read_text(encoding="utf-8"))
            conn.execute(
                "INSERT INTO schema_migrations (filename) VALUES (%s)",
                (path.name,),
            )
            applied_now.append(path.name)
        conn.commit()
    return applied_now


if __name__ == "__main__":
    newly = apply_migrations()
    if newly:
        for name in newly:
            print(f"applied {name}")
    else:
        print("nothing to apply — database is up to date")
