import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_db(session: AsyncSession):

    result = await session.execute(select(User).where(User.telegram_id == 123456789))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        logger.info("Тестовые данные уже есть в БД. Пропускаем заполнение.")
        return

    logger.info("База пустая. Начинаем заполнение тестовыми данными...")

    mock_user = User(
        telegram_id=123456789,
        username="Nikita",
        first_name="Nikita",
        last_name="Maslovskiy",
        photo_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
        documents_analyzed=14,
        consultations_count=88
    )
    
    session.add(mock_user)
    await session.commit()
    
    logger.info("Тестовые данные успешно добавлены в БД!")