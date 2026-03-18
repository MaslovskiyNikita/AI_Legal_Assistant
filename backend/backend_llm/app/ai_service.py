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

        prompt = LegalPrompts.get_system_prompt("\n\n".join(batch_text_for_prompt), rag_context, tone)

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
    async def analyze_changes(diff_blocks: List[BlockDiff], tone: AssistantTone = AssistantTone.STRICT) -> FullDocumentAnalysis:
        api_key = settings.GEMINI_API_KEY
        meaningful_diffs = [b for b in diff_blocks if b.change_type != ChangeType.UNCHANGED]
        
        if not meaningful_diffs:
            return FullDocumentAnalysis(overall_risk=RiskLevel.GREEN, summary="Изменений не найдено.", details=[])
            
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return AiRiskAnalyzer._heuristic("API KEY MISSING")

        batch_size = 5
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
    async def answer_question(
            question: str,
            chat_history: List[Dict[str, str]],
            document_text: Optional[str] = None,
            analysis_summary: Optional[str] = None,
            tone: AssistantTone = AssistantTone.STRICT
    ) -> str:
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return "Ошибка конфигурации API."

        rag_context = ""
        try:
            rag_docs = await rag_service.asearch(question)
            if rag_docs:
                rag_parts = [f"- {d.metadata.get('source')}, ст. {d.metadata.get('article')}: {d.page_content}" for d in rag_docs]
                rag_context = "\n\n".join(rag_parts)
        except Exception as e:
            print(f"RAG Chat Error: {e}")

        history_text = "\n".join([f"{'Пользователь' if m['role']=='user' else 'Ассистент'}: {m['text']}" for m in chat_history[-6:]])

        system_prompt = LegalPrompts.get_chat_prompt(
            question=question,
            history=history_text or "Начало диалога",
            doc_text=document_text,
            rag_context=rag_context,
            analysis_summary=analysis_summary,
            tone=tone
        )

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