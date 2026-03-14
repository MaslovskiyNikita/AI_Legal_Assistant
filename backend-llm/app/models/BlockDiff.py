from typing import Optional
from pydantic import BaseModel

from .ChangeType import ChangeType
from .DocumentBlock import DocumentBlock

class BlockDiff(BaseModel):
    change_type: ChangeType
    old_block: Optional[DocumentBlock] = None
    new_block: Optional[DocumentBlock] = None
    risk: Optional[str] = None
    comment: Optional[str] = None
    violated_law: Optional[str] = None
    diff_html: Optional[str] = None
    analysis_source: Optional[str] = None  # "LLM" | "heuristic"