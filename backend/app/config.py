from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET_KEY = "dev-only-insecure-secret-key-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # "production" turns off the interactive API docs and requires real secrets.
    environment: str = "development"
    # Defaults to a local SQLite file so the API runs with zero setup.
    # Use PostgreSQL (see docker-compose.yml) for anything shared or deployed.
    database_url: str = "sqlite:///./iandatours.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    # Apply database migrations when the API starts. Turn off if you run "alembic upgrade head" in deploys.
    auto_migrate: bool = True
    seed_on_startup: bool = True

    # Signs staff session tokens. Generate with: python -c "import secrets; print(secrets.token_urlsafe(48))"
    secret_key: str = DEV_SECRET_KEY
    session_hours: int = 8

    # Public URLs used to build payment return and notification links.
    site_url: str = "http://localhost:5173"
    api_url: str = "http://localhost:8000"

    # PayHere (https://www.payhere.lk). Leave the merchant ID empty to take bookings without online payment.
    payhere_merchant_id: str = ""
    payhere_merchant_secret: str = ""
    payhere_sandbox: bool = True

    # AI assistant. Any OpenAI-compatible chat API works; leave LLM_MODEL empty to turn the assistant off.
    #   Ollama (free, local):  LLM_BASE_URL=http://localhost:11434/v1  LLM_MODEL=qwen2.5:7b
    #   Groq (free tier):      LLM_BASE_URL=https://api.groq.com/openai/v1  LLM_MODEL=llama-3.3-70b-versatile
    #   Gemini (free tier):    LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai  LLM_MODEL=gemini-2.5-flash
    llm_base_url: str = "http://localhost:11434/v1"
    llm_api_key: str = ""
    llm_model: str = ""
    llm_timeout_seconds: float = 60

    @property
    def assistant_enabled(self) -> bool:
        return bool(self.llm_model)

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def payments_enabled(self) -> bool:
        return bool(self.payhere_merchant_id and self.payhere_merchant_secret)

    @model_validator(mode="after")
    def require_real_secrets_in_production(self):
        if self.is_production:
            if self.secret_key == DEV_SECRET_KEY or len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be set to a random value of at least 32 characters in production")
            if self.payhere_sandbox and self.payments_enabled:
                raise ValueError("PAYHERE_SANDBOX must be false in production")
        return self


settings = Settings()
