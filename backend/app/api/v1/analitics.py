from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.api.dependencies import get_db
from app.services.statistic_service import get_risk_statistic


router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/risks")
async def get_risk_statistics(user_id: int, db: AsyncSession = Depends(get_db)):
    logger.info("📊 Запрос статистики рисков")
    
    risk_stats = await get_risk_statistic(user_id, db)
    
    logger.info(f"📈 Статистика рисков: {risk_stats}")
    return risk_stats