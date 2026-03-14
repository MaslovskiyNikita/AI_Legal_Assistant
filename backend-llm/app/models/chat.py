from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str  # "user" or "assistant"
    text: str
    timestamp: Optional[datetime] = None

class Chat(BaseModel):
    id: int
    document_text: str
    analysis_results: Optional[str] = None  # Добавляем поле для результатов анализа
    messages: List[Message] = []