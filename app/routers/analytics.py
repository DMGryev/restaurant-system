from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
from app.database import get_db
from app.models.user import User, Role
from app.services.analytics_service import (
    get_sales_summary, get_top_items,
    get_waiter_performance, get_hourly_sales,
)
from app.utils.dependencies import require_roles

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/sales-summary")
async def sales_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    return await get_sales_summary(db, start_date, end_date)


@router.get("/top-items")
async def top_items(
    limit: int = Query(default=10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    return await get_top_items(db, limit)


@router.get("/waiter-performance")
async def waiter_performance(
    days: int = Query(default=7, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    return await get_waiter_performance(db, days)


@router.get("/hourly-sales")
async def hourly_sales(
    target_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    return await get_hourly_sales(db, target_date)