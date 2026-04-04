import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_achievements_list_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/gamification/achievements")
    assert response.status_code == 403