from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.chat import Chat 


async def check_positive_balance(
    chat_id: int, 
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(select(Chat.user_id).where(Chat.id == chat_id))
    user_id = result.scalars().first()
    
    if not user_id:
        raise HTTPException(status_code=404, detail="Чат не найден")

    user_result = await db.execute(select(User.token_balance).where(User.id == user_id))
    balance = user_result.scalars().first()
    
    if balance is None or balance <= 0:
        raise HTTPException(status_code=403, detail="Недостаточно токенов")
        
    return balance