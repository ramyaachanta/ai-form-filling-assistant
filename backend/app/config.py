from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "test-key-for-ci")
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    playwright_headless: bool = True
    playwright_timeout: int = 30000
    
    secret_key: str = os.getenv("SECRET_KEY", "test-secret-key-for-ci")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        # Allow reading from environment even if .env doesn't exist
        env_file_encoding = 'utf-8'


settings = Settings()

# Warn if using test keys in non-debug mode
if not settings.debug and settings.openai_api_key == "test-key-for-ci":
    import warnings
    warnings.warn(
        "Using test OpenAI API key in production mode. Set OPENAI_API_KEY environment variable.",
        UserWarning
    )
