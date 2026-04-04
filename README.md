# 🍽️ Restaurant Management System

Система управления рестораном с геймификацией для сотрудников.

## Особенности

- ✅ Управление заказами и столиками
- ✅ CRM система с программой лояльности
- ✅ Геймификация (баллы, достижения, лидерборд)
- ✅ Аналитика продаж
- ✅ Авторизация по магнитным картам
- ✅ Desktop приложение (Electron)

## Технологии

**Backend:**
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT авторизация

**Frontend:**
- React
- Ant Design
- Electron (Desktop)

## Установка локально

### Backend

```bash
# Создай виртуальное окружение
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Установи зависимости
pip install -r requirements.txt

# Создай .env файл
cp .env.example .env

# Запусти сервер
uvicorn app.main:app --reload