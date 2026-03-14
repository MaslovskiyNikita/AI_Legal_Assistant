from typing import Optional
from pydantic import BaseModel
import hashlib

class DocumentBlock(BaseModel):
    index: int
    id: Optional[str]
    text: str
    hash: str

    @staticmethod
    def generate_hash(text: str) -> str:
        return hashlib.md5(text.strip().encode()).hexdigest()