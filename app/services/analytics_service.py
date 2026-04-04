from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.order import Order, OrderItem, OrderStatus
from app.models.menu import MenuItem, Category
from app.models.crm import Customer
from app.models.user import User


async def get_sales_summary(
    db: AsyncSession, start_date: date = None, end_date: date = None
) -> dict:
    if start_date is None:
        start_date = date.today()
    if end_date is None:
        end_date = date.today()

    result = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.coalesce(func.sum(Order.final_amount), 0).label("total_revenue"),
            func.coalesce(func.avg(Order.final_amount), 0).label("avg_order_amount"),
        )
        .where(
            func.date(Order.created_at) >= start_date,
            func.date(Order.created_at) <= end_date,
            Order.status != OrderStatus.CANCELLED
        )
    )
    row = result.one()

    return {
        "total_orders": row.total_orders,
        "total_revenue": round(float(row.total_revenue), 2),
        "avg_order_amount": round(float(row.avg_order_amount), 2),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }


async def get_top_items(db: AsyncSession, limit: int = 10) -> list:
    result = await db.execute(
        select(
            MenuItem.name,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.quantity * OrderItem.price).label("total_revenue"),
        )
        .join(OrderItem, MenuItem.id == OrderItem.menu_item_id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.status != OrderStatus.CANCELLED)
        .group_by(MenuItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    return [
        {
            "name": row.name,
            "total_sold": int(row.total_sold),
            "total_revenue": round(float(row.total_revenue), 2),
        }
        for row in result.all()
    ]


async def get_waiter_performance(db: AsyncSession, days: int = 7) -> list:
    since = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            User.full_name,
            func.count(Order.id).label("orders_count"),
            func.coalesce(func.sum(Order.final_amount), 0).label("revenue"),
        )
        .join(Order, User.id == Order.waiter_id)
        .where(
            Order.created_at >= since,
            Order.status != OrderStatus.CANCELLED
        )
        .group_by(User.full_name)
        .order_by(func.sum(Order.final_amount).desc())
    )
    return [
        {
            "waiter": row.full_name,
            "orders_count": row.orders_count,
            "revenue": round(float(row.revenue), 2),
        }
        for row in result.all()
    ]


async def get_hourly_sales(db: AsyncSession, target_date: date = None) -> list:
    if target_date is None:
        target_date = date.today()

    result = await db.execute(
        select(
            func.extract("hour", Order.created_at).label("hour"),
            func.count(Order.id).label("orders_count"),
            func.coalesce(func.sum(Order.final_amount), 0).label("revenue"),
        )
        .where(
            func.date(Order.created_at) == target_date,
            Order.status != OrderStatus.CANCELLED
        )
        .group_by(func.extract("hour", Order.created_at))
        .order_by(func.extract("hour", Order.created_at))
    )
    return [
        {
            "hour": int(row.hour),
            "orders_count": row.orders_count,
            "revenue": round(float(row.revenue), 2),
        }
        for row in result.all()
    ]