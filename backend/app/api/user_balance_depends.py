from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User 

async def check_positive_balance(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(select(User.token_balance).where(User.id == user_id))
    balance = result.scalars().first()

    if balance is None or balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно токенов на балансе. Пожалуйста, пополните счет."
        )
    return balance