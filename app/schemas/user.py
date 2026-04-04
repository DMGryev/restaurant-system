from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import Role


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: Role = Role.WAITER
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    card_id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    card_id: Optional[str] = None
    hourly_rate: Optional[float] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    card_id: Optional[str] = None
    hourly_rate: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class CardLogin(BaseModel):
    card_id: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse