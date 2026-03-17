import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.chat import Message
from app.models.document import Document
from app.schemas.chat import ChatDetailResponse

from backend_llm.app.ai_service import AiRiskAnalyzer
from backend_llm.app.document_service import DocumentComparisonManager
from app.services.chat_service import get_chat_with_messages

async def generate_ai_response(
    db: AsyncSession, 
    chat_id: int, 
    user_text: str = "", 
    comparison_message_id: int = None,
) -> dict:

    full_ai_response = ""
    diff_blocks_out = []

    if comparison_message_id:
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

                diff_blocks_out = analysis_data.get("diff_blocks", [])
                
                ai_analysis = analysis_data.get("analysis", {})
                risk = ai_analysis.get("overall_risk", "UNKNOWN")
                summary = ai_analysis.get("summary", "Анализ завершен.")
                
                full_ai_response = f"**Уровень риска: {risk}**\n\n{summary}"
                
            except Exception as e:
                full_ai_response = f"Произошла ошибка при анализе документов: {str(e)}"

        else:
            chat_history_orm = await get_chat_with_messages(db, chat_id)
        
            if chat_history_orm:
                chat_dict = ChatDetailResponse.model_validate(chat_history_orm).model_dump()
                history_for_llm = [
                    {"role": msg["role"], "text": msg["text"]} 
                    for msg in chat_dict.get("messages", [])
                ]

                full_ai_response = await AiRiskAnalyzer.answer_question(
                    question=user_text,
                    chat_history=history_for_llm
                )
            else:
                full_ai_response = "Ошибка: не удалось загрузить историю диалога."

    ai_message = Message(chat_id=chat_id, role="ai", text=full_ai_response.strip())
    db.add(ai_message)
    await db.commit()

    return {
        "text": full_ai_response.strip(),
        "diff_blocks": diff_blocks_out
    }