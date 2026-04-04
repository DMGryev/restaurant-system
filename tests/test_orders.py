import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_tables_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/tables/")
    assert response.status_code == 403  # No token