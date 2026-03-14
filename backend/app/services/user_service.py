from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.user import User
from app.schemas.user import UserAuthRequest, UserSettingsUpdateRequest

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

async def update_user_settings(session: AsyncSession, user_id: int, settings: UserSettingsUpdateRequest) -> User | None:
    update_data = settings.model_dump(exclude_unset=True)
    
    if not update_data:
        return await session.get(User, user_id)
    
    query = update(User).where(User.id == user_id).values(**update_data).returning(User)
    result = await session.execute(query)
    await session.commit()
    
    return result.scalar_one_or_none()