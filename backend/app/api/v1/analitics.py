from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from backend.app.api.dependencies import get_db


router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/risks")
async def get_risk_statistics(user_id: int, db: AsyncSession = Depends(get_db)):
    logger.info("📊 Запрос статистики рисков")
    
    risk_stats = await get_risk_statistics(db, user_id)
    
    logger.info(f"📈 Статистика рисков: {risk_stats}")
    return risk_stats