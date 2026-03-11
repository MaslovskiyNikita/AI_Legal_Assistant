from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.schemas.user import UserAuthRequest, UserAuthResponse, UserProfileResponse
from app.services import user_service

router = APIRouter(prefix="/api/v1", tags=["Users & Auth"])

@router.post("/auth", response_model=UserAuthResponse)
async def login_or_register(request: UserAuthRequest, db: AsyncSession = Depends(get_db)):
    user, is_new = await user_service.authenticate_user(db, request)
    return UserAuthResponse(user_id=user.id, is_new_user=is_new)


@router.get("/users/{telegram_id}", response_model=UserProfileResponse)
async def get_profile(telegram_id: int, db: AsyncSession = Depends(get_db)):

    user = await user_service.get_user_by_telegram_id(db, telegram_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    return user