from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from loguru import logger

from app.api.dependencies import get_db
from app.schemas.chat import ChatCreateRequest, ChatListResponse, ChatDetailResponse, DocumentResponse, MessageStreamRequest
from app.services import chat_service
from app.services.llm_service import generate_ai_response

router = APIRouter(prefix="/api/v1/chats", tags=["Chats"])

@router.post("/", response_model=ChatListResponse)
async def create_new_chat(request: ChatCreateRequest, db: AsyncSession = Depends(get_db)):
    logger.info(f"🆕 Создание нового чата для User ID={request.user_id}")
    chat = await chat_service.create_chat(db, request)
    logger.success(f"✅ Чат создан: ID={chat.id}")
    return chat

@router.delete("/{chat_id}")
async def delete_user_chat(chat_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"🗑️ Удаление чата ID={chat_id}")
    success = await chat_service.delete_chat(db, chat_id)
    if not success:
        logger.warning(f"⚠️ Чат ID={chat_id} не найден для удаления")
        raise HTTPException(status_code=404, detail="Чат не найден")
    logger.success(f"🆗 Чат ID={chat_id} успешно удален")
    return {"status": "success", "message": "Чат успешно удален"}

@router.delete("/")
async def delete_all_user_chats(user_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"💥 Удаление ВСЕХ чатов для User ID={user_id}")
    await chat_service.delete_all_chats_for_user(db, user_id)
    logger.success(f"🧹 Все чаты пользователя ID={user_id} удалены")
    return {"status": "success", "message": "Все чаты пользователя успешно удалены"}

@router.get("/", response_model=List[ChatListResponse])
async def get_user_chats(user_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"📂 Запрос списка чатов для User ID={user_id}")
    chats = await chat_service.get_user_chats(db, user_id)
    logger.info(f"📊 Найдено чатов: {len(chats)}")
    return chats

@router.get("/{chat_id}", response_model=ChatDetailResponse)
async def get_chat_history(chat_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"📜 Запрос истории чата ID={chat_id}")
    chat = await chat_service.get_chat_with_messages(db, chat_id)
    if not chat:
        logger.warning(f"⚠️ Чат ID={chat_id} не найден")
        raise HTTPException(status_code=404, detail="Чат не найден")
    return chat

@router.post("/{chat_id}/messages/stream")
async def stream_chat_message(
    chat_id: int, 
    request: MessageStreamRequest, 
    db: AsyncSession = Depends(get_db)
):
    preview = (request.text[:50] + '...') if len(request.text) > 50 else request.text
    logger.info(f"💬 Сообщение в чат ID={chat_id}: '{preview}'")

    await chat_service.add_message_to_chat(request, chat_id, db)

    logger.info(f"🤖 Запуск генерации AI ответа для чата ID={chat_id}")
    response_data = await generate_ai_response(
        db=db, 
        chat_id=chat_id, 
        user_text=request.text, 
        comparison_message_id=request.comparison_id 
    )
    
    logger.success(f"✨ AI ответ сформирован для чата ID={chat_id}")
    return response_data
    
@router.get("/{chat_id}/documents", response_model=List[DocumentResponse])
async def get_chat_documents(chat_id: int, db: AsyncSession = Depends(get_db)):  
    logger.info(f"📎 Запрос документов для чата ID={chat_id}")
    documents = await chat_service.get_chat_documents(db, chat_id)
    logger.info(f"📑 Найдено документов в чате: {len(documents)}")
    return documents

@router.get("/{user_id}/all_documents", response_model=List[DocumentResponse])
async def get_user_documents(user_id: int, db: AsyncSession = Depends(get_db)): 
    logger.info(f"🗄️ Запрос всех документов User ID={user_id}")
    documents = await chat_service.get_user_documents(db, user_id)
    logger.info(f"📚 Всего документов пользователя: {len(documents)}")
    return documents