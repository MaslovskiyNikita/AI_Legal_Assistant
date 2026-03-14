from enum import Enum

class ChangeType(str, Enum):
    UNCHANGED = "UNCHANGED"
    ADDED = "ADDED"
    DELETED = "DELETED"
    MODIFIED = "MODIFIED"
