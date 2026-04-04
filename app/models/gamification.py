import enum
from datetime import date
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date,
    ForeignKey, Enum, Text, Boolean
)
from app.database import Base
from app.utils.timezone import now_local


class BonusType(str, enum.Enum):
    SPEED = "speed"
    QUALITY = "quality"
    UPSELL = "upsell"
    ATTENDANCE = "attendance"
    CUSTOMER_RATING = "customer_rating"


class EmployeeScore(Base):
    __tablename__ = "employee_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Integer, default=0)
    bonus_type = Column(Enum(BonusType), nullable=False)
    description = Column(Text, nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    earned_at = Column(DateTime, default=now_local)


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    points_required = Column(Integer, default=0)
    badge_color = Column(String(20), default="#gold")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_local)


class EmployeeAchievement(Base):
    __tablename__ = "employee_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, default=now_local)


class SpeedBonus(Base):
    __tablename__ = "speed_bonuses"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), nullable=False)
    max_time_seconds = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)


class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, default=date.today)
    total_points = Column(Integer, default=0)
    orders_count = Column(Integer, default=0)
    avg_speed_seconds = Column(Float, nullable=True)
    rank = Column(Integer, nullable=True)