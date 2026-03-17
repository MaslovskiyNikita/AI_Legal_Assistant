from typing import Dict, List, Optional
from .models import Chat, Message
from datetime import datetime

class ChatService:
    _chats: Dict[int, Chat] = {}
    _next_id: int = 1

    @staticmethod
    def create_chat(document_text: str, analysis_results: Optional[str] = None) -> Chat:
        chat = Chat(
            id=ChatService._next_id,
            document_text=document_text,
            analysis_results=analysis_results,
            messages=[]
        )
        ChatService._chats[ChatService._next_id] = chat
        ChatService._next_id += 1
        return chat

    @staticmethod
    def get_chat(chat_id: int) -> Optional[Chat]:
        return ChatService._chats.get(chat_id)
 
    @staticmethod
    def add_message(chat_id: int, role: str, text: str) -> bool:
        chat = ChatService._chats.get(chat_id)
        if not chat:
            return False
        message = Message(role=role, text=text, timestamp=datetime.now())
        chat.messages.append(message)
        return True

    @staticmethod
    def get_messages(chat_id: int) -> Optional[List[Message]]:
        chat = ChatService._chats.get(chat_id)
        return chat.messages if chat else None