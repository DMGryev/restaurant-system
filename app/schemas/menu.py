from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category_id: int
    preparation_time: int = 10
    calories: Optional[int] = None
    weight: Optional[float] = None
    sort_order: int = 0


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    is_available: Optional[bool] = None
    preparation_time: Optional[int] = None
    calories: Optional[int] = None
    weight: Optional[float] = None


class MenuItemResponse(MenuItemBase):
    id: int
    is_available: bool
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryWithItems(CategoryResponse):
    items: List[MenuItemResponse] = []