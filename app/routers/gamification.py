from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.gamification import (
    EmployeeScore, Achievement, EmployeeAchievement, SpeedBonus
)
from app.models.user import User, Role
from app.schemas.gamification import (
    EmployeeScoreResponse, AchievementCreate, AchievementResponse,
    SpeedBonusCreate, SpeedBonusResponse, LeaderboardEntry, EmployeeStats,
)
from app.services.gamification_service import (
    get_total_points, get_today_points, get_period_points,
    get_leaderboard, award_points,
)
from app.models.gamification import BonusType
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/my-scores", response_model=List[EmployeeScoreResponse])
async def my_scores(
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmployeeScore)
        .where(EmployeeScore.user_id == current_user.id)
        .order_by(EmployeeScore.earned_at.desc())
        .limit(limit)
    )
    return [EmployeeScoreResponse.model_validate(s) for s in result.scalars().all()]


@router.get("/my-stats", response_model=EmployeeStats)
async def my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = await get_total_points(db, current_user.id)
    today = await get_today_points(db, current_user.id)
    week = await get_period_points(db, current_user.id, 7)
    month = await get_period_points(db, current_user.id, 30)

    result = await db.execute(
        select(Achievement)
        .join(EmployeeAchievement, Achievement.id == EmployeeAchievement.achievement_id)
        .where(EmployeeAchievement.user_id == current_user.id)
    )
    achievements = [
        AchievementResponse.model_validate(a)
        for a in result.scalars().all()
    ]

    from sqlalchemy import func
    from app.models.order import Order, OrderStatus
    order_count = await db.execute(
        select(func.count(Order.id))
        .where(Order.waiter_id == current_user.id, Order.status != OrderStatus.CANCELLED)
    )

    return EmployeeStats(
        user_id=current_user.id,
        total_points=total,
        today_points=today,
        week_points=week,
        month_points=month,
        total_orders=order_count.scalar() or 0,
        achievements=achievements,
    )


@router.get("/scores/{user_id}", response_model=List[EmployeeScoreResponse])
async def user_scores(
    user_id: int,
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    result = await db.execute(
        select(EmployeeScore)
        .where(EmployeeScore.user_id == user_id)
        .order_by(EmployeeScore.earned_at.desc())
        .limit(limit)
    )
    return [EmployeeScoreResponse.model_validate(s) for s in result.scalars().all()]


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def leaderboard(
    target_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await get_leaderboard(db, target_date)

    return [
        LeaderboardEntry(
            user_id=lb.user_id,
            username=username,
            full_name=full_name,
            total_points=lb.total_points,
            orders_count=lb.orders_count,
            avg_speed_seconds=lb.avg_speed_seconds,
            rank=lb.rank,
            date=lb.date,
        )
        for lb, username, full_name in rows
    ]


@router.get("/achievements", response_model=List[AchievementResponse])
async def list_achievements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Achievement).where(Achievement.is_active == True)
    )
    return [AchievementResponse.model_validate(a) for a in result.scalars().all()]


@router.post("/achievements", response_model=AchievementResponse)
async def create_achievement(
    data: AchievementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
):
    achievement = Achievement(**data.model_dump())
    db.add(achievement)
    await db.flush()
    await db.refresh(achievement)
    return AchievementResponse.model_validate(achievement)


@router.get("/speed-bonuses", response_model=List[SpeedBonusResponse])
async def list_speed_bonuses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    result = await db.execute(select(SpeedBonus))
    return [SpeedBonusResponse.model_validate(s) for s in result.scalars().all()]


@router.post("/speed-bonuses", response_model=SpeedBonusResponse)
async def create_speed_bonus(
    data: SpeedBonusCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
):
    bonus = SpeedBonus(**data.model_dump())
    db.add(bonus)
    await db.flush()
    await db.refresh(bonus)
    return SpeedBonusResponse.model_validate(bonus)


@router.post("/award-points", response_model=EmployeeScoreResponse)
async def manual_award_points(
    user_id: int,
    points: int = Query(..., gt=0),
    bonus_type: BonusType = BonusType.QUALITY,
    description: str = "Ручное начисление",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    score = await award_points(db, user_id, points, bonus_type, description)
    return EmployeeScoreResponse.model_validate(score)