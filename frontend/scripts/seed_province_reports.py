#!/usr/bin/env python3
"""
Seed province-level MR and OPV vaccination report data.

Creates 12 Indonesian provinces with full geographic hierarchy
(districts, subdistricts, puskesmas) and populates report tables
with realistic vaccination data.

Run: python scripts/seed_province_reports.py
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

settings = get_settings()

PROVINCES = [
    {"code": "11", "name": "Aceh",              "lat":  4.6951, "lon": 96.7494},
    {"code": "12", "name": "Sumatera Utara",     "lat":  2.1154, "lon": 99.5451},
    {"code": "13", "name": "Sumatera Barat",     "lat": -0.7399, "lon": 100.8000},
    {"code": "14", "name": "Riau",               "lat":  1.7300, "lon": 102.5000},
    {"code": "31", "name": "DKI Jakarta",        "lat": -6.2088, "lon": 106.8456},
    {"code": "32", "name": "Jawa Barat",         "lat": -6.9175, "lon": 107.6191},
    {"code": "33", "name": "Jawa Tengah",        "lat": -7.1510, "lon": 110.1403},
    {"code": "34", "name": "DI Yogyakarta",      "lat": -7.7956, "lon": 110.3695},
    {"code": "35", "name": "Jawa Timur",         "lat": -7.5361, "lon": 112.2384},
    {"code": "36", "name": "Banten",             "lat": -6.4058, "lon": 106.0640},
    {"code": "51", "name": "Bali",               "lat": -8.3405, "lon": 115.0920},
    {"code": "73", "name": "Sulawesi Selatan",   "lat": -3.6688, "lon": 119.9741},
]

DISTRICTS = {
    "11": [{"code": "1101", "name": "Kab. Aceh Selatan"}, {"code": "1102", "name": "Kab. Aceh Tengah"}],
    "12": [{"code": "1201", "name": "Kab. Tapanuli Selatan"}, {"code": "1202", "name": "Kab. Karo"}],
    "13": [{"code": "1301", "name": "Kab. Mentawai"}, {"code": "1302", "name": "Kab. Pesisir Selatan"}],
    "14": [{"code": "1401", "name": "Kab. Kuantan Singingi"}, {"code": "1402", "name": "Kab. Rokan Hilir"}],
    "31": [{"code": "3171", "name": "Jakarta Pusat"}, {"code": "3172", "name": "Jakarta Utara"}],
    "32": [{"code": "3201", "name": "Kab. Bogor"}, {"code": "3202", "name": "Kab. Sukabumi"}],
    "33": [{"code": "3301", "name": "Kab. Cilacap"}, {"code": "3302", "name": "Kab. Banyumas"}],
    "34": [{"code": "3401", "name": "Kab. Kulon Progo"}, {"code": "3402", "name": "Kab. Bantul"}],
    "35": [{"code": "3501", "name": "Kab. Gresik"}, {"code": "3502", "name": "Kab. Sidoarjo"}],
    "36": [{"code": "3601", "name": "Kab. Pandeglang"}, {"code": "3602", "name": "Kab. Serang"}],
    "51": [{"code": "5101", "name": "Kab. Jembrana"}, {"code": "5102", "name": "Kab. Tabanan"}],
    "73": [{"code": "7301", "name": "Kab. Maros"}, {"code": "7302", "name": "Kab. Takalar"}],
}

SUBDISTRICTS = {
    "1101": ["Tapian Tuan", "Mata Usman", "Labuhan Haji"],
    "1102": ["Pintu Rime Gayo", "Bintang", "Atu Lintang"],
    "1201": ["Angkola Barat", "Batang Angkola", "Sayur Matinggi"],
    "1202": ["Tiga Binanga", "Juhar", "Munte"],
    "1301": ["Sipora Utara", "Siberut Utara", "Siberut Selatan"],
    "1302": ["Lengayang", "Sutera", "Linggo Sari Baganti"],
    "1401": ["Kuantan Tengah", "Singingi", "Cerenti"],
    "1402": ["Bagansiapiapi", "Bangko", "Rimba Melintang"],
    "3171": ["Menteng", "Tanah Abang", "Senen"],
    "3172": ["Pademangan", "Penjaringan", "Tanjung Priok"],
    "3201": ["Bogor Barat", "Bogor Tengah", "Bogor Timur"],
    "3202": ["Sukabumi Kota", "Cibeureum", "Lembursitu"],
    "3301": ["Cilacap Tengah", "Cilacap Utara", "Kesugihan"],
    "3302": ["Purwokerto Timur", "Purwokerto Barat", "Cilongok"],
    "3401": ["Temon", "Wates", "Panjatan"],
    "3402": ["Bantul", "Sewon", "Banguntapan"],
    "3501": ["Gresik", "Bungah", "Menganti"],
    "3502": ["Sidoarjo", "Taman", "Waru"],
    "3601": ["Pandeglang", "Cadasari", "Cisata"],
    "3602": ["Serang", "Kasemen", "Cipocut Jaya"],
    "5101": ["Negara", "Mendoyo", "Pekutatan"],
    "5102": ["Tabanan", "Kediri", "Penebel"],
    "7301": ["Maros", "Bontoa", "Mandai"],
    "7302": ["Takalar", "Mangarabombang", "Galesong"],
}

REPORTERS = [
    "dr. Siti Aminah", "dr. Budi Santoso", "dr. Rina Wati",
    "dr. Agus Supriyadi", "bid. Dewi Lestari", "dr. Eko Prasetyo",
    "bid. Nurul Hidayah", "dr. Andi Kurniawan", "bid. Maya Sari",
    "dr. Hendra Wijaya", "dr. Putri Rahayu", "bid. Ani Susanti",
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        # --- Check existing counts ---
        counts = {}
        for t in ["provinces", "districts", "subdistricts", "puskesmas", "reportmr", "reportopv"]:
            counts[t] = (await db.execute(text(f"SELECT COUNT(*) FROM {t}"))).scalar() or 0
        print(f"Existing: {counts}")

        # --- Seed provinces ---
        if counts["provinces"] < len(PROVINCES):
            print("\nSeeding provinces...")
            existing_codes = set()
            if counts["provinces"] > 0:
                result = await db.execute(text("SELECT code FROM provinces"))
                existing_codes = {r[0] for r in result.fetchall()}

            for p in PROVINCES:
                if p["code"] in existing_codes:
                    continue
                await db.execute(text(
                    "INSERT INTO provinces (id, code, name, latitude, longitude, is_active, created_at, updated_at) "
                    "VALUES (:id, :code, :name, :lat, :lon, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING"
                ), {"id": str(uuid.uuid4()), "code": p["code"], "name": p["name"],
                    "lat": p["lat"], "lon": p["lon"]})
            await db.commit()
            print(f"  Provinces seeded (have {len(existing_codes)} existing).")
        else:
            print(f"\nProvinces already sufficient ({counts['provinces']}), skipping.")

        # --- Seed districts ---
        print("\nSeeding districts...")
        result = await db.execute(text("SELECT id, code FROM provinces"))
        prov_map = {r[1]: r[0] for r in result.fetchall()}

        result = await db.execute(text("SELECT code FROM districts"))
        existing_dists = {r[0] for r in result.fetchall()}

        for prov_code, districts in DISTRICTS.items():
            if prov_code not in prov_map:
                continue
            prov_id = prov_map[prov_code]
            for d in districts:
                if d["code"] in existing_dists:
                    continue
                await db.execute(text(
                    "INSERT INTO districts (id, code, province_id, name, is_active, created_at, updated_at) "
                    "VALUES (:id, :code, :pid, :name, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING"
                ), {"id": str(uuid.uuid4()), "code": d["code"], "pid": str(prov_id), "name": d["name"]})
        await db.commit()
        print("  Districts seeded.")

        # --- Seed subdistricts ---
        print("\nSeeding subdistricts...")
        result = await db.execute(text("SELECT id, code FROM districts"))
        dist_map = {r[1]: r[0] for r in result.fetchall()}

        result = await db.execute(text("SELECT code FROM subdistricts"))
        existing_subs = {r[0] for r in result.fetchall()}

        for dist_code, sub_names in SUBDISTRICTS.items():
            if dist_code not in dist_map:
                continue
            did = dist_map[dist_code]
            for i, name in enumerate(sub_names):
                scode = f"{dist_code}{i + 1:02d}0"
                if scode in existing_subs:
                    continue
                await db.execute(text(
                    "INSERT INTO subdistricts (id, code, district_id, name, is_active, created_at, updated_at) "
                    "VALUES (:id, :code, :did, :name, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING"
                ), {"id": str(uuid.uuid4()), "code": scode, "did": str(did), "name": name})
        await db.commit()
        print("  Subdistricts seeded.")

        # --- Seed puskesmas ---
        print("\nSeeding puskesmas...")
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
            pkcode = f"{sub_code}01"
            if pkcode in existing_pks:
                continue
            pkname = f"Puskesmas {sub_name}"
            await db.execute(text(
                "INSERT INTO puskesmas (id, code, name, province_id, district_id, subdistrict_id, address, created_at, updated_at) "
                "VALUES (:id, :code, :name, :pid, :did, :sid, :addr, NOW(), NOW()) ON CONFLICT (code) DO NOTHING"
            ), {
                "id": str(uuid.uuid4()), "code": pkcode, "name": pkname,
                "pid": str(province_id), "did": str(dist_id), "sid": str(sub_id),
                "addr": f"Jl. Raya {sub_name} No. 10",
            })
        await db.commit()
        print("  Puskesmas seeded.")

        # --- Load puskesmas with district names for report seeding ---
        result = await db.execute(text("""
            SELECT p.code, p.name, s.code as sub_code, pr.code as prov_code,
                   pr.name as prov_name, d.name as dist_name
            FROM puskesmas p
            LEFT JOIN subdistricts s ON p.subdistrict_id = s.id
            LEFT JOIN districts d ON p.district_id = d.id
            LEFT JOIN provinces pr ON d.province_id = pr.id
        """))
        pk_rows = result.fetchall()
        print(f"\nPuskesmas available for reports: {len(pk_rows)}")

        if not pk_rows:
            print("  No puskesmas found. Aborting report seed.")
            await engine.dispose()
            return

        # --- Find provinces missing reports ---
        result = await db.execute(text("SELECT DISTINCT province FROM reportmr"))
        mr_prov_set = {r[0] for r in result.fetchall()}
        result = await db.execute(text("SELECT DISTINCT province FROM reportopv"))
        opv_prov_set = {r[0] for r in result.fetchall()}

        mr_missing = {row[4] for row in pk_rows if row[4] and row[4] not in mr_prov_set}
        opv_missing = {row[4] for row in pk_rows if row[4] and row[4] not in opv_prov_set}

        mr_count = (await db.execute(text("SELECT COUNT(*) FROM reportmr"))).scalar() or 0
        opv_count = (await db.execute(text("SELECT COUNT(*) FROM reportopv"))).scalar() or 0

        need_mr = mr_count < 50 or mr_missing
        need_opv = opv_count < 50 or opv_missing

        # --- Seed MR reports ---
        if need_mr:
            print(f"\nSeeding MR reports (have {mr_count}, missing provinces: {mr_missing or 'none'})...")
            today = date.today()
            rows = []
            for pk_code, pk_name, sub_code, prov_code, prov_name, dist_name in pk_rows:
                prov_name = prov_name or "Unknown"
                dist_name = dist_name or "Unknown"
                if mr_missing and prov_name not in mr_missing and mr_count >= 50:
                    continue
                for day_offset in range(14):
                    d = today - timedelta(days=day_offset)
                    balita = random.randint(100, 500)
                    reporter = random.choice(REPORTERS)
                    rows.append({
                        "id": str(uuid.uuid4()), "date": d,
                        "sub": sub_code or "", "pk": pk_code,
                        "reporter": reporter, "ch": "dashboard",
                        "prov": prov_name,
                        "dist": dist_name,
                        "pkname": pk_name, "val": balita, "ct": "mr",
                    })
            for i in range(0, len(rows), 500):
                chunk = rows[i:i + 500]
                await db.execute(
                    text("INSERT INTO reportmr (id, date, subdistrict_code, id_puskesmas, dashboard_reporter, channel, province, district, puskesmas, balita_mr, campaign_type) VALUES (:id, :date, :sub, :pk, :reporter, :ch, :prov, :dist, :pkname, :val, :ct)"),
                    chunk,
                )
            await db.commit()
            print(f"  Inserted {len(rows)} MR report records.")
        else:
            print(f"\nMR reports already sufficient ({mr_count}), skipping.")

        # --- Seed OPV reports ---
        if need_opv:
            print(f"\nSeeding OPV reports (have {opv_count}, missing provinces: {opv_missing or 'none'})...")
            today = date.today()
            rows = []
            for pk_code, pk_name, sub_code, prov_code, prov_name, dist_name in pk_rows:
                prov_name = prov_name or "Unknown"
                dist_name = dist_name or "Unknown"
                if opv_missing and prov_name not in opv_missing and opv_count >= 50:
                    continue
                for day_offset in range(14):
                    d = today - timedelta(days=day_offset)
                    balita = random.randint(100, 500)
                    reporter = random.choice(REPORTERS)
                    rows.append({
                        "id": str(uuid.uuid4()), "date": d,
                        "sub": sub_code or "", "pk": pk_code,
                        "reporter": reporter, "ch": "dashboard",
                        "prov": prov_name,
                        "dist": dist_name,
                        "pkname": pk_name, "val": balita, "ct": "opv",
                    })
            for i in range(0, len(rows), 500):
                chunk = rows[i:i + 500]
                await db.execute(
                    text("INSERT INTO reportopv (id, date, subdistrict_code, id_puskesmas, dashboard_reporter, channel, province, district, puskesmas, balita_opv, campaign_type) VALUES (:id, :date, :sub, :pk, :reporter, :ch, :prov, :dist, :pkname, :val, :ct)"),
                    chunk,
                )
            await db.commit()
            print(f"  Inserted {len(rows)} OPV report records.")
        else:
            print(f"\nOPV reports already sufficient ({opv_count}), skipping.")

        # --- Final counts ---
        print("\nFinal counts:")
        for t in ["provinces", "districts", "subdistricts", "puskesmas", "reportmr", "reportopv"]:
            r = await db.execute(text(f"SELECT COUNT(*) FROM {t}"))
            print(f"  {t}: {r.scalar()}")

        print("\nDone!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
