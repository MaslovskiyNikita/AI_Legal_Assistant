import json
import re
from typing import List
import asyncio

import httpx
from pydantic import BaseModel

from .settings import settings
from .models import FullDocumentAnalysis, RiskLevel, ChangeAnalysis, BlockDiff, ChangeType

from .rag_service import rag_service


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
    async def _process_batch(batch: List[BlockDiff], api_key: str) -> List[ChangeAnalysis]:
        query_parts = []
        batch_text_for_prompt = []
        
        for idx, b in enumerate(batch):
            old_t = b.old_block.text if b.old_block else ""
            new_t = b.new_block.text if b.new_block else ""
            
            if b.change_type == ChangeType.MODIFIED:
                query_parts.append(new_t)
                batch_text_for_prompt.append(f"Блок {idx+1} [ИЗМЕНЕНО]:\nСтарый текст: {old_t}\nНовый текст: {new_t}")
            elif b.change_type == ChangeType.ADDED:
                query_parts.append(new_t)
                batch_text_for_prompt.append(f"Блок {idx+1} [ДОБАВЛЕНО]:\nНовый текст: {new_t}")
            elif b.change_type == ChangeType.DELETED:
                query_parts.append(old_t)
                batch_text_for_prompt.append(f"Блок {idx+1} [УДАЛЕНО]:\nСтарый текст: {old_t}")

        query_text = " ".join(query_parts)
        
        try:
            rag_docs = rag_service.search(query_text)
        except Exception as e:
            print(f"RAG search error: {e}")
            rag_docs = []
            
        rag_context = ""
        for i, doc in enumerate(rag_docs):
            rag_context += f"--- Статья {doc.metadata.get('article')} ({doc.metadata.get('source')}):\n{doc.page_content}\n"
            
        diff_text = "\n\n".join(batch_text_for_prompt)

        prompt = f"""
Ты — строгий и лаконичный юрист-аудитор Республики Беларусь. 
Твоя задача: провести правовой аудит изменений в документе и выявить риски.

БАЗА ЗАКОНОВ (Релевантные статьи для проверки):
{rag_context if rag_context else "Нет релевантных статей в базе."}

БАТЧ ИЗМЕНЕНИЙ (Старый текст -> Новый текст):
{diff_text}

ЖЕСТКИЕ ПРАВИЛА (СЛЕДУЙ ИМ НЕУКОСНИТЕЛЬНО):
1. Оцени риск: GREEN (техническая правка, опечатка), YELLOW (изменение сроков/сумм, требует внимания), RED (прямое противоречие законам, ухудшение прав).
2. Поле "title": Напиши краткую суть (например: "Изменение даты документа", "Удаление пункта", "Смена подписанта"). КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ писать слова "Блок 1", "[ИЗМЕНЕНО]", "[ДОБАВЛЕНО]".
3. Поле "explanation": Напиши СТРОГО 1-2 коротких предложения. Только юридическая суть. Никакой воды и философии про "подрыв доверия граждан".
4. Поле "violated_law": Укажи статью ТОЛЬКО если изменение прямо нарушает статьи из предоставленной БАЗЫ ЗАКОНОВ. Если нарушения базы нет или это просто опечатка/мат/перенос пункта — пиши null. Не выдумывай нарушения Конституции!

Формат ответа СТРОГО JSON:
{{
  "details": [
    {{
      "title": "Срок выплаты зарплаты",
      "risk": "RED",
      "explanation": "Срок увеличен до 45 дней, что нарушает ТК РБ.",
      "violated_law": "ст. 73 ТК РБ"
    }}
  ]
}}
"""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": settings.OPENROUTER_HTTP_REFERER,
            "X-Title": settings.OPENROUTER_TITLE,
        }

        async with httpx.AsyncClient(timeout=settings.OPENROUTER_TIMEOUT) as client:
            response = await client.post(
                settings.OPENROUTER_URL,
                headers=headers,
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                },
            )
            response.raise_for_status()

            if response.encoding is None:
                response.encoding = "utf-8"

            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            # Ищем JSON внутри маркдаун-блока с помощью регулярки
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
            else:
                # Если блоков нет, пробуем найти первый { и последний }
                start_idx = content.find('{')
                end_idx = content.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    content = content[start_idx:end_idx+1]

            parsed = json.loads(content)
            
            results = []
            for item in parsed.get("details", []):
                results.append(ChangeAnalysis.model_validate(item))
            return results

    @staticmethod
    async def analyze_changes(diff_blocks: List[BlockDiff]) -> FullDocumentAnalysis:
        api_key = settings.OPENROUTER_API_KEY
        
        meaningful_diffs = [b for b in diff_blocks if b.change_type != ChangeType.UNCHANGED]
        
        if not meaningful_diffs:
            return FullDocumentAnalysis(overall_risk=RiskLevel.GREEN, summary="Изменений не найдено или они незначительны", details=[])
            
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            diff_text = "\n".join([f"[{b.change_type.value}] {b.new_block.text if b.new_block else b.old_block.text}" for b in meaningful_diffs])
            return AiRiskAnalyzer._heuristic(diff_text, "отсутствует OPENROUTER_API_KEY")

        batch_size = 5
        batches = [meaningful_diffs[i:i + batch_size] for i in range(0, len(meaningful_diffs), batch_size)]
        
        tasks = [AiRiskAnalyzer._process_batch(batch, api_key) for batch in batches]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_details = []
        has_error = False
        error_msg = ""
        
        for res in results:
            if isinstance(res, Exception):
                has_error = True
                error_msg = str(res)
                continue
            all_details.extend(res)
            
        if has_error and not all_details:
             diff_text = "\n".join([f"[{b.change_type.value}] {b.new_block.text if b.new_block else b.old_block.text}" for b in meaningful_diffs])
             return AiRiskAnalyzer._heuristic(diff_text, f"ошибка внешнего LLM: {error_msg}")
             
        overall_risk = RiskLevel.GREEN
        red_count = 0
        yellow_count = 0
        for detail in all_details:
            if detail.risk == RiskLevel.RED:
                overall_risk = RiskLevel.RED
                red_count += 1
            elif detail.risk == RiskLevel.YELLOW:
                yellow_count += 1
                if overall_risk != RiskLevel.RED:
                    overall_risk = RiskLevel.YELLOW
                    
        summary = "Изменения проанализированы."
        if red_count > 0:
            summary = f"Выявлено {red_count} критических рисков (RED). Внимательно проверьте эти пункты."
        elif yellow_count > 0:
            summary = f"Выявлено {yellow_count} изменений, требующих внимания (YELLOW). Критических рисков нет."
        else:
            summary = "Все изменения оценены как безопасные (GREEN)."
        
        return FullDocumentAnalysis(
            overall_risk=overall_risk,
            summary=summary,
            details=all_details
        )

    @staticmethod
    async def answer_question(document_text: str, question: str, chat_history: List[dict] = None, analysis_context: str = None) -> str:
        """
        Отвечает на вопрос по документу, используя контекст чата и результаты анализа.
        """
        api_key = settings.OPENROUTER_API_KEY

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
            "HTTP-Referer": settings.OPENROUTER_HTTP_REFERER,
            "X-Title": settings.OPENROUTER_TITLE,
        }

        try:
            async with httpx.AsyncClient(timeout=settings.OPENROUTER_TIMEOUT) as client:
                response = await client.post(
                    settings.OPENROUTER_URL,
                    headers=headers,
                    json={
                        "model": settings.OPENROUTER_MODEL,
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