from typing import Optional

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    category: str = Field(min_length=1)
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    limit: float = Field(gt=0)
    userId: Optional[str] = None


class BudgetUpdate(BaseModel):
    limit: float = Field(gt=0)
