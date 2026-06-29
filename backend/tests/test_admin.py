import pytest
from bson import ObjectId
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_workflow(admin_client: AsyncClient):
    """Admin list users, create transactions, and dashboard totals in one session."""
    from config import settings

    list_res = await admin_client.get("/api/users")
    assert list_res.status_code == 200
    body = list_res.json()
    users = body if isinstance(body, list) else body.get("data", body)
    assert isinstance(users, list)

    user = await admin_client.test_db[settings.users_collection].find_one(  # type: ignore[attr-defined]
        {"_id": ObjectId(admin_client.test_user_id)},  # type: ignore[attr-defined]
    )
    assert user

    tx_res = await admin_client.post(
        "/api/transactions",
        json={
            "userId": str(user["_id"]),
            "amount": 1000,
            "type": "income",
            "category": "Bonus",
        },
    )
    assert tx_res.status_code == 201

    await admin_client.post(
        "/api/transactions",
        json={
            "userId": str(user["_id"]),
            "amount": 200,
            "type": "expense",
            "category": "Food",
        },
    )

    dash = await admin_client.get("/api/dashboard/summary")
    assert dash.status_code == 200
    summary = dash.json()
    assert summary["totalIncome"] >= 1000
    assert summary["totalExpenses"] >= 200
    assert summary["netBalance"] == summary["totalIncome"] - summary["totalExpenses"]
