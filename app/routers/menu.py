from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models.menu import Category, MenuItem
from app.models.user import User, Role
from app.schemas.menu import (
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryWithItems,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
)
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/menu", tags=["Menu"])


# ===== Категории =====

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.sort_order)
    )
    return [CategoryResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/categories/{category_id}", response_model=CategoryWithItems)
async def get_category_with_items(category_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.items))
        .where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryWithItems.model_validate(category)


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    category = Category(**data.model_dump())
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)

    await db.flush()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)


# ===== Блюда =====

@router.get("/items", response_model=List[MenuItemResponse])
async def list_menu_items(
    category_id: int = None,
    available_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    query = select(MenuItem)
    if category_id:
        query = query.where(MenuItem.category_id == category_id)
    if available_only:
        query = query.where(MenuItem.is_available == True)
    query = query.order_by(MenuItem.sort_order)

    result = await db.execute(query)
    return [MenuItemResponse.model_validate(i) for i in result.scalars().all()]


@router.post("/items", response_model=MenuItemResponse)
async def create_menu_item(
    data: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    item = MenuItem(**data.model_dump())
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return MenuItemResponse.model_validate(item)


@router.patch("/items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    data: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    await db.flush()
    await db.refresh(item)
    return MenuItemResponse.model_validate(item)


@router.delete("/items/{item_id}")
async def delete_menu_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    item.is_available = False
    await db.flush()
    return {"detail": "Menu item disabled"}