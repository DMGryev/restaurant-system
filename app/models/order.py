import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import now_local


class TableStatus(str, enum.Enum):
    FREE = "free"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    NEEDS_CLEANING = "needs_cleaning"


class OrderStatus(str, enum.Enum):
    NEW = "new"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    SERVED = "served"
    PAID = "paid"
    CANCELLED = "cancelled"


class OrderItemStatus(str, enum.Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    SERVED = "served"
    CANCELLED = "cancelled"


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False)
    seats = Column(Integer, nullable=False, default=4)
    status = Column(Enum(TableStatus), default=TableStatus.FREE)
    zone = Column(String(50), nullable=True)
    pos_x = Column(Float, nullable=True)
    pos_y = Column(Float, nullable=True)

    orders = relationship("Order", back_populates="table")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, nullable=False)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    waiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.NEW)
    total_amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_local)
    confirmed_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    served_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=now_local, onupdate=now_local)

    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)
    status = Column(Enum(OrderItemStatus), default=OrderItemStatus.PENDING)
    notes = Column(Text, nullable=True)
    cook_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_local)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")