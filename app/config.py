from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # База данных
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    
    # Безопасность
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Приложение
    APP_NAME: str = "Restaurant Management System"
    VERSION: str = "1.0.0"
    TIMEZONE: str = "Asia/Novosibirsk"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()