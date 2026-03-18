from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.api.dependencies import get_db
from app.schemas.user import UserAuthRequest, UserAuthResponse, UserProfileResponse, UserSettingsUpdateRequest
from app.services import user_service

router = APIRouter(prefix="/api/v1", tags=["Users & Auth"])

@router.post("/auth", response_model=UserAuthResponse)
async def login_or_register(request: UserAuthRequest, db: AsyncSession = Depends(get_db)):
    logger.info(f"🚀 Попытка входа/регистрации: TG_ID={request.telegram_id}, Username={request.username}")
    
    user, is_new = await user_service.authenticate_user(db, request)
    
    status = "зарегистрирован" if is_new else "вошел в систему"
    logger.success(f"✅ Пользователь ID={user.id} успешно {status}")
    
    return UserAuthResponse(user_id=user.id, is_new_user=is_new)


@router.get("/users/{telegram_id}", response_model=UserProfileResponse)
async def get_profile(telegram_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"🔍 Запрос профиля для TG_ID: {telegram_id}")
    
    user = await user_service.get_user_by_telegram_id(db, telegram_id)
    if not user:
        logger.warning(f"⚠️ Пользователь с TG_ID {telegram_id} не найден в базе")
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    logger.success(f"👤 Профиль пользователя ID={user.id} успешно получен")
    return user


@router.patch("/users/{user_id}/settings", response_model=UserProfileResponse)
async def update_settings(user_id: int, settings: UserSettingsUpdateRequest, db: AsyncSession = Depends(get_db)):
    update_data = settings.model_dump(exclude_unset=True)
    logger.info(f"⚙️ Обновление настроек пользователя ID={user_id}: {update_data}")
    
    updated_user = await user_service.update_user_settings(db, user_id, settings)
    if not updated_user:
        logger.error(f"❌ Ошибка обновления: Пользователь ID={user_id} не существует")
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    logger.success(f"✨ Настройки пользователя ID={user_id} успешно обновлены")
    return updated_user