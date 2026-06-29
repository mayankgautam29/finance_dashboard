import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_summary_requires_auth(api_client: AsyncClient):
    res = await api_client.get("/api/dashboard/summary")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_dashboard_summary_for_viewer(viewer_client: AsyncClient):
    res = await viewer_client.get("/api/dashboard/summary")
    assert res.status_code == 200
    body = res.json()
    assert "totalIncome" in body
    assert "totalExpenses" in body
    assert "netBalance" in body
    assert "monthlyBreakdown" in body
    assert body["role"] == "Viewer"
