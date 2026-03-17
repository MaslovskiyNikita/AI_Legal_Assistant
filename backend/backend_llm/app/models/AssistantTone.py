from enum import Enum

class AssistantTone(str, Enum):
    STRICT = "strict"
    FRIENDLY = "friendly"
    NEUTRAL = "neutral"