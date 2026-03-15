from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from sqlalchemy.orm import selectinload
from app.models.chat import Chat, Message
from app.schemas.chat import ChatCreateRequest
from app.models.user import User
from app.models.document import Document

async def create_chat(session: AsyncSession, chat_data: ChatCreateRequest) -> Chat:

    new_chat = Chat(
        user_id=chat_data.user_id, 
        title=chat_data.title
    )
    session.add(new_chat)
    await session.execute(update(User).where(User.id == chat_data.user_id).values(consultations_count=User.consultations_count + 1))
    await session.commit()
    await session.refresh(new_chat)
    return new_chat

async def get_user_chats(session: AsyncSession, user_id: int) -> list[Chat]:

    query = (
        select(Chat)
        .where(Chat.user_id == user_id)
        .order_by(desc(Chat.updated_at))
    )
    result = await session.execute(query)
    return list(result.scalars().all())

async def get_chat_with_messages(session: AsyncSession, chat_id: int) -> Chat | None:

    query = (
        select(Chat)
        .where(Chat.id == chat_id)
        .options(selectinload(Chat.messages).selectinload(Message.documents)) 
    )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_chat_documents(session: AsyncSession, chat_id: int) -> list:
    query = (
        select(Message)
        .where(Message.chat_id == chat_id)
        .options(selectinload(Message.documents))
    )
    result = await session.execute(query)
    messages = result.scalars().all()
    
    documents = []
    for msg in messages:
        documents.extend(msg.documents)
    
    return documents

async def get_user_documents(session: AsyncSession, user_id: int) -> list:
    query = (select(Document).where(Document.user_id == user_id))
    result = await session.execute(query)
    return result.scalars().all()

async def add_message_to_chat(request, chat_id: int, session) -> Message:
    user_message = Message(chat_id=chat_id, role="user", text=request.text)
    session.add(user_message)
    await session.commit()
    
async def delete_chat(session: AsyncSession, chat_id: int) -> bool:

    chat = await session.get(Chat, chat_id)
    
    if not chat:
        return False
        
    await session.delete(chat)
    await session.commit()
    
    return True

async def delete_all_chats_for_user(session: AsyncSession, user_id: int) -> None:
    query = select(Chat).where(Chat.user_id == user_id)
    result = await session.execute(query)
    chats = result.scalars().all()
    
    for chat in chats:
        await session.delete(chat)
    
    await session.commit()
    