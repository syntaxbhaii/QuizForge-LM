from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "QuizForge"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "qf_super_secret_production_encryption_key_hash_salt_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # CORS origins list
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    DATABASE_URL: str = "sqlite:///./quizforge.db"

    # First admin seed details
    FIRST_SUPERUSER_EMAIL: str = "admin@quizforge.com"
    FIRST_SUPERUSER_PASSWORD: str = "adminpassword123"

    # SMTP configuration
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = ""
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@quizforge.com"
    EMAILS_FROM_NAME: str = "QuizForge Assessments"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
