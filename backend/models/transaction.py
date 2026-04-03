from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    type: Literal["income", "expense"]
    category: str = Field(min_length=1)
    description: str = ""
    date: Optional[datetime] = None
    userId: Optional[str] = None


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    type: Optional[Literal["income", "expense"]] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None


class RecordCreateLegacy(BaseModel):
    amount: float
    type: str
    category: str
    note: str = ""
    username: str = Field(min_length=1, description="Existing user's username or name")
