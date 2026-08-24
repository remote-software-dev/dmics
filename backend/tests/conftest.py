import uuid
from datetime import date, timedelta

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app
from app.core.security import get_password_hash

ASYNC_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def async_engine():
    engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def async_session(async_engine):
    session_factory = async_sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def seed_all(async_session: AsyncSession):
    from app.models.models import (
        District, Population, Puskesmas, Province,
        ReportMR, ReportOPV, Subdistrict, User,
    )

    # --- Provinces ---
    provinces = [
        ("31", "DKI Jakarta", -6.2088, 106.8456),
        ("32", "Jawa Barat", -6.9175, 107.6191),
        ("33", "Jawa Tengah", -7.1500, 110.1403),
        ("35", "Jawa Timur", -7.5361, 112.2384),
        ("36", "Banten", -6.4058, 106.0640),
        ("12", "Sumatera Utara", 2.1154, 99.5451),
        ("73", "Sulawesi Selatan", -3.6688, 119.9741),
        ("91", "Papua", -4.2699, 138.0804),
    ]
    prov_ids = {}
    for code, name, lat, lng in provinces:
        pid = uuid.uuid4()
        prov_ids[code] = pid
        async_session.add(Province(id=pid, code=code, name=name, latitude=lat, longitude=lng))
    await async_session.commit()

    # --- Districts (1 per province) ---
    districts = [
        ("3171", "31", "Jakarta Pusat"),
        ("3273", "32", "Kota Bandung"),
        ("3374", "33", "Kota Semarang"),
        ("3578", "35", "Kota Surabaya"),
        ("3671", "36", "Kota Tangerang"),
        ("1271", "12", "Kota Medan"),
        ("7371", "73", "Kota Makassar"),
        ("9171", "91", "Kota Jayapura"),
    ]
    dist_ids = {}
    for code, prov_code, name in districts:
        did = uuid.uuid4()
        dist_ids[code] = did
        async_session.add(District(
            id=did, code=code, province_id=prov_ids[prov_code], name=name,
        ))
    await async_session.commit()

    # --- Subdistricts ---
    subdistricts = [
        ("3171010", "3171", "Menteng"),
        ("3273010", "3273", "Bandung Wetan"),
        ("3374010", "3374", "Semarang Tengah"),
        ("3578010", "3578", "Gubeng"),
        ("3671010", "3671", "Tangerang"),
        ("1271010", "1271", "Medan Baru"),
        ("7371010", "7371", "Panakkukang"),
        ("9171010", "9171", "Jayapura Utara"),
    ]
    sub_ids = {}
    for code, dist_code, name in subdistricts:
        sid = uuid.uuid4()
        sub_ids[code] = sid
        async_session.add(Subdistrict(
            id=sid, code=code, district_id=dist_ids[dist_code], name=name,
        ))
    await async_session.commit()

    # --- Puskesmas ---
    puskesmas = [
        ("31710101", "31", "3171", "3171010", "Puskesmas Menteng Pusat"),
        ("32730101", "32", "3273", "3273010", "Puskesmas Bandung Wetan Pusat"),
        ("33740101", "33", "3374", "3374010", "Puskesmas Semarang Tengah Pusat"),
        ("35780101", "35", "3578", "3578010", "Puskesmas Gubeng Pusat"),
        ("36710101", "36", "3671", "3671010", "Puskesmas Tangerang Pusat"),
        ("12710101", "12", "1271", "1271010", "Puskesmas Medan Baru Pusat"),
        ("73710101", "73", "7371", "7371010", "Puskesmas Panakkukang Pusat"),
        ("91710101", "91", "9171", "9171010", "Puskesmas Jayapura Utara Pusat"),
    ]
    for code, prov_code, dist_code, sub_code, name in puskesmas:
        async_session.add(Puskesmas(
            id=uuid.uuid4(), code=code, name=name,
            province_id=prov_ids[prov_code],
            district_id=dist_ids[dist_code],
            subdistrict_id=sub_ids[sub_code],
        ))
    await async_session.commit()

    # --- Populations ---
    for prov_code in prov_ids:
        async_session.add(Population(
            target_type="province", target_code=prov_code,
            campaign_type="mr", year=2026, total=500000,
        ))
        async_session.add(Population(
            target_type="province", target_code=prov_code,
            campaign_type="opv", year=2026, total=400000,
        ))
    await async_session.commit()

    # --- Reports ---
    today = date.today()
    prov_name_map = {code: name for code, name, _, _ in provinces}
    pk_lookup = {p[0]: p for p in puskesmas}  # code -> tuple

    for pk_code, prov_code, dist_code, sub_code, pk_name in puskesmas:
        prov_name = prov_name_map[prov_code]
        for day_offset in range(14):
            report_date = today - timedelta(days=day_offset)
            async_session.add(ReportMR(
                id=uuid.uuid4(), date=report_date,
                subdistrict_code=sub_code, id_puskesmas=pk_code,
                channel="dashboard", province=prov_name,
                district="Test District", puskesmas=pk_name,
                balita_mr=100 + (day_offset * 10),
                campaign_type="mr",
            ))
            async_session.add(ReportOPV(
                id=uuid.uuid4(), date=report_date,
                subdistrict_code=sub_code, id_puskesmas=pk_code,
                channel="dashboard", province=prov_name,
                district="Test District", puskesmas=pk_name,
                balita_opv=90 + (day_offset * 8),
                campaign_type="opv",
            ))
    await async_session.commit()

    # --- Users ---
    async_session.add(User(
        id=uuid.uuid4(), username="081234567890",
        password=get_password_hash("password"),
        nama="Admin DMICS", province="0", position="admin",
    ))
    async_session.add(User(
        id=uuid.uuid4(), username="081234567891",
        password=get_password_hash("password"),
        nama="Reporter Jakarta", province="31", position="reporter",
    ))
    await async_session.commit()


@pytest_asyncio.fixture(scope="function")
async def client(async_engine) -> AsyncClient:
    session_factory = async_sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
