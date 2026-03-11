from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserAuthRequest

async def get_user_by_telegram_id(session: AsyncSession, telegram_id: int) -> User | None:

    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()

async def authenticate_user(session: AsyncSession, user_data: UserAuthRequest) -> tuple[User, bool]:

    user = await get_user_by_telegram_id(session, user_data.telegram_id)
    
    if user:
        return user, False  

    new_user = User(
        telegram_id=user_data.telegram_id,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        photo_url=user_data.photo_url
    )
    
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user) 
    
    return new_user, True