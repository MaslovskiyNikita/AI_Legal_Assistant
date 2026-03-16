from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class RiskLevel(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"

class ChangeAnalysis(BaseModel):
    title: str = Field(description="Краткое название измененного пункта")
    risk: RiskLevel
    explanation: str = Field(description="Юридическое обоснование риска")
    violated_law: Optional[str] = Field(None, description="Ссылка на статью НПА РБ")

class FullDocumentAnalysis(BaseModel):
    overall_risk: RiskLevel
    summary: str = Field(description="Общее резюме по всем изменениям")
    details: List[ChangeAnalysis] = Field(description="Список детальных разборов каждого важного изменения")