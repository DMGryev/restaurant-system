from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus, OrderItemStatus, Table, TableStatus
from app.models.user import User, Role
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse,
    OrderItemUpdate, OrderItemResponse,
)
from app.services.order_service import create_order, update_order_item_status, get_order_with_items
from app.services.gamification_service import award_speed_bonus, award_points
from app.models.gamification import BonusType
from app.utils.dependencies import get_current_user, require_roles
from app.utils.timezone import now_local

router = APIRouter(prefix="/orders", tags=["Orders"])


async def auto_update_order_status(db: AsyncSession, order_id: int):
    """Автоматически обновляет статус заказа на основе статусов позиций"""
    order = await get_order_with_items(db, order_id)
    if not order or not order.items:
        return

    statuses = [item.status for item in order.items]

    # Если все позиции готовы или поданы — заказ готов
    if all(s in [OrderItemStatus.READY, OrderItemStatus.SERVED] for s in statuses):
        if order.status not in [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.PAID]:
            order.status = OrderStatus.READY
            order.ready_at = now_local()

    # Если хотя бы одна готовится — заказ готовится
    elif any(s == OrderItemStatus.PREPARING for s in statuses):
        if order.status not in [OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED, OrderStatus.PAID]:
            order.status = OrderStatus.PREPARING

    # Если все поданы — заказ подан
    if all(s == OrderItemStatus.SERVED for s in statuses):
        if order.status not in [OrderStatus.SERVED, OrderStatus.PAID]:
            order.status = OrderStatus.SERVED
            order.served_at = now_local()

    await db.flush()


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    status: Optional[OrderStatus] = None,
    waiter_id: Optional[int] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Order).options(selectinload(Order.items))

    if status:
        query = query.where(Order.status == status)
    if waiter_id:
        query = query.where(Order.waiter_id == waiter_id)

    if current_user.role == Role.WAITER:
        query = query.where(Order.waiter_id == current_user.id)

    query = query.order_by(Order.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    orders = result.scalars().unique().all()
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/active", response_model=List[OrderResponse])
async def list_active_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active_statuses = [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY]
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.status.in_(active_statuses))
        .order_by(Order.created_at)
    )
    result = await db.execute(query)
    orders = result.scalars().unique().all()
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await get_order_with_items(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(order)


@router.post("/", response_model=OrderResponse)
async def new_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = await create_order(db, data, waiter_id=current_user.id)

        await award_points(
            db, current_user.id, 5,
            BonusType.ATTENDANCE,
            "Новый заказ создан",
            order.id
        )

        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await get_order_with_items(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data:
        new_status = update_data["status"]

        if new_status == OrderStatus.CONFIRMED:
            order.confirmed_at = now_local()

        elif new_status == OrderStatus.PREPARING:
            order.confirmed_at = order.confirmed_at or now_local()

        elif new_status == OrderStatus.READY:
            order.ready_at = now_local()

        elif new_status == OrderStatus.SERVED:
            order.served_at = now_local()
            if order.ready_at:
                serve_time = (now_local() - order.ready_at).total_seconds()
                await award_speed_bonus(
                    db, current_user.id, order.id, serve_time, "waiter"
                )

        elif new_status == OrderStatus.PAID:
            order.paid_at = now_local()
            if order.table_id:
                result = await db.execute(
                    select(Table).where(Table.id == order.table_id)
                )
                table = result.scalar_one_or_none()
                if table:
                    table.status = TableStatus.NEEDS_CLEANING

            await award_points(
                db, order.waiter_id, 10,
                BonusType.QUALITY,
                "Заказ завершён",
                order.id
            )

        elif new_status == OrderStatus.CANCELLED:
            if order.table_id:
                result = await db.execute(
                    select(Table).where(Table.id == order.table_id)
                )
                table = result.scalar_one_or_none()
                if table:
                    table.status = TableStatus.FREE

    for key, value in update_data.items():
        setattr(order, key, value)

    if "discount" in update_data:
        order.final_amount = order.total_amount + order.tax - order.discount

    await db.flush()
    await db.refresh(order)

    order = await get_order_with_items(db, order_id)
    return OrderResponse.model_validate(order)


@router.patch("/{order_id}/items/{item_id}", response_model=OrderItemResponse)
async def update_item_status(
    order_id: int,
    item_id: int,
    data: OrderItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        cook_id = current_user.id if current_user.role in [Role.COOK, Role.BARTENDER] else None
        new_status = data.status if data.status else OrderItemStatus.PREPARING

        item = await update_order_item_status(db, item_id, new_status, cook_id)

        # Бонус за скорость приготовления
        if new_status == OrderItemStatus.READY and item.started_at:
            cook_time = (item.ready_at - item.started_at).total_seconds()
            if cook_id:
                await award_speed_bonus(
                    db, cook_id, order_id, cook_time, "cook"
                )

        # Автоматически обновляем статус всего заказа
        await auto_update_order_status(db, order_id)

        return OrderItemResponse.model_validate(item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))