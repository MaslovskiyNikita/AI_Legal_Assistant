from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserAuthRequest(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None

class UserAuthResponse(BaseModel):
    user_id: int
    is_new_user: bool

class UserProfileResponse(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    documents_analyzed: int
    consultations_count: int
    
    theme: str
    notifications_enabled: bool

    class Config:
        from_attributes = True  
        
class UserSettingsUpdateRequest(BaseModel):
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None