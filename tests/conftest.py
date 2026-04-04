import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def admin_token(client: AsyncClient):
    # Сначала создаём первого админа
    response = await client.post(
        "/api/v1/auth/register/initial",
        json={
            "username": "testadmin",
            "email": "testadmin@test.com",
            "full_name": "Test Admin",
            "password": "test123",
            "role": "admin",
        },
    )

    # Логинимся
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "test123"},
    )
    data = response.json()
    return data["access_token"]