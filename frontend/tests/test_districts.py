import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_districts_empty(client: AsyncClient):
    response = await client.get("/api/v1/districts/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_districts(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/districts/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8

    first = data[0]
    for field in ["id", "code", "province_id", "name", "is_active", "latitude", "longitude", "created_at", "updated_at"]:
        assert field in first


@pytest.mark.asyncio
async def test_list_districts_ordered_by_name(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/districts/")
    data = response.json()
    names = [d["name"] for d in data]
    assert names == sorted(names)


@pytest.mark.asyncio
async def test_list_districts_matches_seed_data(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/districts/")
    data = response.json()
    returned_codes = {d["code"] for d in data}
    for code in ["3171", "3273", "3374", "3578", "3671", "1271", "7371", "9171"]:
        assert code in returned_codes

    for d in data:
        assert isinstance(uuid.UUID(d["id"]), uuid.UUID)
        assert isinstance(d["code"], str)
        assert isinstance(uuid.UUID(d["province_id"]), uuid.UUID)
        assert isinstance(d["name"], str)
        assert isinstance(d["is_active"], bool)


@pytest.mark.asyncio
async def test_get_district_by_id(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/districts/")
    data = response.json()
    district_id = data[0]["id"]
    response = await client.get(f"/api/v1/districts/{district_id}")
    assert response.status_code == 200
    assert response.json()["id"] == district_id


@pytest.mark.asyncio
async def test_get_district_by_id_not_found(client: AsyncClient, seed_all):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/districts/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_district_response_schema(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/districts/")
    data = response.json()
    first = data[0]

    required_fields = ["id", "code", "province_id", "name", "is_active"]
    for field in required_fields:
        assert field in first, f"Missing required field: {field}"

    assert isinstance(first["id"], str)
    assert isinstance(first["code"], str)
    assert isinstance(first["province_id"], str)
    assert isinstance(first["name"], str)
    assert isinstance(first["is_active"], bool)


@pytest.mark.asyncio
async def test_district_province_id_valid_uuid(client: AsyncClient, seed_all):
    response = await client.get("/api/v1/districts/")
    data = response.json()

    for d in data:
        province_id = uuid.UUID(d["province_id"])
        assert isinstance(province_id, uuid.UUID)
