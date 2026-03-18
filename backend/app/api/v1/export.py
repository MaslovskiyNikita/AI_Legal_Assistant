from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.api.dependencies import get_db
from app.services import chat_service, export_service

router = APIRouter(prefix="/api/v1/chats", tags=["Export"])

@router.get("/{chat_id}/export/docx")
async def export_chat_to_docx(chat_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"📄 Экспорт чата ID={chat_id} в DOCX")
    
    chat = await chat_service.get_chat_with_messages(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")

    messages_data = []
    for m in chat.messages:
        messages_data.append({
            "role": m.role,
            "text": getattr(m, 'text', getattr(m, 'content', '')),
            "created_at": m.created_at
        })
        
    file_stream = await export_service.generate_docx_stream(messages_data)
    
    return StreamingResponse(
        file_stream, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=chat_{chat_id}.docx"}
    )

@router.get("/{chat_id}/export/pdf")
async def export_chat_to_pdf(chat_id: int, db: AsyncSession = Depends(get_db)):
    chat = await chat_service.get_chat_with_messages(db, chat_id)
    if not chat: raise HTTPException(status_code=404, detail="Чат не найден")
        
    messages_data = [
        {"role": m.role, "text": getattr(m, 'text', getattr(m, 'content', '')), "created_at": m.created_at}
        for m in chat.messages
    ]
    file_stream = await export_service.generate_pdf_stream(messages_data)
    
    return StreamingResponse(
        file_stream, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=chat_{chat_id}.pdf"}
    )