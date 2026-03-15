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

    # --- OPENROUTER ---
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "ВАШ_КЛЮЧ")
    OPENROUTER_URL: str = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions")
    OPENROUTER_HTTP_REFERER: str = os.getenv("OPENROUTER_HTTP_REFERER", "https://science.bsuir.by/ru/aihackathon")
    OPENROUTER_TITLE: str = os.getenv("OPENROUTER_TITLE", "AI Legal Diff Tool")
    OPENROUTER_TIMEOUT: int = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "30"))

    # --- ПАРАМЕТРЫ ПОИСКА (RAG) ---
    TOP_K: int = int(os.getenv("TOP_K", "7"))

    # --- ПУТИ ---
    DATA_DIR: Path = BASE_DIR / "data"
    INDEX_DIR: Path = BASE_DIR / "indexes"

    # --- СЕКРЕТЫ ---
    HF_TOKEN: str | None = os.getenv("HUGGINGFACEHUB_API_TOKEN")

# Создаем единый экземпляр настроек
settings = Settings()