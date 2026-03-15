from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.dependencies import get_db
from app.schemas.chat import ChatCreateRequest, ChatListResponse, ChatDetailResponse, DocumentResponse, MessageStreamRequest
from app.services import chat_service
from app.services.llm_service import fake_llm_stream_generator

router = APIRouter(prefix="/api/v1/chats", tags=["Chats"])

@router.post("/", response_model=ChatListResponse)
async def create_new_chat(request: ChatCreateRequest, db: AsyncSession = Depends(get_db)):
    chat = await chat_service.create_chat(db, request)
    return chat

@router.delete("/{chat_id}")
async def delete_user_chat(chat_id: int, db: AsyncSession = Depends(get_db)):
    success = await chat_service.delete_chat(db, chat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return {"status": "success", "message": "Чат успешно удален"}

@router.delete("/")
async def delete_all_user_chats(user_id: int, db: AsyncSession = Depends(get_db)):
    await chat_service.delete_all_chats_for_user(db, user_id)
    return {"status": "success", "message": "Все чаты пользователя успешно удалены"}

@router.get("/", response_model=List[ChatListResponse])
async def get_user_chats(user_id: int, db: AsyncSession = Depends(get_db)):
    chats = await chat_service.get_user_chats(db, user_id)
    return chats

@router.get("/{chat_id}", response_model=ChatDetailResponse)
async def get_chat_history(chat_id: int, db: AsyncSession = Depends(get_db)):
    chat = await chat_service.get_chat_with_messages(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return chat

@router.post("/{chat_id}/messages/stream")
async def stream_chat_message(
    chat_id: int, 
    request: MessageStreamRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    Принимает текст пользователя и ID документов (если есть).
    Возвращает потоковый ответ от ИИ (Server-Sent Events).
    """

    message = await chat_service.add_message_to_chat(request, chat_id, db)

    has_docs = request.comparison_id is not None

    return StreamingResponse(
        fake_llm_stream_generator(db, chat_id, request.text, has_docs),
        media_type="text/event-stream"
    )
    
    
@router.get("/{chat_id}/documents", response_model=List[DocumentResponse])
async def get_chat_documents(chat_id: int, db: AsyncSession = Depends(get_db)):  
    documents = await chat_service.get_chat_documents(db, chat_id)
    return documents


@router.get("/{user_id}/all_documents", response_model=List[DocumentResponse])
async def get_user_documents(user_id: int, db: AsyncSession = Depends(get_db)): 
    documents = await chat_service.get_user_documents(db, user_id)
    return documents


