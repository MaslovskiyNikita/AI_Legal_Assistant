from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.api.dependencies import get_db
from app.services.statistic_service import get_risk_statistic, user_activity_on_seven_days, top_laws


router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/risks")
async def get_risk_statistics(user_id: int, db: AsyncSession = Depends(get_db)):
    logger.info("📊 Запрос статистики рисков")
    
    risk_stats = await get_risk_statistic(user_id, db)
    
    logger.info(f"📈 Статистика рисков: {risk_stats}")
    return risk_stats

@router.get("/activity")
async def get_activity_statistics(user_id: int, db: AsyncSession = Depends(get_db)):
    logger.info("📊 Запрос статистики активности пользователя")
    
    activity_stats = await user_activity_on_seven_days(user_id, db)
    
    logger.info(f"📈 Статистика активности: {activity_stats}")
    return activity_stats

@router.get("/laws")
async def get_law_statistics(user_id: int, db: AsyncSession = Depends(get_db)):
    logger.info("📊 Запрос статистики упоминаний законов")
    
    law_stats = await top_laws(user_id, db)
    
    logger.info(f"📈 Статистика законов: {law_stats}")
    return law_stats