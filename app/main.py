from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, menu, tables, orders, crm, gamification, analytics, websockets


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы при старте
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
    yield
    print("🛑 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="""
    🍽️ Restaurant Management System
    
    Система управления рестораном с геймификацией для сотрудников.
    
    Основные модули:
    - 🔐 Авторизация (JWT + магнитные карты)
    - 📋 Управление меню
    - 🛎️ Заказы и столики  
    - 👥 CRM (клиентская база, лояльность)
    - 🎮 Геймификация (баллы, скорость, достижения, лидерборд)
    - 📊 Аналитика продаж
    - 🔌 WebSocket уведомления
    """,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(menu.router, prefix="/api/v1")
app.include_router(tables.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(crm.router, prefix="/api/v1")
app.include_router(gamification.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(websockets.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "running ✅",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
