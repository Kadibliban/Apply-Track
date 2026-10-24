from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ApplyTrack"
    environment: str = "development"
    frontend_origin: str = "http://localhost:5173"
    database_url: str = "postgresql+psycopg://applytrack:applytrack@localhost:5432/applytrack"
    jwt_secret_key: str = Field(min_length=32)
    jwt_access_token_expire_minutes: int = Field(default=30, gt=0)
    log_level: str = "INFO"


settings = Settings()
