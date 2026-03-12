from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MessageBase(BaseModel):
    role: str # "user" или "ai"
    text: str

class MessageResponse(MessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatListResponse(BaseModel):
    id: int
    title: str
    updated_at: datetime


    class Config:
        from_attributes = True

class ChatCreateRequest(BaseModel):
    user_id: int
    title: Optional[str] = "Новый диалог"

class ChatDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[MessageResponse] = [] 

    class Config:
        from_attributes = True
        

class MessageStreamRequest(BaseModel):
    text: str
    comparison_id: Optional[int] = None # ID загруженных документов (если есть)