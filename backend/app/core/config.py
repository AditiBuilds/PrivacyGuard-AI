import os
from typing import List
from pydantic import BaseModel, Field

class Settings(BaseModel):
    PROJECT_NAME: str = "PrivacyGuard AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./privacyguard.db")
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "deterministic")  # "deterministic" or "ollama"
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Agent Guardrails
    AGENT_MAX_STEPS: int = 8
    AGENT_TIMEOUT_SECONDS: int = 30
    MAX_INPUT_LENGTH_CHARS: int = 100000
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    
    # Privacy Defaults
    DEFAULT_RETENTION_DAYS: int = 30
    DEFAULT_REVIEW_THRESHOLD: int = 60  # Risk score >= 60 triggers review
    LOCAL_ONLY_PROCESSING: bool = True
    MASKING_STRATEGY: str = "token"  # "token" ([EMAIL_1]) or "redact" ([REDACTED])
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
