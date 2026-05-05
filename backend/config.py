from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/trustpay_crm"
    SECRET_KEY: str = "change-this-secret-key-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "TrustPay Loans <noreply@trustpay.com>"

    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    AI_PROVIDER: str = "groq"
    TAVILY_API_KEY: Optional[str] = None

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    FRONTEND_URL: str = "http://localhost:3000"

    BACKEND_URL: str = "http://localhost:8000"

    IMGBB_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
