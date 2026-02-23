from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "BrandFlow Studio"
    debug: bool = True

    # Database (Supabase)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Storage
    storage_bucket: str = "brandflow-assets"

    # AI APIs
    google_api_key: str = ""  # For Gemini
    openai_api_key: str = ""

    # Cutout APIs
    photoroom_api_key: str = ""
    removebg_api_key: str = ""

    # Celery/Redis
    redis_url: str = "redis://localhost:6379/0"

    # Export settings
    pptx_font_mapping: dict = {
        "Pretendard": "맑은 고딕",
        "Noto Sans KR": "맑은 고딕",
        "Spoqa Han Sans": "맑은 고딕",
        "Inter": "Arial",
        "Roboto": "Arial",
    }

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
