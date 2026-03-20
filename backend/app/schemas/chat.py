from pydantic import BaseModel
from typing import Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, computed_field

class MessageBase(BaseModel):
    role: str # "user" или "ai"
    text: str

class DocumentResponse(BaseModel):
    id: int
    filename: str

    @computed_field
    def download_url(self) -> str:
        return f"/api/v1/documents/{self.id}/download"

    class Config:
        from_attributes = True
    
class MessageResponse(MessageBase):
    id: int
    created_at: datetime
    documents: List[DocumentResponse] = []
    ai_data: Optional[dict] = None

    class Config:
        from_attributes = True

from backend_llm.app.models.AssistantTone import AssistantTone

class ChatListResponse(BaseModel):
    id: int
    title: str
    tone: AssistantTone = AssistantTone.FRIENDLY
    updated_at: datetime


    class Config:
        from_attributes = True

class ChatCreateRequest(BaseModel):
    user_id: int
    title: Optional[str] = "Новый диалог"
    tone: Optional[AssistantTone] = AssistantTone.FRIENDLY

class ChatDetailResponse(BaseModel):
    id: int
    title: str
    tone: AssistantTone = AssistantTone.FRIENDLY
    created_at: datetime
    messages: List[MessageResponse] = [] 

    class Config:
        from_attributes = True
        

class MessageStreamRequest(BaseModel):
    text: str
    comparison_id: Optional[int] = None # ID загруженных документов (если есть)
    
        
