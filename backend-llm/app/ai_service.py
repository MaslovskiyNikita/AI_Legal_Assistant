import json
import re

import httpx

from .settings import openrouter_settings


class AiRiskAnalyzer:
    """
    Анализ изменений: сначала пробуем внешний LLM (OpenRouter),
    при любой ошибке — возвращаем вменяемый ответ локальной эвристикой.
    """

    @staticmethod
    def _heuristic(old_text: str | None, new_text: str | None, fallback_reason: str | None = None) -> dict:
        old_t = old_text or ""
        new_t = new_text or ""
        delta_len = abs(len(new_t) - len(old_t))

        lowered_old = old_t.lower()
        lowered_new = new_t.lower()

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

        risk = "YELLOW"

        if any(m in lowered_new for m in red_markers) and not any(m in lowered_old for m in red_markers):
            risk = "RED"
        elif any(m in lowered_new for m in green_markers) and delta_len < 50:
            risk = "GREEN"
        elif delta_len < 20:
            risk = "GREEN"

        base_expl = (
            "Эвристическая оценка без полноценного ответа внешнего LLM: "
            "учитывается масштаб текстовых изменений и наличие типичных триггеров риска "
            "(отказы, расторжение, ответственность и т.п.)."
        )
        if fallback_reason:
            base_expl += f" (фолбэк по причине: {fallback_reason})"

        return {
            "risk": risk,
            "explanation": base_expl,
            "violated_law": None,
            "source": "heuristic",
        }

    @staticmethod
    async def analyze(old_text: str | None, new_text: str | None) -> dict:
        api_key = openrouter_settings.api_key

        # Если ключа нет — сразу идём по эвристике, чтобы не падать
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return AiRiskAnalyzer._heuristic(old_text, new_text, "отсутствует OPENROUTER_API_KEY")

        prompt = f"""
Ты — Игорь Тикумс, ведущий юрисконсульт в Республике Беларусь, эксперт по нормотворческой технике.
Твоя задача: провести правовую экспертизу изменений в локальном нормативном акте (ЛНА).

Иерархия нормативных правовых актов (НПА) РБ для проверки (от высшего к низшему):
1. Конституция Республики Беларусь.
2. Решения республиканских референдумов.
3. Законы РБ.
4. Декреты, указы Президента РБ.
5. Постановления Совета Министров РБ.
6. НПА министерств, иных органов госуправления.
7. Технические НПА.

Контекст изменений:
Старая редакция: "{old_text or "[отсутствует]"}"
Новая редакция: "{new_text or "[добавлено впервые]"}"

Инструкция по оценке рисков:
- GREEN: Технические правки (пунктуация, реквизиты), не меняющие правовой статус сторон.
- YELLOW: Изменение диспозиции (сроки, суммы, процедуры), требующее сверки с бизнес-процессами.
- RED: Прямое противоречие вышестоящим НПА (см. иерархию), замена прав (имеет право) на обязанности (обязан), исключение ответственности нанимателя, нарушение ТК РБ.

Твой ответ должен быть СТРОГО В ФОРМАТЕ JSON:
{{
  "risk": "GREEN" | "YELLOW" | "RED",
  "explanation": "Краткое юридическое обоснование на русском языке",
  "violated_law": "Название и статья НПА из иерархии, если есть противоречие, иначе null
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
                    },
                )
                response.raise_for_status()

                # Явно фиксируем кодировку на UTF-8, чтобы не словить ascii‑ошибки
                if response.encoding is None:
                    response.encoding = "utf-8"

                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # Убираем ```json ... ``` если модель так вернула
                clean_json = re.sub(r"```json\s*|```", "", content).strip()
                parsed = json.loads(clean_json)

                return {
                    "risk": parsed.get("risk", "YELLOW"),
                    "explanation": parsed.get("explanation", "Нет детального объяснения от LLM."),
                    "violated_law": parsed.get("violated_law"),
                    "source": "LLM",
                }
        except Exception as e:
            # Любая ошибка сети / парсинга — не валим сервис, а аккуратно деградируем
            return AiRiskAnalyzer._heuristic(old_text, new_text, f"ошибка внешнего LLM: {e}")