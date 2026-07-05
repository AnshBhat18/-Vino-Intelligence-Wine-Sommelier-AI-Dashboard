import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Vino Intelligence API"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # React default
        "http://localhost:8001",  # FastAPI default
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8001",
    ]
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Root of workspace is 2 levels up from app
    ROOT_DIR: str = os.path.dirname(os.path.dirname(BASE_DIR))
    MODEL_DIR: str = os.path.join(ROOT_DIR, "model")
    DATA_PATH: str = os.path.join(ROOT_DIR, "WineQT.csv")
    
    # Database
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'vino_intelligence.db')}"
    
    class Config:
        case_sensitive = True

settings = Settings()
