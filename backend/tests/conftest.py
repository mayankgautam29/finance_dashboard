import os
import sys
import uuid
from pathlib import Path

# Environment must be set before any backend module imports settings.
os.environ.setdefault("MONGODB_URI", "mongodb://localhost/finance_dashboard_pytest")
os.environ.setdefault("JWT_SECRET", "pytest-secret-key-do-not-use-in-production")
os.environ.setdefault("ALLOWED_ORIGINS", "http://testserver")
os.environ.setdefault("SECURE_COOKIES", "false")
os.environ.setdefault("BUDGETS_COLLECTION", "budgets")

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import mongomock_motor
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def api_client(monkeypatch):
    import database as db_module

    mock_client = mongomock_motor.AsyncMongoMockClient()
    db_name = "finance_dashboard_pytest"

    def mock_get_client():
        return mock_client

    def mock_get_db():
        return mock_client[db_name]

    monkeypatch.setattr(db_module, "_client", mock_client)
    monkeypatch.setattr(db_module, "get_client", mock_get_client)
    monkeypatch.setattr(db_module, "get_db", mock_get_db)

    from main import app

    transport = ASGITransport(app=app)
    test_db = mock_client[db_name]
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        client.test_db = test_db  # type: ignore[attr-defined]
        yield client

    db_module._client = None
    await mock_client.drop_database(db_name)


@pytest.fixture
async def viewer_client(api_client: AsyncClient):
    suffix = uuid.uuid4().hex[:8]
    email = f"viewer_{suffix}@example.com"
    res = await api_client.post(
        "/api/auth/signup",
        json={
            "email": email,
            "password": "viewer123",
            "username": f"viewer_{suffix}",
        },
    )
    assert res.status_code == 201
    assert "token" in api_client.cookies
    api_client.test_email = email  # type: ignore[attr-defined]
    return api_client


@pytest.fixture
async def admin_client(api_client: AsyncClient):
    from config import settings

    suffix = uuid.uuid4().hex[:8]
    email = f"admin_{suffix}@example.com"
    password = "admin123"
    signup = await api_client.post(
        "/api/auth/signup",
        json={
            "email": email,
            "password": password,
            "username": f"admin_{suffix}",
        },
    )
    assert signup.status_code == 201
    stored_email = signup.json()["user"]["email"]

    db = api_client.test_db  # type: ignore[attr-defined]
    doc = await db[settings.users_collection].find_one({"email": stored_email})
    assert doc is not None, "signup user not found in test database"
    updated = await db[settings.users_collection].update_one(
        {"_id": doc["_id"]},
        {"$set": {"role": "admin"}},
    )
    assert updated.modified_count == 1

    api_client.cookies.clear()
    login = await api_client.post(
        "/api/auth/login",
        json={"email": stored_email, "password": password},
    )
    assert login.status_code == 200, login.text
    api_client.test_email = stored_email  # type: ignore[attr-defined]
    api_client.test_user_id = str(doc["_id"])  # type: ignore[attr-defined]
    yield api_client
