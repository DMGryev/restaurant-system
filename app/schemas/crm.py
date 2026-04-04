from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    birthday: Optional[datetime] = None


class CustomerCreate(CustomerBase):
    card_number: Optional[str] = None


class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    birthday: Optional[datetime] = None
    notes: Optional[str] = None
    is_vip: Optional[bool] = None
    discount_percent: Optional[float] = None


class CustomerResponse(CustomerBase):
    id: int
    card_number: Optional[str] = None
    loyalty_points: int
    total_spent: float
    visit_count: int
    is_vip: bool
    discount_percent: float
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerVisitResponse(BaseModel):
    id: int
    customer_id: int
    visit_date: datetime
    amount_spent: float
    points_earned: int
    points_spent: int
    feedback: Optional[str] = None
    rating: Optional[int] = None

    class Config:
        from_attributes = True