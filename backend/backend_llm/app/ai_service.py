import json
import re
from typing import List, Optional, Dict
import asyncio
import httpx

from backend_llm.app.settings import settings
from backend_llm.app.models import FullDocumentAnalysis, RiskLevel, ChangeAnalysis, BlockDiff, ChangeType
from backend_llm.app.models.AssistantTone import AssistantTone
from backend_llm.app.rag_service import rag_service
from backend_llm.app.prompts import LegalPrompts 

class AiRiskAnalyzer:
    """
    Анализ рисков с использованием внешнего LLM (Gemini) и поддержкой разных тонов ассистента.
    """

    @staticmethod
    def _heuristic(diff_text: str, fallback_reason: str | None = None) -> FullDocumentAnalysis:
        lowered_diff = diff_text.lower()
        red_markers = ["отказ", "расторжение", "прекращение", "ответственность", "штраф", "неустойка"]
        
        risk = RiskLevel.YELLOW
        if any(m in lowered_diff for m in red_markers):
            risk = RiskLevel.RED
        elif len(diff_text) < 200:
            risk = RiskLevel.GREEN

        return FullDocumentAnalysis(
            overall_risk=risk,
            summary=f"Эвристическая оценка (Фолбэк: {fallback_reason or 'неизвестно'})",
            details=[]
        )

    @staticmethod
    async def _process_batch(batch: List[BlockDiff], api_key: str, tone: AssistantTone) -> List[ChangeAnalysis]:
        query_parts = []
        batch_text_for_prompt = []
        
        for idx, b in enumerate(batch):
            old_t = b.old_block.text if b.old_block else ""
            new_t = b.new_block.text if b.new_block else ""
            if b.change_type == ChangeType.MODIFIED:
                query_parts.append(new_t)
                batch_text_for_prompt.append(f"Блок {idx+1} [ИЗМЕНЕНО]:\nСтарый: {old_t}\nНовый: {new_t}")
            elif b.change_type == ChangeType.ADDED:
                query_parts.append(new_t)
                batch_text_for_prompt.append(f"Блок {idx+1} [ДОБАВЛЕНО]:\nНовый: {new_t}")
            elif b.change_type == ChangeType.DELETED:
                query_parts.append(old_t)
                batch_text_for_prompt.append(f"Блок {idx+1} [УДАЛЕНО]:\nСтарый: {old_t}")

        try:
            rag_docs = await rag_service.asearch(" ".join(query_parts))
            rag_context = "\n".join([f"ст. {d.metadata.get('article')} ({d.metadata.get('source')}): {d.page_content}" for d in rag_docs])
        except Exception as e:
            print(f"RAG Error: {e}")
            rag_context = ""

        prompt = LegalPrompts.get_system_prompt(
            diff_text="\n\n".join(batch_text_for_prompt),
            rag_context=rag_context,
            tone=tone,
            blocks_count=len(batch)  # Передаем количество блоков в батче!
        )

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key 
        }

        async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT) as client:
            response = await client.post(
                f"{settings.GEMINI_BASE_URL}/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}",
                headers=headers,
                json={
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "responseMimeType": "application/json", 
                        "temperature": 0.1
                    }
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            content = re.sub(r'```json\s?|\s?```', '', content)
            parsed = json.loads(content)
            return [ChangeAnalysis.model_validate(item) for item in parsed.get("details", [])]

    @staticmethod
    async def analyze_changes(diff_blocks: List[BlockDiff], tone: AssistantTone = AssistantTone.FRIENDLY) -> FullDocumentAnalysis:
        api_key = settings.GEMINI_API_KEY
        meaningful_diffs = [b for b in diff_blocks if b.change_type != ChangeType.UNCHANGED]
        
        if not meaningful_diffs:
            return FullDocumentAnalysis(overall_risk=RiskLevel.GREEN, summary="Изменений не найдено.", details=[])
            
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return AiRiskAnalyzer._heuristic("API KEY MISSING")

        batch_size = 3
        batches = [meaningful_diffs[i:i + batch_size] for i in range(0, len(meaningful_diffs), batch_size)]
        
        tasks = [AiRiskAnalyzer._process_batch(batch, api_key, tone) for batch in batches]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_details = []
        for res in results:
            if not isinstance(res, Exception):
                all_details.extend(res)
            else:
                print(f"Batch error: {res}")
            
        red_count = sum(1 for d in all_details if d.risk == RiskLevel.RED)
        yellow_count = sum(1 for d in all_details if d.risk == RiskLevel.YELLOW)
        
        overall_risk = RiskLevel.RED if red_count > 0 else (RiskLevel.YELLOW if yellow_count > 0 else RiskLevel.GREEN)
        summary = f"Анализ завершен. Найдено рисков — Высоких: {red_count}, Средних: {yellow_count}."
        
        return FullDocumentAnalysis(overall_risk=overall_risk, summary=summary, details=all_details)

    @staticmethod
    def format_chat_history(chat_data) -> str:
        """
        Обрабатывает историю чата. Поддерживает как список сообщений,
        так и полный словарь чата (с ключом 'messages').
        """
        # 1. Извлекаем список сообщений, если передан весь объект чата
        if isinstance(chat_data, dict) and "messages" in chat_data:
            messages_list = chat_data["messages"]
        elif isinstance(chat_data, list):
            messages_list = chat_data
        else:
            messages_list = []

        formatted_messages = []

        # Берем последние 6 сообщений для экономии контекста
        for m in messages_list[-6:]:
            role = "Пользователь" if m.get("role") == "user" else "Ассистент"
            message_text = m.get("text", "")

            # 2. Прикрепляем информацию о документах пользователя
            documents = m.get("documents", [])
            if documents:
                doc_names = [doc.get("filename") for doc in documents if doc.get("filename")]
                if doc_names:
                    message_text += f"\n\n[Прикрепленные документы: {', '.join(doc_names)}]"

            # 3. Распаковываем аналитику от ИИ
            ai_data = m.get("ai_data")
            if ai_data:
                analysis = ai_data.get("analysis", {})
                diff_blocks = ai_data.get("diff_blocks", [])

                if analysis or diff_blocks:
                    message_text += "\n\n*** ДЕТАЛИ АНАЛИЗА ДОКУМЕНТОВ ***"

                # Блок 3.1: Общее резюме анализа
                if analysis:
                    overall_risk = analysis.get("overall_risk", "UNKNOWN")
                    summary = analysis.get("summary", "")
                    message_text += f"\nОбщий уровень риска: {overall_risk}"
                    message_text += f"\nРезюме: {summary}"

                    details = analysis.get("details", [])
                    if details:
                        message_text += "\n\nВЫЯВЛЕННЫЕ РИСКИ:"
                        for detail in details:
                            risk_level = detail.get("risk", "UNKNOWN")
                            title = detail.get("title", "Без названия")
                            explanation = detail.get("explanation", "")
                            violated_law = detail.get("violated_law")

                            law_info = f" (Связанный закон/статья: {violated_law})" if violated_law else ""
                            message_text += f"\n- [{risk_level}] {title}: {explanation}{law_info}"

                # Блок 3.2: Конкретные изменения текста
                if diff_blocks:
                    message_text += "\n\nИЗМЕНЕННЫЕ БЛОКИ ТЕКСТА:"
                    for diff in diff_blocks:
                        change_type = diff.get("change_type", "UNKNOWN")
                        risk = diff.get("risk", "UNKNOWN")
                        comment = diff.get("comment", "")

                        old_block = diff.get("old_block") or {}
                        new_block = diff.get("new_block") or {}

                        old_text = old_block.get("text", "---")
                        new_text = new_block.get("text", "---")

                        message_text += f"\n* Тип: {change_type} | Риск: {risk} | Комментарий AI: {comment}"
                        message_text += f"\n  Было: {old_text}"
                        message_text += f"\n  Стало: {new_text}"

            formatted_messages.append(f"{role}:\n{message_text}")

        return "\n\n---\n\n".join(formatted_messages)

    @staticmethod
    async def answer_question(
            question: str,
            chat_history: dict | list,
            tone: AssistantTone = AssistantTone.FRIENDLY
    ) -> str:
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return "Ошибка конфигурации API."

        rag_context = ""
        try:
            rag_docs = await rag_service.asearch(question)
            if rag_docs:
                rag_parts = [f"- {d.metadata.get('source')}, ст. {d.metadata.get('article')}: {d.page_content}" for d in
                             rag_docs]
                rag_context = "\n\n".join(rag_parts)
        except Exception as e:
            print(f"RAG Chat Error: {e}")

        # Теперь форматтер правильно съест словарь с ключом 'messages'
        history_text = AiRiskAnalyzer.format_chat_history(chat_history)

        system_prompt = LegalPrompts.get_chat_prompt(
            question=question,
            history=history_text or "Начало диалога",
            rag_context=rag_context,
            tone=tone
        )

        print(f"System Prompt:\n{system_prompt}")

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }

        try:
            async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT) as client:
                response = await client.post(
                    f"{settings.GEMINI_BASE_URL}/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}",
                    headers=headers,
                    json={
                        "systemInstruction": {"parts": [{"text": system_prompt}]},
                        "contents": [{"role": "user", "parts": [{"text": f"Вопрос: {question}"}]}],
                        "generationConfig": {"temperature": 0.2}
                    },
                )
                response.raise_for_status()
                return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            return f"Ошибка AI: {str(e)}"