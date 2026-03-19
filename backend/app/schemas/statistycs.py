from pydantic import BaseModel
from typing import Any, List, Optional
from datetime import datetime
from pydantic import BaseModel


class RiskStatisticResponse(BaseModel):
    risk_type: str
    count: int
    
class ActivityStatisticResponse(BaseModel):
    date: str
    message_count: int
    
class LawStatisticResponse(BaseModel):
    law_name: str
    count: int
