import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_provinces_empty(client: AsyncClient):
    response = await client.get("/api/v1/provinces/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_provinces(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/provinces/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8

    first = data[0]
    for field in ["id", "code", "name", "is_active", "latitude", "longitude", "created_at", "updated_at"]:
        assert field in first


@pytest.mark.asyncio
async def test_list_provinces_ordered_by_name(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/provinces/")
    data = response.json()
    names = [p["name"] for p in data]
    assert names == sorted(names)


@pytest.mark.asyncio
async def test_list_provinces_matches_seed_data(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/provinces/")
    data = response.json()
    returned_codes = {p["code"] for p in data}
    for code in ["31", "32", "33", "35", "36", "12", "73", "91"]:
        assert code in returned_codes

    for p in data:
        assert isinstance(uuid.UUID(p["id"]), uuid.UUID)
        assert isinstance(p["code"], str)
        assert isinstance(p["name"], str)
        assert isinstance(p["is_active"], bool)


@pytest.mark.asyncio
async def test_get_province_by_id(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/provinces/")
    data = response.json()
    province_id = data[0]["id"]
    response = await client.get(f"/api/v1/provinces/{province_id}")
    assert response.status_code == 200
    assert response.json()["id"] == province_id


@pytest.mark.asyncio
async def test_get_province_by_id_not_found(client: AsyncClient, seed_all):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/provinces/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_province_response_schema(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/provinces/")
    data = response.json()
    first = data[0]

    required_fields = ["id", "code", "name", "is_active"]
    for field in required_fields:
        assert field in first, f"Missing required field: {field}"

    assert isinstance(first["id"], str)
    assert isinstance(first["code"], str)
    assert isinstance(first["name"], str)
    assert isinstance(first["is_active"], bool)
