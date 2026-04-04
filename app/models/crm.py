from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import now_local


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=True)
    phone = Column(String(20), unique=True, nullable=True)
    email = Column(String(100), unique=True, nullable=True)
    birthday = Column(DateTime, nullable=True)
    card_number = Column(String(50), unique=True, nullable=True)
    loyalty_points = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    visit_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    is_vip = Column(Boolean, default=False)
    discount_percent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=now_local)
    updated_at = Column(DateTime, default=now_local, onupdate=now_local)

    visits = relationship("CustomerVisit", back_populates="customer")


class CustomerVisit(Base):
    __tablename__ = "customer_visits"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    visit_date = Column(DateTime, default=now_local)
    amount_spent = Column(Float, default=0.0)
    points_earned = Column(Integer, default=0)
    points_spent = Column(Integer, default=0)
    feedback = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)

    customer = relationship("Customer", back_populates="visits")