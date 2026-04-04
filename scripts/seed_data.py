"""
Скрипт для заполнения базы тестовыми данными.
"""
import asyncio
import sys
import os

# Добавляем корневую папку в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.database import Base
from app.models import *
from app.utils.security import hash_password
from app.models.user import Role
from app.models.order import TableStatus
from app.models.gamification import BonusType


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        # Удаляем старые таблицы и создаём новые
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # ===== ПОЛЬЗОВАТЕЛИ =====
        users_data = [
            User(
                username="admin",
                email="admin@restaurant.com",
                full_name="Администратор Системы",
                hashed_password=hash_password("admin123"),
                role=Role.ADMIN,
                card_id="CARD-ADMIN-001",
            ),
            User(
                username="manager",
                email="manager@restaurant.com",
                full_name="Иванов Сергей Петрович",
                hashed_password=hash_password("manager123"),
                role=Role.MANAGER,
                card_id="CARD-MGR-001",
            ),
            User(
                username="waiter1",
                email="waiter1@restaurant.com",
                full_name="Петрова Анна Игоревна",
                hashed_password=hash_password("waiter123"),
                role=Role.WAITER,
                card_id="CARD-WTR-001",
                hourly_rate=300.0,
            ),
            User(
                username="waiter2",
                email="waiter2@restaurant.com",
                full_name="Сидоров Дмитрий Алексеевич",
                hashed_password=hash_password("waiter123"),
                role=Role.WAITER,
                card_id="CARD-WTR-002",
                hourly_rate=300.0,
            ),
            User(
                username="cook1",
                email="cook1@restaurant.com",
                full_name="Козлов Михаил Иванович",
                hashed_password=hash_password("cook123"),
                role=Role.COOK,
                card_id="CARD-COOK-001",
                hourly_rate=400.0,
            ),
            User(
                username="cook2",
                email="cook2@restaurant.com",
                full_name="Новикова Елена Сергеевна",
                hashed_password=hash_password("cook123"),
                role=Role.COOK,
                card_id="CARD-COOK-002",
                hourly_rate=400.0,
            ),
            User(
                username="bartender1",
                email="bartender@restaurant.com",
                full_name="Морозов Андрей Викторович",
                hashed_password=hash_password("bar123"),
                role=Role.BARTENDER,
                card_id="CARD-BAR-001",
                hourly_rate=350.0,
            ),
        ]
        for u in users_data:
            db.add(u)

        # ===== КАТЕГОРИИ МЕНЮ =====
        categories = [
            Category(name="Салаты", description="Свежие салаты", sort_order=1),
            Category(name="Супы", description="Горячие супы", sort_order=2),
            Category(name="Горячее", description="Основные блюда", sort_order=3),
            Category(name="Паста", description="Итальянская паста", sort_order=4),
            Category(name="Десерты", description="Сладкие десерты", sort_order=5),
            Category(name="Напитки", description="Безалкогольные напитки", sort_order=6),
            Category(name="Алкоголь", description="Алкогольные напитки", sort_order=7),
        ]
        for c in categories:
            db.add(c)
        await db.flush()

        # ===== БЛЮДА =====
        menu_items = [
            # Салаты
            MenuItem(name="Цезарь с курицей", price=450, category_id=1, preparation_time=10, weight=250, calories=350),
            MenuItem(name="Греческий салат", price=380, category_id=1, preparation_time=8, weight=230, calories=280),
            MenuItem(name="Оливье", price=320, category_id=1, preparation_time=5, weight=200, calories=310),
            # Супы
            MenuItem(name="Борщ", price=350, category_id=2, preparation_time=5, weight=300, calories=220),
            MenuItem(name="Крем-суп грибной", price=400, category_id=2, preparation_time=7, weight=280, calories=190),
            MenuItem(name="Том Ям", price=520, category_id=2, preparation_time=12, weight=300, calories=180),
            # Горячее
            MenuItem(name="Стейк Рибай", price=1800, category_id=3, preparation_time=25, weight=300, calories=650),
            MenuItem(name="Лосось на гриле", price=1200, category_id=3, preparation_time=20, weight=250, calories=420),
            MenuItem(name="Куриная грудка", price=650, category_id=3, preparation_time=18, weight=220, calories=380),
            MenuItem(name="Бургер классический", price=550, category_id=3, preparation_time=15, weight=350, calories=720),
            # Паста
            MenuItem(name="Карбонара", price=520, category_id=4, preparation_time=15, weight=280, calories=580),
            MenuItem(name="Болоньезе", price=480, category_id=4, preparation_time=15, weight=300, calories=520),
            # Десерты
            MenuItem(name="Тирамису", price=380, category_id=5, preparation_time=5, weight=150, calories=420),
            MenuItem(name="Чизкейк", price=350, category_id=5, preparation_time=5, weight=140, calories=380),
            MenuItem(name="Мороженое (3 шарика)", price=280, category_id=5, preparation_time=3, weight=120, calories=280),
            # Напитки
            MenuItem(name="Капучино", price=250, category_id=6, preparation_time=3, weight=200, calories=120),
            MenuItem(name="Латте", price=280, category_id=6, preparation_time=3, weight=250, calories=150),
            MenuItem(name="Свежевыжатый сок", price=350, category_id=6, preparation_time=5, weight=300, calories=100),
            MenuItem(name="Чай", price=180, category_id=6, preparation_time=2, weight=200, calories=5),
            # Алкоголь
            MenuItem(name="Пиво (0.5л)", price=350, category_id=7, preparation_time=2, weight=500, calories=210),
            MenuItem(name="Вино (бокал)", price=450, category_id=7, preparation_time=2, weight=150, calories=120),
        ]
        for item in menu_items:
            db.add(item)

        # ===== СТОЛЫ =====
        tables = [
            Table(number=1, seats=2, zone="Зал", pos_x=1, pos_y=1),
            Table(number=2, seats=2, zone="Зал", pos_x=2, pos_y=1),
            Table(number=3, seats=4, zone="Зал", pos_x=3, pos_y=1),
            Table(number=4, seats=4, zone="Зал", pos_x=1, pos_y=2),
            Table(number=5, seats=6, zone="Зал", pos_x=2, pos_y=2),
            Table(number=6, seats=4, zone="Терраса", pos_x=1, pos_y=3),
            Table(number=7, seats=4, zone="Терраса", pos_x=2, pos_y=3),
            Table(number=8, seats=2, zone="Терраса", pos_x=3, pos_y=3),
            Table(number=9, seats=8, zone="VIP", pos_x=1, pos_y=4),
            Table(number=10, seats=10, zone="VIP", pos_x=2, pos_y=4),
        ]
        for t in tables:
            db.add(t)

        # ===== КЛИЕНТЫ CRM =====
        customers = [
            Customer(first_name="Александр", last_name="Пушкин", phone="+79001234567", email="pushkin@mail.ru", loyalty_points=150, visit_count=5, total_spent=12000),
            Customer(first_name="Мария", last_name="Иванова", phone="+79001234568", email="ivanova@mail.ru", loyalty_points=320, visit_count=12, total_spent=45000, is_vip=True, discount_percent=5.0),
            Customer(first_name="Дмитрий", last_name="Петров", phone="+79001234569", loyalty_points=50, visit_count=2, total_spent=3500),
        ]
        for c in customers:
            db.add(c)

        # ===== ДОСТИЖЕНИЯ =====
        achievements = [
            Achievement(name="Новичок", description="Заработай 100 баллов", icon="star", points_required=100, badge_color="#bronze"),
            Achievement(name="Опытный", description="Заработай 500 баллов", icon="medal", points_required=500, badge_color="#silver"),
            Achievement(name="Профессионал", description="Заработай 1000 баллов", icon="trophy", points_required=1000, badge_color="#gold"),
            Achievement(name="Легенда", description="Заработай 5000 баллов", icon="crown", points_required=5000, badge_color="#diamond"),
            Achievement(name="Молния", description="Заработай 2000 баллов за скорость", icon="lightning", points_required=2000, badge_color="#electric"),
        ]
        for a in achievements:
            db.add(a)

        # ===== НАСТРОЙКИ БОНУСОВ СКОРОСТИ =====
        speed_bonuses = [
            SpeedBonus(role="waiter", max_time_seconds=120, points=20, description="Подача блюда за 2 минуты"),
            SpeedBonus(role="cook", max_time_seconds=600, points=30, description="Приготовление за 10 минут"),
            SpeedBonus(role="bartender", max_time_seconds=180, points=15, description="Приготовление напитка за 3 минуты"),
        ]
        for sb in speed_bonuses:
            db.add(sb)

        await db.commit()
        print("✅ Seed data loaded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())