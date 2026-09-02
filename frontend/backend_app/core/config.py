import json
import os
from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    POSTGRES_URL: str = ""
    BACKEND_URL: str = "http://127.0.0.1:8000"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "DMICS API"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://dmics.vercel.app"]
    CORS_ORIGIN_REGEX: str = r"https://.*\.ict-4-d\.vercel\.app"
    SECRET_KEY: str = "dmics-secret-key-change-in-production-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    model_config = {"env_file": (".env", ".env.local"), "env_file_encoding": "utf-8", "extra": "ignore"}

    @model_validator(mode="after")
    def resolve_database_url(self):
        if not self.DATABASE_URL and self.POSTGRES_URL:
            self.DATABASE_URL = self.POSTGRES_URL
        elif not self.DATABASE_URL and not self.POSTGRES_URL:
            self.DATABASE_URL = os.environ.get("DATABASE_URL", "")
        return self

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
