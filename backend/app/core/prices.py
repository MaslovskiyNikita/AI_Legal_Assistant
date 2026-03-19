from dataclasses import dataclass
from typing import ClassVar

@dataclass
class PackagePrices:
    pack_100: ClassVar[dict] = {"tokens": 100, "stars": 1}
    pack_500: ClassVar[dict] = {"tokens": 500, "stars": 2}
    pack_1000: ClassVar[dict] = {"tokens": 1000, "stars": 3}
    
    

    
    

