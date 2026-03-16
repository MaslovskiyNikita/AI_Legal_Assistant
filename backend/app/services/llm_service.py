import asyncio
import json
from app.models.chat import Message
from app.core.database import AsyncSession
from sqlalchemy import select
from app.models.document import Document
from backend_llm.app.document_service import DocumentComparisonManager
import aiofiles

async def fake_llm_stream_generator(
    db: AsyncSession, 
    chat_id: int, 
    user_text: str, 
    comparison_message_id: int = None,
):
    full_ai_response = ""

    if comparison_message_id:
        # 1. Ищем файлы в БД
        result = await db.execute(select(Document).where(Document.message_id == comparison_message_id))
        docs = result.scalars().all()
        
        if len(docs) == 2:
            async with aiofiles.open(docs[0].file_path, 'rb') as f1:
                old_bytes = await f1.read()
            async with aiofiles.open(docs[1].file_path, 'rb') as f2:
                new_bytes = await f2.read()

            try:
                analysis_data = await DocumentComparisonManager.compare_and_analyze(
                    old_file_content=old_bytes,
                    new_file_content=new_bytes
                )

                diff_blocks = analysis_data.get("diff_blocks", [])
                if diff_blocks:
                    yield f"data: {json.dumps({'diff_blocks': diff_blocks}, ensure_ascii=False)}\n\n"

                ai_analysis = analysis_data.get("analysis", {})
                risk = ai_analysis.get("overall_risk", "UNKNOWN")
                summary = ai_analysis.get("summary", "Анализ завершен, но текст не получен.")
                
                full_ai_response = f"**Уровень риска: {risk}**\n\n{summary}"
                
            except Exception as e:
                full_ai_response = f"Произошла ошибка при анализе документов: {str(e)}"
        else:
            full_ai_response = "Ошибка: не удалось найти оба документа на сервере."
    else:
        full_ai_response = "Пожалуйста, прикрепите старую и новую версию документа для сравнения."

    words = full_ai_response.split()
    for word in words:
        await asyncio.sleep(0.05)
        chunk = word + " "
        yield f"data: {json.dumps({'chunk': chunk}, ensure_ascii=False)}\n\n"
        
    yield f"data: {json.dumps({'done': True}, ensure_ascii=False)}\n\n"

    ai_message = Message(chat_id=chat_id, role="ai", text=full_ai_response.strip())
    db.add(ai_message)
    await db.commit()