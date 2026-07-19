from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App configuration, loaded from environment variables or the root .env file.

    Never put real secrets in code or in .env.example — only in .env,
    which is gitignored.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Filled in at Stage 2 (ledger schema) from the Neon dashboard.
    database_url: str = ""


settings = Settings()
