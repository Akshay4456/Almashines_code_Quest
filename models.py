from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Product(BaseModel):
    url: str

class PriceHistory(BaseModel):
    product_id: int
    price: float
    timestamp: datetime