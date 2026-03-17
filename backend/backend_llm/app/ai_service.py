import json
import re
from typing import List, Optional, Dict
import asyncio

import httpx
from pydantic import BaseModel

from backend_llm.app.settings import settings
from backend_llm.app.models import FullDocumentAnalysis, RiskLevel, ChangeAnalysis, BlockDiff, ChangeType

from backend_llm.app.rag_service import rag_service


class AiRiskAnalyzer:
    """
    Анализ изменений: сначала пробуем внешний LLM (Gemini),
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
            rag_docs = await rag_service.asearch(query_text)
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
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY
        }

        gemini_url = f"{settings.GEMINI_BASE_URL}/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"

        async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT) as client:
            response = await client.post(
                gemini_url,
                headers=headers,
                json={
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                },
            )
            response.raise_for_status()

            if response.encoding is None:
                response.encoding = "utf-8"

            data = response.json()
            content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            
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
        api_key = settings.GEMINI_API_KEY
        
        meaningful_diffs = [b for b in diff_blocks if b.change_type != ChangeType.UNCHANGED]
        
        if not meaningful_diffs:
            return FullDocumentAnalysis(overall_risk=RiskLevel.GREEN, summary="Изменений не найдено или они незначительны", details=[])
            
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            diff_text = "\n".join([f"[{b.change_type.value}] {b.new_block.text if b.new_block else b.old_block.text}" for b in meaningful_diffs])
            return AiRiskAnalyzer._heuristic(diff_text, "отсутствует GEMINI_API_KEY")

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
    async def answer_question(
            question: str,
            chat_history: List[Dict[str, str]],
            document_text: Optional[str] = None,
            analysis_summary: Optional[str] = None
    ) -> str:
        """
        Генерирует ответ LLM на основе вопроса пользователя, истории чата,
        полного текста документа и результатов анализа рисков.

        :param question: Текущий вопрос пользователя.
        :param chat_history: История сообщений в формате [{"role": "user", "text": "..."}]
        :param document_text: Полный текст актуального (нового) документа.
        :param analysis_summary: Строка с выводами AI по рискам (если документ проверялся).
        :return: Текст ответа ассистента.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "ВАШ_КЛЮЧ":
            return "Извините, сервис LLM временно недоступен. Проверьте настройки API."

        # ==========================================
        # 1. RAG: Поиск релевантных законов РБ
        # ==========================================
        rag_context = ""
        try:
            rag_docs = await rag_service.asearch(question)
            if rag_docs:
                rag_parts = []
                for doc in rag_docs:
                    article = doc.metadata.get('article', 'Б/Н')
                    source = doc.metadata.get('source', 'Законодательство РБ')
                    rag_parts.append(f"- {source}, Статья {article}:\n{doc.page_content}")
                rag_context = "\n\n".join(rag_parts)
        except Exception as e:
            print(f"Ошибка RAG в чате: {e}")

        # ==========================================
        # 2. Подготовка истории чата (последние 5 сообщений)
        # ==========================================
        history_text = ""
        for msg in chat_history[-8:]:
            role = msg.get("role", "user")
            text = msg.get("text", "")
            role_name = "Пользователь" if role == "user" else "Ассистент (Игорь Тикумс)"
            history_text += f"{role_name}: {text}\n"

        if not history_text:
            history_text = "Это первое сообщение в диалоге."

        # ==========================================
        # 3. Формирование Системного Промпта
        # ==========================================
        system_prompt = f"""Ты — Игорь Тикумс, опытный, строгий и лаконичный юрисконсульт Республики Беларусь.
Твоя задача — отвечать на вопросы пользователя, опираясь на предоставленный документ и законодательство РБ.

--- БАЗА ЗНАНИЙ (Найденные законы) ---
{rag_context if rag_context else "Специфических статей под этот вопрос не найдено. Опирайся на общие нормы права Республики Беларусь."}

--- ТЕКСТ ДОКУМЕНТА ---
{document_text if document_text else "Документ не предоставлен."}

--- РЕЗУЛЬТАТЫ АНАЛИЗА РИСКОВ ПО ЭТОМУ ДОКУМЕНТУ ---
{analysis_summary if analysis_summary else "Анализ рисков не проводился."}

ИНСТРУКЦИЯ (СТРОГО СОБЛЮДАТЬ):
1. Отвечай по существу вопроса. Без лишних вступлений ("Здравствуйте", "Конечно, я помогу").
2. Если в "БАЗЕ ЗНАНИЙ" есть подходящая статья — обязательно ссылайся на неё. Если статьи нет, не выдумывай номера несуществующих законов.
3. Если вопрос касается содержания документа, ищи ответ в блоке "ТЕКСТ ДОКУМЕНТА".
4. Если пользователь спрашивает про выявленные риски или изменения — опирайся на "РЕЗУЛЬТАТЫ АНАЛИЗА РИСКОВ".
5. Если ответ не найден ни в документе, ни в законах, попытайся ответить на вопрос своими мыслями.
"""

        # ==========================================
        # 4. Формирование сообщений для API
        # ==========================================
        contents = [
            {"role": "user", "parts": [{"text": f"Контекст беседы:\n{history_text}\n\nМой вопрос: {question}"}]}
        ]

        headers = { 
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY
        }

        gemini_url = f"{settings.GEMINI_BASE_URL}/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"

        # ==========================================
        # 5. Вызов LLM (Gemini)
        # ==========================================
        try:
            async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT) as client:
                response = await client.post(
                    gemini_url,
                    headers=headers,
                    json={
                        "systemInstruction": {"parts": [{"text": system_prompt}]},
                        "contents": contents,
                        "generationConfig": {
                            "temperature": 0.2
                        }
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            print(f"Ошибка API Gemini: {e}")
            return "Произошла техническая ошибка при обращении к AI-ассистенту. Пожалуйста, попробуйте позже."