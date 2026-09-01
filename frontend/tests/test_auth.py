import pytest


@pytest.mark.asyncio
async def test_login_success(client, seed_all):
    response = await client.post("/api/v1/auth/login", json={
        "username": "081234567890",
        "password": "password",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, seed_all):
    response = await client.post("/api/v1/auth/login", json={
        "username": "081234567890",
        "password": "wrongpassword",
    })
    assert response.status_code == 401
    assert "credentials" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_user(client, seed_all):
    response = await client.post("/api/v1/auth/login", json={
        "username": "000000000000",
        "password": "password",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_missing_fields(client):
    response = await client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422
