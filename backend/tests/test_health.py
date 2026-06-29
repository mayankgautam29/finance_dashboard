import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(api_client: AsyncClient):
    res = await api_client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == "finance-dashboard-api"
