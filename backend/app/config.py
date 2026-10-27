from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Defaults to a local SQLite file so the API runs with zero setup.
    # Use PostgreSQL (see docker-compose.yml) for anything shared or deployed.
    database_url: str = "sqlite:///./iandatours.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    seed_on_startup: bool = True


settings = Settings()
