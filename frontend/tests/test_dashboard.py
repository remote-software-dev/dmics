import pytest


@pytest.mark.asyncio
async def test_dashboard_stats(client, seed_all):
    response = await client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_provinces"] == 8
    assert data["total_districts"] == 8
    assert data["total_puskesmas"] == 8
    assert data["total_mr_reports"] > 0
    assert data["total_opv_reports"] > 0
    assert data["total_reports"] == data["total_mr_reports"] + data["total_opv_reports"]


@pytest.mark.asyncio
async def test_dashboard_coverage(client, seed_all):
    response = await client.get("/api/v1/dashboard/coverage")
    assert response.status_code == 200
    data = response.json()
    assert "mr_coverage" in data
    assert "opv_coverage" in data
    assert data["total_vaccinated_mr"] > 0
    assert data["total_vaccinated_opv"] > 0
    assert data["total_population_mr"] > 0
    assert data["total_population_opv"] > 0
    assert isinstance(data["mr_coverage"], float)
    assert isinstance(data["opv_coverage"], float)


@pytest.mark.asyncio
async def test_dashboard_vaccination_trend(client, seed_all):
    response = await client.get("/api/v1/dashboard/vaccination-trend")
    assert response.status_code == 200
    data = response.json()
    assert "dates" in data
    assert "mr" in data
    assert "opv" in data
    assert len(data["dates"]) > 0
    assert len(data["dates"]) == len(data["mr"])
    assert len(data["dates"]) == len(data["opv"])


@pytest.mark.asyncio
async def test_dashboard_by_province(client, seed_all):
    response = await client.get("/api/v1/dashboard/by-province")
    assert response.status_code == 200
    data = response.json()
    assert "labels" in data
    assert "data" in data
    assert len(data["labels"]) > 0
    assert len(data["labels"]) == len(data["data"])
    assert len(data["labels"]) <= 8


@pytest.mark.asyncio
async def test_recent_mr_reports(client, seed_all):
    response = await client.get("/api/v1/reports/mr/recent")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert data["total"] > 0
    assert len(data["items"]) > 0
    assert len(data["items"]) <= 10


@pytest.mark.asyncio
async def test_recent_opv_reports(client, seed_all):
    response = await client.get("/api/v1/reports/opv/recent")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] > 0


@pytest.mark.asyncio
async def test_create_mr_report(client, seed_all):
    response = await client.post("/api/v1/reports/mr/", json={
        "date": "2026-08-20T00:00:00",
        "subdistrict_code": "3171010",
        "id_puskesmas": "31710101",
        "balita_mr": 150,
        "province": "DKI Jakarta",
        "district": "Jakarta Pusat",
        "puskesmas": "Puskesmas Menteng Pusat",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["balita_mr"] == 150
    assert data["province"] == "DKI Jakarta"


@pytest.mark.asyncio
async def test_create_opv_report(client, seed_all):
    response = await client.post("/api/v1/reports/opv/", json={
        "date": "2026-08-20T00:00:00",
        "subdistrict_code": "3171010",
        "id_puskesmas": "31710101",
        "balita_opv": 120,
        "province": "DKI Jakarta",
        "district": "Jakarta Pusat",
        "puskesmas": "Puskesmas Menteng Pusat",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["balita_opv"] == 120
