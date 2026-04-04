from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Для Railway используем переменную PORT
    PORT: int = int(os.getenv("PORT", 8000))
    
    # База данных
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://restaurant_user:restaurant_pass@localhost:5433/restaurant_db"
    )
    DATABASE_URL_SYNC: str = os.getenv(
        "DATABASE_URL_SYNC",
        "postgresql://restaurant_user:restaurant_pass@localhost:5433/restaurant_db"
    )
    
    # Безопасность
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "super-secret-key-change-in-production-1234567890"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Приложение
    APP_NAME: str = "Restaurant Management System"
    VERSION: str = "1.0.0"
    TIMEZONE: str = "Asia/Novosibirsk"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()