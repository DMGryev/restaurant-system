from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.gamification import BonusType


class EmployeeScoreCreate(BaseModel):
    user_id: int
    points: int
    bonus_type: BonusType
    description: Optional[str] = None
    order_id: Optional[int] = None


class EmployeeScoreResponse(BaseModel):
    id: int
    user_id: int
    points: int
    bonus_type: BonusType
    description: Optional[str] = None
    order_id: Optional[int] = None
    earned_at: datetime

    class Config:
        from_attributes = True


class AchievementCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    points_required: int = 0
    badge_color: str = "#gold"


class AchievementResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    points_required: int
    badge_color: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SpeedBonusCreate(BaseModel):
    role: str
    max_time_seconds: int
    points: int
    description: Optional[str] = None


class SpeedBonusResponse(BaseModel):
    id: int
    role: str
    max_time_seconds: int
    points: int
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: int
    username: Optional[str] = None
    full_name: Optional[str] = None
    total_points: int
    orders_count: int
    avg_speed_seconds: Optional[float] = None
    rank: Optional[int] = None
    date: date

    class Config:
        from_attributes = True


class EmployeeStats(BaseModel):
    user_id: int
    total_points: int
    today_points: int
    week_points: int
    month_points: int
    total_orders: int
    avg_speed: Optional[float] = None
    achievements: List[AchievementResponse] = []
    rank: Optional[int] = None