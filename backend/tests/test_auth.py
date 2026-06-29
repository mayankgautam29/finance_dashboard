import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup_creates_viewer_role(api_client: AsyncClient):
    res = await api_client.post(
        "/api/auth/signup",
        json={
            "email": "newuser@example.com",
            "password": "secret12",
            "username": "newuser",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["user"]["role"].lower() == "viewer"
    assert "token" in res.cookies


@pytest.mark.asyncio
async def test_signup_rejects_duplicate_email(api_client: AsyncClient):
    payload = {
        "email": "dup@example.com",
        "password": "secret12",
        "username": "dupuser",
    }
    first = await api_client.post("/api/auth/signup", json=payload)
    assert first.status_code == 201

    second = await api_client.post("/api/auth/signup", json=payload)
    assert second.status_code == 400
    assert "already registered" in second.json()["message"].lower()


@pytest.mark.asyncio
async def test_login_returns_cookie(api_client: AsyncClient):
    await api_client.post(
        "/api/auth/signup",
        json={
            "email": "login@example.com",
            "password": "login123",
            "username": "loginuser",
        },
    )
    api_client.cookies.clear()
    res = await api_client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "login123"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "token" in res.cookies


@pytest.mark.asyncio
async def test_login_rejects_invalid_credentials(api_client: AsyncClient):
    res = await api_client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "wrong"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(api_client: AsyncClient):
    res = await api_client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_user_after_login(viewer_client: AsyncClient):
    res = await viewer_client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == viewer_client.test_email  # type: ignore[attr-defined]
    assert res.json()["role"].lower() == "viewer"


@pytest.mark.asyncio
async def test_signup_ignores_admin_role_escalation(api_client: AsyncClient):
    res = await api_client.post(
        "/api/auth/signup",
        json={
            "email": "escalate@example.com",
            "password": "secret12",
            "username": "escalate",
            "role": "admin",
        },
    )
    assert res.status_code == 201
    assert res.json()["user"]["role"].lower() == "viewer"
