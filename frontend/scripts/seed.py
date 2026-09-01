#!/usr/bin/env python3
"""
Seed the Neon PostgreSQL database with test data matching the Laravel seeders.
This script is idempotent - it skips data that already exists.
Run: python scripts/seed.py
"""

import asyncio
import random
import uuid
from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend_app.core.config import get_settings
from backend_app.core.security import get_password_hash
from backend_app.core.database import Base

settings = get_settings()

REPORTERS = [
    "dr. Siti Aminah", "dr. Budi Santoso", "dr. Rina Wati",
    "dr. Agus Supriyadi", "bid. Dewi Lestari", "dr. Eko Prasetyo",
    "bid. Nurul Hidayah", "dr. Andi Kurniawan", "bid. Maya Sari",
    "dr. Hendra Wijaya",
]

PROVINCE_NAMES = {
    "12": "Sumatera Utara", "31": "DKI Jakarta", "32": "Jawa Barat",
    "33": "Jawa Tengah", "35": "Jawa Timur", "36": "Banten",
    "73": "Sulawesi Selatan", "91": "Papua",
}


async def seed():
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if "?" in url:
        from urllib.parse import urlparse, urlunparse
        parsed = urlparse(url)
        url = urlunparse(parsed._replace(query=""))
    engine = create_async_engine(url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        # --- Check existing counts ---
        counts = {}
        for t in ["provinces", "districts", "subdistricts", "puskesmas", "reportmr", "reportopv", "populations", "users"]:
            counts[t] = (await db.execute(text(f"SELECT COUNT(*) FROM {t}"))).scalar() or 0
        print(f"Existing: {counts}")

        # --- Seed default admin user ---
        if counts["users"] == 0:
            print("\nSeeding default admin user...")
            from backend_app.models.models import User

            default_user = User(
                username="081234567890",
                password=get_password_hash("password"),
                nama="Test User",
                email="admin@dmics.test",
                phone="081234567890",
                province="31",
                kabupaten="Jakarta Pusat",
                position="admin",
                legacy_hash="bcrypt",
            )
            db.add(default_user)
            await db.commit()
            print("  Created default admin: 081234567890 / password")
        else:
            print(f"\nUsers already exist ({counts['users']}), skipping user seed.")

        # --- Seed more subdistricts if sparse ---
        if counts["subdistricts"] < 10:
            print("\nSeeding more subdistricts...")
            result = await db.execute(text("SELECT id, code, name FROM districts"))
            districts = {r[1]: (r[0], r[2]) for r in result.fetchall()}

            sub_map = {
                "3171": ["Menteng", "Tanah Abang", "Senen", "Kramat", "Johar Baru"],
                "3172": ["Pademangan", "Penjaringan", "Tanjung Priok", "Koja", "Cilincing"],
                "3273": ["Bandung Wetan", "Coblong", "Sukasari", "Cibeunying", "Batununggal"],
                "3374": ["Semarang Tengah", "Semarang Utara", "Semarang Selatan", "Gayamsari", "Genuk"],
                "3578": ["Gubeng", "Wonokromo", "Genteng", "Tegalsari", "Banyuanyar"],
                "3671": ["Tangerang", "Batuceper", "Cipondoh", "Karangtanjung", "Cibodas"],
                "1271": ["Medan Baru", "Medan Timur", "Medan Utara", "Medan Selayang", "Medan Johor"],
                "7371": ["Panakkukang", "Tamalate", "Rappocini", "Makassar", "Biringkanaya"],
                "9171": ["Jayapura Utara", "Jayapura Selatan", "Abepura", "Heram", "Muara Tami"],
            }

            # Get existing subdistrict codes
            result = await db.execute(text("SELECT code FROM subdistricts"))
            existing_subs = {r[0] for r in result.fetchall()}

            for dist_code, names in sub_map.items():
                if dist_code not in districts:
                    continue
                did = districts[dist_code][0]
                for i, name in enumerate(names):
                    scode = f"{dist_code}{i + 1:02d}0"
                    if scode in existing_subs:
                        continue
                    await db.execute(text(
                        "INSERT INTO subdistricts (id, code, district_id, name, is_active) "
                        "VALUES (:id, :code, :did, :name, true) ON CONFLICT (code) DO NOTHING"
                    ), {"id": str(uuid.uuid4()), "code": scode, "did": str(did), "name": name})
            await db.commit()

        # --- Seed more puskesmas if sparse ---
        if counts["puskesmas"] < 20:
            print("\nSeeding more puskesmas...")
            result = await db.execute(text("""
                SELECT s.id, s.code, s.name, s.district_id, d.province_id, pr.name as prov_name
                FROM subdistricts s
                LEFT JOIN districts d ON s.district_id = d.id
                LEFT JOIN provinces pr ON d.province_id = pr.id
            """))
            subs = result.fetchall()

            result = await db.execute(text("SELECT code FROM puskesmas"))
            existing_pks = {r[0] for r in result.fetchall()}

            for sub_id, sub_code, sub_name, dist_id, province_id, prov_name in subs:
                if not province_id or not dist_id:
                    continue
                for j in range(2):
                    pkcode = f"{sub_code}{j + 1}"
                    if pkcode in existing_pks:
                        continue
                    suffix = "Pusat" if j == 0 else "Wilayah I"
                    pkname = f"Puskesmas {sub_name} {suffix}"
                    await db.execute(text(
                        "INSERT INTO puskesmas (id, code, name, province_id, district_id, subdistrict_id, address) "
                        "VALUES (:id, :code, :name, :pid, :did, :sid, :addr) ON CONFLICT (code) DO NOTHING"
                    ), {
                        "id": str(uuid.uuid4()), "code": pkcode, "name": pkname,
                        "pid": str(province_id),
                        "did": str(dist_id),
                        "sid": str(sub_id), "addr": f"Jl. Raya {sub_name} No. {(j + 1) * 10}",
                    })
            await db.commit()

        # --- Load puskesmas for report seeding ---
        result = await db.execute(text("""
            SELECT p.code, p.name, s.code as sub_code, pr.code as prov_code, pr.name as prov_name
            FROM puskesmas p
            LEFT JOIN subdistricts s ON p.subdistrict_id = s.id
            LEFT JOIN districts d ON p.district_id = d.id
            LEFT JOIN provinces pr ON d.province_id = pr.id
        """))
        pk_rows = result.fetchall()
        print(f"\nPuskesmas available: {len(pk_rows)}")

        # --- Seed populations ---
        if counts["populations"] < 50:
            print("\nSeeding populations...")
            result = await db.execute(text("SELECT code FROM provinces"))
            prov_codes = [r[0] for r in result.fetchall()]

            result = await db.execute(text("SELECT target_code, campaign_type FROM populations"))
            existing_pops = {(r[0], r[1]) for r in result.fetchall()}

            for prov_code in prov_codes:
                for ct in ["mr", "opv"]:
                    if (prov_code, ct) in existing_pops:
                        continue
                    await db.execute(text(
                        "INSERT INTO populations (id, target_type, target_code, campaign_type, year, total, created_at, updated_at) "
                        "VALUES (:id, 'province', :tc, :ct, 2026, :total, NOW(), NOW())"
                    ), {"id": str(uuid.uuid4()), "tc": prov_code, "ct": ct, "total": random.randint(300000, 1500000)})
            await db.commit()
            print("  Populations seeded.")

        # --- Seed reports ---
        mr_count = (await db.execute(text("SELECT COUNT(*) FROM reportmr"))).scalar() or 0
        opv_count = (await db.execute(text("SELECT COUNT(*) FROM reportopv"))).scalar() or 0

        if mr_count < 100 or opv_count < 100:
            print(f"\nSeeding reports (have {mr_count} MR, {opv_count} OPV)...")
            today = date.today()

            for tname, col_name, ct_val, cnt in [("reportmr", "balita_mr", "mr", mr_count), ("reportopv", "balita_opv", "opv", opv_count)]:
                if cnt >= 100:
                    continue
                rows = []
                for pk_code, pk_name, sub_code, prov_code, prov_name in pk_rows:
                    prov_name = prov_name or "Unknown"
                    for day in range(14):
                        d = today - timedelta(days=day)
                        balita = random.randint(80, 500)
                        reporter = random.choice(REPORTERS)
                        rows.append({
                            "id": str(uuid.uuid4()), "date": d, "sub": sub_code or "",
                            "pk": pk_code, "reporter": reporter, "ch": "dashboard",
                            "prov": prov_name, "dist": f"Kab. {prov_name}",
                            "pkname": pk_name, "val": balita, "ct": ct_val,
                        })
                for i in range(0, len(rows), 500):
                    chunk = rows[i:i + 500]
                    await db.execute(
                        text(f"INSERT INTO {tname} (id, date, subdistrict_code, id_puskesmas, dashboard_reporter, channel, province, district, puskesmas, {col_name}, campaign_type) VALUES (:id, :date, :sub, :pk, :reporter, :ch, :prov, :dist, :pkname, :val, :ct)"),
                        chunk,
                    )
                print(f"  Inserted {len(rows)} {tname} records")
            await db.commit()
        else:
            print("\nReports already sufficient, skipping.")

        # --- Final counts ---
        print("\nFinal counts:")
        for t in ["provinces", "districts", "subdistricts", "puskesmas", "reportmr", "reportopv", "populations", "users"]:
            r = await db.execute(text(f"SELECT COUNT(*) FROM {t}"))
            print(f"  {t}: {r.scalar()}")

        print("\nDone!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
