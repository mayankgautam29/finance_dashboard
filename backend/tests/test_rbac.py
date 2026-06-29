import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_viewer_cannot_list_users(viewer_client: AsyncClient):
    res = await viewer_client.get("/api/users")
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_access_transactions_api(viewer_client: AsyncClient):
    res = await viewer_client.get("/api/transactions")
    assert res.status_code == 403
