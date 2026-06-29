import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_budget(viewer_client: AsyncClient):
    create = await viewer_client.post(
        "/api/budgets",
        json={"category": "Food", "month": "2026-06", "limit": 5000},
    )
    assert create.status_code == 201

    listing = await viewer_client.get("/api/budgets", params={"month": "2026-06"})
    assert listing.status_code == 200
    budgets = listing.json()["budgets"]
    assert len(budgets) == 1
    assert budgets[0]["category"] == "Food"
    assert budgets[0]["limit"] == 5000
    assert budgets[0]["spent"] == 0
    assert budgets[0]["percentUsed"] == 0


@pytest.mark.asyncio
async def test_budget_duplicate_rejected(viewer_client: AsyncClient):
    payload = {"category": "Transport", "month": "2026-07", "limit": 2000}
    first = await viewer_client.post("/api/budgets", json=payload)
    assert first.status_code == 201

    second = await viewer_client.post("/api/budgets", json=payload)
    assert second.status_code == 400
