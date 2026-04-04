from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from app.models.gamification import (
    EmployeeScore, Achievement, EmployeeAchievement,
    SpeedBonus, Leaderboard, BonusType
)
from app.models.order import OrderItem, OrderItemStatus
from app.models.user import User
from app.utils.timezone import now_local


async def award_speed_bonus(
    db: AsyncSession, user_id: int, order_id: int, time_seconds: float, role: str
) -> EmployeeScore | None:
    result = await db.execute(
        select(SpeedBonus).where(
            SpeedBonus.role == role,
            SpeedBonus.is_active == True
        )
    )
    speed_bonus = result.scalar_one_or_none()

    if not speed_bonus:
        return None

    if time_seconds > speed_bonus.max_time_seconds:
        return None

    speed_ratio = 1 - (time_seconds / speed_bonus.max_time_seconds)
    points = int(speed_bonus.points * (1 + speed_ratio))

    score = EmployeeScore(
        user_id=user_id,
        points=points,
        bonus_type=BonusType.SPEED,
        description=f"Бонус за скорость: {time_seconds:.0f}с (лимит: {speed_bonus.max_time_seconds}с)",
        order_id=order_id,
    )
    db.add(score)
    await db.flush()

    await check_achievements(db, user_id)

    return score


async def award_points(
    db: AsyncSession, user_id: int, points: int,
    bonus_type: BonusType, description: str, order_id: int = None
) -> EmployeeScore:
    score = EmployeeScore(
        user_id=user_id,
        points=points,
        bonus_type=bonus_type,
        description=description,
        order_id=order_id,
    )
    db.add(score)
    await db.flush()

    await check_achievements(db, user_id)

    return score


async def get_total_points(db: AsyncSession, user_id: int) -> int:
    result = await db.execute(
        select(func.coalesce(func.sum(EmployeeScore.points), 0))
        .where(EmployeeScore.user_id == user_id)
    )
    return result.scalar()


async def get_today_points(db: AsyncSession, user_id: int) -> int:
    today = date.today()
    result = await db.execute(
        select(func.coalesce(func.sum(EmployeeScore.points), 0))
        .where(
            EmployeeScore.user_id == user_id,
            func.date(EmployeeScore.earned_at) == today
        )
    )
    return result.scalar()


async def get_period_points(db: AsyncSession, user_id: int, days: int) -> int:
    since = now_local() - timedelta(days=days)
    result = await db.execute(
        select(func.coalesce(func.sum(EmployeeScore.points), 0))
        .where(
            EmployeeScore.user_id == user_id,
            EmployeeScore.earned_at >= since
        )
    )
    return result.scalar()


async def check_achievements(db: AsyncSession, user_id: int):
    total = await get_total_points(db, user_id)

    result = await db.execute(
        select(Achievement).where(Achievement.is_active == True)
    )
    achievements = result.scalars().all()

    for achievement in achievements:
        if total >= achievement.points_required:
            existing = await db.execute(
                select(EmployeeAchievement).where(
                    EmployeeAchievement.user_id == user_id,
                    EmployeeAchievement.achievement_id == achievement.id
                )
            )
            if existing.scalar_one_or_none() is None:
                ea = EmployeeAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id,
                )
                db.add(ea)

    await db.flush()


async def update_leaderboard(db: AsyncSession, target_date: date = None):
    if target_date is None:
        target_date = date.today()

    result = await db.execute(
        select(
            EmployeeScore.user_id,
            func.sum(EmployeeScore.points).label("total_points"),
            func.count(distinct(EmployeeScore.order_id)).label("orders_count"),
        )
        .where(func.date(EmployeeScore.earned_at) == target_date)
        .group_by(EmployeeScore.user_id)
        .order_by(func.sum(EmployeeScore.points).desc())
    )
    stats = result.all()

    # Удаляем старые записи за этот день
    existing = await db.execute(
        select(Leaderboard).where(Leaderboard.date == target_date)
    )
    for entry in existing.scalars().all():
        await db.delete(entry)
    await db.flush()

    # Создаём новые записи
    for rank, stat in enumerate(stats, 1):
        lb = Leaderboard(
            user_id=stat.user_id,
            date=target_date,
            total_points=stat.total_points,
            orders_count=stat.orders_count,
            rank=rank,
        )
        db.add(lb)

    await db.flush()


async def get_leaderboard(db: AsyncSession, target_date: date = None) -> list:
    if target_date is None:
        target_date = date.today()

    # Сначала обновляем
    await update_leaderboard(db, target_date)

    result = await db.execute(
        select(Leaderboard, User.username, User.full_name)
        .join(User, Leaderboard.user_id == User.id)
        .where(Leaderboard.date == target_date)
        .order_by(Leaderboard.rank)
    )

    rows = result.all()

    # Убираем дубли по user_id
    seen = set()
    unique_rows = []
    for row in rows:
        lb = row[0]
        if lb.user_id not in seen:
            seen.add(lb.user_id)
            unique_rows.append(row)

    return unique_rows