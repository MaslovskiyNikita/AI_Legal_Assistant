import json
import re
from typing import List

import httpx
from pydantic import BaseModel

from .settings import openrouter_settings
from .models import FullDocumentAnalysis, RiskLevel, ChangeAnalysis


class RiskAnalysis(BaseModel):
    risk: str  # "GREEN", "YELLOW", "RED"
    explanation: str
    violated_law: str | None = None
    source: str  # "LLM" or "heuristic"


class AiRiskAnalyzer:
    """
    Анализ изменений: сначала пробуем внешний LLM (OpenRouter),
    при любой ошибке — возвращаем вменяемый ответ локальной эвристикой.
    """

    @staticmethod
    def _heuristic(diff_text: str, fallback_reason: str | None = None) -> FullDocumentAnalysis:
        # Эвристика на основе diff текста
        lowered_diff = diff_text.lower()
        
        red_markers = [
            "отказ",
            "расторжение",
            "прекращение",
            "ответственность",
            "штраф",
            "неустойка",
            "обязан",
            "обязанность",
            "увеличение срока",
        ]
        green_markers = [
            "уточнение",
            "исправление опечатки",
            "техническая правка",
            "редакционное изменение",
        ]

        risk = RiskLevel.YELLOW

        if any(m in lowered_diff for m in red_markers):
            risk = RiskLevel.RED
        elif any(m in lowered_diff for m in green_markers) and len(diff_text) < 200:
            risk = RiskLevel.GREEN
        elif len(diff_text) < 100:
            risk = RiskLevel.GREEN

        base_expl = (
            "Эвристическая оценка без полноценного ответа внешнего LLM: "
            "учитывается масштаб изменений и наличие типичных триггеров риска "
            "(отказы, расторжение, ответственность и т.п.)."
        )
        if fallback_reason:
            base_expl += f" (фолбэк по причине: {fallback_reason})"

        return FullDocumentAnalysis(
            overall_risk=risk,
            summary=base_expl,
            details=[]
        )

    @staticmethod
    async def analyze_diff(diff_text: str) -> FullDocumentAnalysis:
        api_key = openrouter_settings.api_key

        # Если ключа нет — сразу идём по эвристике, чтобы не падать
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return AiRiskAnalyzer._heuristic(diff_text, "отсутствует OPENROUTER_API_KEY")

        prompt = f"""
Ты — Игорь Тикумс, ведущий юрист-эксперт Республики Беларусь. 
Перед тобой текст изменений в формате Unified Diff (+++ добавлено, --- удалено).
Твоя задача: провести глубокий правовой аудит и выявить риски.

Иерархия НПА РБ: Конституция, Законы, Указы Президента, Постановления Совмина, ТК РБ.

ТЕКСТ ИЗМЕНЕНИЙ:
{diff_text}

ИНСТРУКЦИЯ:
1. Изучи каждый измененный фрагмент.
2. Определи уровень риска:
   - GREEN: Техническое, не влияет на права.
   - YELLOW: Смена процедур, сроков (нужна проверка бизнеса).
   - RED: Нарушение ТК РБ, противоречие законам, ухудшение положения работника.
3. Верни ответ СТРОГО в формате JSON.

ПРИМЕР ФОРМАТА:
{{
  "overall_risk": "RED",
  "summary": "Общее описание...",
  "details": [
    {{
      "title": "Срок выплаты зарплаты",
      "risk": "RED",
      "explanation": "Срок увеличен до 45 дней, что нарушает ТК РБ",
      "violated_law": "ст. 73 ТК РБ"
    }}
  ]
}}
        """.strip()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": openrouter_settings.http_referer,
            "X-Title": openrouter_settings.title,
        }

        try:
            async with httpx.AsyncClient(timeout=openrouter_settings.timeout_seconds) as client:
                response = await client.post(
                    openrouter_settings.url,
                    headers=headers,
                    json={
                        "model": openrouter_settings.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"}
                    },
                )
                response.raise_for_status()

                # Явно фиксируем кодировку на UTF-8, чтобы не словить ascii‑ошибки
                if response.encoding is None:
                    response.encoding = "utf-8"

                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # Парсим JSON в Pydantic модель
                return FullDocumentAnalysis.model_validate_json(content)
        except Exception as e:
            # Любая ошибка сети / парсинга — не валим сервис, а аккуратно деградируем
            return AiRiskAnalyzer._heuristic(diff_text, f"ошибка внешнего LLM: {e}")

    @staticmethod
    async def answer_question(document_text: str, question: str, chat_history: List[dict] = None, analysis_context: str = None) -> str:
        """
        Отвечает на вопрос по документу, используя контекст чата и результаты анализа.
        """
        api_key = openrouter_settings.api_key

        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return "Извините, сервис LLM недоступен. Попробуйте позже."

        history_text = ""
        if chat_history:
            for msg in chat_history[-10:]:  # Последние 10 сообщений
                role = "Пользователь" if msg["role"] == "user" else "Ассистент"
                history_text += f"{role}: {msg['content']}\n"

        # Добавляем блок с анализом в промпт, если он есть
        analysis_part = ""
        if analysis_context:
            analysis_part = f"\nРанее ты провел анализ этого документа и сделал следующие выводы:\n{analysis_context}\n"

        prompt = f"""
Ты — Игорь Тикумс, ведущий юрисконсульт в Республике Беларусь.
Отвечай на вопросы пользователя по документу и проведенному тобой анализу рисков.

Документ:
{document_text}
{analysis_part}

История чата:
{history_text}

Вопрос: {question}

Инструкция: Если пользователь спрашивает про риски или твои оценки, опирайся на предоставленный блок анализа.
Ответь кратко и по делу на русском языке.
        """.strip()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": openrouter_settings.http_referer,
            "X-Title": openrouter_settings.title,
        }

        try:
            async with httpx.AsyncClient(timeout=openrouter_settings.timeout_seconds) as client:
                response = await client.post(
                    openrouter_settings.url,
                    headers=headers,
                    json={
                        "model": openrouter_settings.model,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                response.raise_for_status()

                if response.encoding is None:
                    response.encoding = "utf-8"

                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()
        except Exception as e:
            return f"Ошибка при обработке запроса: {e}"