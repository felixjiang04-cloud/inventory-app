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

    database_url: str = ""
    # Separate Neon branch used only by the test suite; tests skip if unset.
    database_url_test: str = ""


settings = Settings()
