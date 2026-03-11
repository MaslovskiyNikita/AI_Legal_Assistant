from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session