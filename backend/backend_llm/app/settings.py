import os
from pathlib import Path
from dataclasses import dataclass
from dotenv import load_dotenv

# Грузим .env сразу
load_dotenv()

# Базовая директория backend-llm/
BASE_DIR = Path(__file__).resolve().parent.parent

@dataclass
class Settings:
    # --- МОДЕЛИ ---
    EMBEDDINGS_MODEL: str = os.getenv("EMBEDDINGS_MODEL", "intfloat/multilingual-e5-large")

    # --- GEMINI ---
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_BASE_URL: str = os.getenv("GEMINI_BASE_URL", "https://still-limit-741c.s-markovtsev.workers.dev")
    GEMINI_TIMEOUT: int = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "30"))

    # --- ПАРАМЕТРЫ ПОИСКА (RAG) ---
    TOP_K: int = int(os.getenv("TOP_K", "7"))

    # --- ПУТИ ---
    DATA_DIR: Path = BASE_DIR / "data"

    # --- СЕКРЕТЫ ---
    HF_TOKEN: str | None = os.getenv("HF", "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")
 
    # --- БД ---
    DB_USER: str = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "superpassword")
    DB_HOST: str = os.getenv("POSTGRES_HOST", "db-backend")
    DB_PORT: str = os.getenv("POSTGRES_PORT", "6432")
    DB_NAME: str = os.getenv("POSTGRES_DB", "hackathon_db")

    @property
    def PGVECTOR_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

# Создаем единый экземпляр настроек
settings = Settings()