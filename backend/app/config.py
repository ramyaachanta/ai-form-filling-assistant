from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    
    openai_api_key: str
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    playwright_headless: bool = True
    playwright_timeout: int = 30000
    
    secret_key: str = "your-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

