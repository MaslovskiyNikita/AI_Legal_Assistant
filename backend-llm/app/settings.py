import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Грузим .env сразу при импортe настроек, чтобы os.getenv видел ключи
load_dotenv()


@dataclass
class OpenRouterSettings:
    api_key: str = os.getenv("OPENROUTER_API_KEY", "ВАШ_КЛЮЧ")
    url: str = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions")
    model: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    http_referer: str = os.getenv("OPENROUTER_HTTP_REFERER", "https://science.bsuir.by/ru/aihackathon")
    title: str = os.getenv("OPENROUTER_TITLE", "AI Legal Diff Tool")
    timeout_seconds: int = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "30"))
    max_concurrent_requests: int = int(os.getenv("OPENROUTER_MAX_CONCURRENT", "5"))


openrouter_settings = OpenRouterSettings()

