from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)


class UserSignupCompat(BaseModel):
    """Accepts legacy Next.js signup body; role from client is ignored."""

    username: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    isActive: Optional[bool] = None


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = {"populate_by_name": True}
