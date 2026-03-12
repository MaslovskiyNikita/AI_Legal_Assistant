import asyncio
import json
from app.models.chat import Message
from app.core.database import AsyncSession

async def fake_llm_stream_generator(
    db: AsyncSession, 
    chat_id: int, 
    user_text: str, 
    has_documents: bool
):
    """
    Асинхронный генератор, имитирующий стриминг ответа от ИИ.
    Формат ответа: Server-Sent Events (SSE).
    """
    if has_documents:
        response_text = "Я проанализировал оба документа. Главное отличие: в новом законе штраф за нарушение увеличен с 10 до 50 тысяч рублей, а также добавлен пункт об обязательной сертификации. Что-то еще подсказать?"
    else:
        response_text = f"Вы написали: '{user_text}'. Пожалуйста, прикрепите старую и новую версию документа для сравнения."

    words = response_text.split()

    full_ai_response = ""

    for word in words:
        await asyncio.sleep(0.1)
        
        chunk = word + " "
        full_ai_response += chunk 
        
        yield f"data: {json.dumps({'chunk': chunk}, ensure_ascii=False)}\n\n"
        
    yield f"data: {json.dumps({'done': True})}\n\n"

    ai_message = Message(chat_id=chat_id, role="ai", text=full_ai_response.strip())
    db.add(ai_message)
    await db.commit()