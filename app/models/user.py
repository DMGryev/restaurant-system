import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, Float
)
from app.database import Base
from app.utils.timezone import now_local


class Role(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    WAITER = "waiter"
    COOK = "cook"
    BARTENDER = "bartender"
    CASHIER = "cashier"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(Role), nullable=False, default=Role.WAITER)
    is_active = Column(Boolean, default=True)
    card_id = Column(String(100), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    hourly_rate = Column(Float, nullable=True, default=0.0)
    created_at = Column(DateTime, default=now_local)
    updated_at = Column(DateTime, default=now_local, onupdate=now_local)