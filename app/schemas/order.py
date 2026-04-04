from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.order import OrderStatus, OrderItemStatus, TableStatus


class TableBase(BaseModel):
    number: int
    seats: int = 4
    zone: Optional[str] = None


class TableCreate(TableBase):
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None


class TableUpdate(BaseModel):
    seats: Optional[int] = None
    status: Optional[TableStatus] = None
    zone: Optional[str] = None


class TableResponse(TableBase):
    id: int
    status: TableStatus
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None

    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1
    notes: Optional[str] = None


class OrderItemUpdate(BaseModel):
    status: Optional[OrderItemStatus] = None
    cook_id: Optional[int] = None


class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    price: float
    status: OrderItemStatus
    notes: Optional[str] = None
    cook_id: Optional[int] = None
    started_at: Optional[datetime] = None
    ready_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    table_id: Optional[int] = None
    customer_id: Optional[int] = None
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None
    discount: Optional[float] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    table_id: Optional[int] = None
    waiter_id: int
    customer_id: Optional[int] = None
    status: OrderStatus
    total_amount: float
    discount: float
    tax: float
    final_amount: float
    notes: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    ready_at: Optional[datetime] = None
    served_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True