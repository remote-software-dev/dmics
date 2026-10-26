#!/usr/bin/env python3
"""
Seed the database with realistic vaccination report data for AI feature testing.

The script clears the existing report tables before inserting new data, so it is
safe to run repeatedly without creating duplicates. Reports are distributed
across every province, district, and puskesmas already present in the database.

Run:
    poetry run python scripts/seed.py --reports 10000 --batch-size 500
"""

import argparse
import asyncio
import os
import random
import ssl
import sys
import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from urllib.parse import urlparse, urlunparse

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend_app.core.config import get_settings
from backend_app.core.security import get_password_hash
from backend_app.models.models import (
    District,
    Population,
    Province,
    Puskesmas,
    ReportMR,
    ReportOPV,
    Subdistrict,
    User,
)

settings = get_settings()

REPORTERS = [
    "dr. Siti Aminah", "dr. Budi Santoso", "dr. Rina Wati",
    "dr. Agus Supriyadi", "bid. Dewi Lestari", "dr. Eko Prasetyo",
    "bid. Nurul Hidayah", "dr. Andi Kurniawan", "bid. Maya Sari",
    "dr. Hendra Wijaya", "dr. Putri Rahayu", "bid. Ani Susanti",
]

CAMPAIGNS = (
    ("mr", ReportMR, "balita_mr"),
    ("opv", ReportOPV, "balita_opv"),
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed realistic vaccination reports for AI testing.",
    )
    parser.add_argument(
        "--reports",
        type=int,
        default=10000,
        help="Number of reports to create (default: 10000 total across MR and OPV).",
    )
    parser.add_argument(
        "--per-campaign",
        action="store_true",
        help="Treat --reports as the count per campaign instead of the total.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Rows per bulk insert batch (default: 500).",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=365,
        help="Size of the reporting window in days, 180-365 (default: 365).",
    )
    parser.add_argument(
        "--anomaly-rate",
        type=float,
        default=0.01,
        help="Fraction of anomalous reports, split between 0%% and >100%% coverage (default: 0.01).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducible data (default: 42).",
    )
    args = parser.parse_args()

    if args.reports < 1:
        parser.error("--reports must be at least 1")
    if not 1 <= args.batch_size <= 5000:
        parser.error("--batch-size must be between 1 and 5000")
    if not 180 <= args.days <= 365:
        parser.error("--days must be between 180 and 365")
    if not 0 <= args.anomaly_rate <= 1:
        parser.error("--anomaly-rate must be between 0 and 1")

    return args


def _build_engine():
    url = settings.DATABASE_URL
    if not url:
        raise SystemExit(
            "DATABASE_URL is not set. Set DATABASE_URL or POSTGRES_URL before running the seeder."
        )

    use_ssl = "neon.tech" in url or "sslmode" in url

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if not url.startswith("sqlite") and "?" in url:
        parsed = urlparse(url)
        url = urlunparse(parsed._replace(query=""))

    engine_kwargs = {"echo": False, "pool_pre_ping": True}
    if url.startswith("sqlite"):
        pass
    else:
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 2
        if use_ssl:
            engine_kwargs["connect_args"] = {"ssl": ssl.create_default_context()}

    return create_async_engine(url, **engine_kwargs)


async def _ensure_admin_user(db: AsyncSession) -> None:
    count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    if count:
        return

    db.add(
        User(
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
    )
    await db.flush()
    print("Created default admin: 081234567890 / password")


async def _load_geography(db: AsyncSession) -> dict[str, list[dict]]:
    stmt = (
        select(
            Province.code.label("province_code"),
            Province.name.label("province_name"),
            District.name.label("district_name"),
            Subdistrict.code.label("subdistrict_code"),
            Puskesmas.code.label("puskesmas_code"),
            Puskesmas.name.label("puskesmas_name"),
        )
        .join(District, Puskesmas.district_id == District.id)
        .join(Province, Puskesmas.province_id == Province.id)
        .join(Subdistrict, Puskesmas.subdistrict_id == Subdistrict.id)
        .order_by(Province.code, District.code, Puskesmas.code)
    )

    rows = (await db.execute(stmt)).mappings().all()
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[row["province_code"]].append(dict(row))
    return dict(grouped)


async def _load_population_map(db: AsyncSession) -> dict[tuple[str, str], int]:
    stmt = select(
        Population.target_code,
        Population.campaign_type,
        Population.total,
        Population.year,
    ).where(Population.target_type == "province")

    rows = (await db.execute(stmt)).all()
    latest: dict[tuple[str, str], tuple[int, int]] = {}
    for target_code, campaign_type, total, year in rows:
        if not target_code or not campaign_type:
            continue
        key = (target_code, campaign_type)
        candidate = (year or 0, int(total or 0))
        if key not in latest or candidate[0] > latest[key][0]:
            latest[key] = candidate

    return {key: value[1] for key, value in latest.items()}


async def _ensure_populations(
    db: AsyncSession,
    geography: dict[str, list[dict]],
    rng: random.Random,
) -> dict[tuple[str, str], int]:
    populations = await _load_population_map(db)
    current_year = date.today().year
    added = 0

    for province_code, puskesmas_rows in sorted(geography.items()):
        for campaign, _, _ in CAMPAIGNS:
            key = (province_code, campaign)
            if key in populations:
                continue

            total = rng.randint(300_000, 1_500_000)
            db.add(
                Population(
                    id=uuid.uuid4(),
                    target_type="province",
                    target_code=province_code,
                    campaign_type=campaign,
                    year=current_year,
                    total=total,
                )
            )
            populations[key] = total
            added += 1

    if added:
        await db.flush()
        print(f"Created {added} missing province-level population target(s).")

    return populations


def _allocate(total: int, keys, rng: random.Random) -> dict[str, int]:
    ordered = sorted(keys)
    if not ordered:
        return {}

    base, remainder = divmod(total, len(ordered))
    counts = {key: base for key in ordered}
    if remainder:
        for key in rng.sample(ordered, remainder):
            counts[key] += 1
    return counts


def _sample_dates(rng: random.Random, count: int, days: int) -> list[date]:
    end = date.today()
    start = end - timedelta(days=days - 1)
    span = (end - start).days + 1

    if count <= span:
        offsets = rng.sample(range(span), count)
    else:
        offsets = [rng.randrange(span) for _ in range(count)]

    return sorted(start + timedelta(days=offset) for offset in offsets)


def _iter_report_rows(
    campaign: str,
    column: str,
    total: int,
    geography: dict[str, list[dict]],
    populations: dict[tuple[str, str], int],
    args: argparse.Namespace,
    rng: random.Random,
    stats: dict,
):
    province_counts = _allocate(total, geography.keys(), rng)

    for province_code in sorted(geography):
        puskesmas_rows = geography[province_code]
        province_total = populations.get((province_code, campaign)) or 500_000
        puskesmas_counts = _allocate(
            province_counts[province_code],
            [row["puskesmas_code"] for row in puskesmas_rows],
            rng,
        )
        province_coverage = rng.triangular(0.38, 0.90, 0.68)

        for row in puskesmas_rows:
            report_count = puskesmas_counts[row["puskesmas_code"]]
            if report_count == 0:
                continue

            per_report_target = province_total / (len(puskesmas_rows) * report_count)
            for report_date in _sample_dates(rng, report_count, args.days):
                anomalous = rng.random() < args.anomaly_rate
                if anomalous:
                    if rng.random() < 0.5:
                        coverage = 0.0
                        stats["zero"] += 1
                    else:
                        coverage = rng.uniform(1.05, 1.60)
                        stats["high"] += 1
                else:
                    coverage = rng.triangular(0.30, 0.95, province_coverage)

                value = 0 if coverage == 0 else max(1, int(round(per_report_target * coverage)))
                report_at = datetime.combine(
                    report_date,
                    time(hour=rng.randint(8, 17), minute=rng.randint(0, 59)),
                )

                stats["count"] += 1
                stats["coverage_sum"] += coverage
                stats["coverage_min"] = min(stats["coverage_min"], coverage)
                stats["coverage_max"] = max(stats["coverage_max"], coverage)
                stats["earliest"] = min(stats["earliest"], report_at)
                stats["latest"] = max(stats["latest"], report_at)

                yield {
                    "id": uuid.uuid4(),
                    "date": report_at,
                    "subdistrict_code": row["subdistrict_code"],
                    "id_puskesmas": row["puskesmas_code"],
                    "dashboard_reporter": rng.choice(REPORTERS),
                    "channel": "dashboard",
                    "province": row["province_name"],
                    "district": row["district_name"],
                    "puskesmas": row["puskesmas_name"],
                    column: value,
                    "campaign_type": campaign,
                }


async def _insert_in_batches(
    db: AsyncSession,
    model,
    rows,
    batch_size: int,
) -> int:
    batch: list[dict] = []
    inserted = 0

    for row in rows:
        batch.append(row)
        if len(batch) >= batch_size:
            await db.run_sync(
                lambda sync_session, payload=batch: sync_session.bulk_insert_mappings(
                    model, payload
                )
            )
            inserted += len(batch)
            batch.clear()

    if batch:
        await db.run_sync(
            lambda sync_session, payload=batch: sync_session.bulk_insert_mappings(
                model, payload
            )
        )
        inserted += len(batch)

    return inserted


async def _clear_reports(db: AsyncSession) -> None:
    mr_deleted = (await db.execute(delete(ReportMR))).rowcount or 0
    opv_deleted = (await db.execute(delete(ReportOPV))).rowcount or 0
    print(f"Cleared existing reports: {mr_deleted} MR, {opv_deleted} OPV.")


async def _seed_reports(
    db: AsyncSession,
    geography: dict[str, list[dict]],
    populations: dict[tuple[str, str], int],
    args: argparse.Namespace,
    rng: random.Random,
) -> dict[str, dict]:
    if args.per_campaign:
        campaign_totals = {campaign: args.reports for campaign, _, _ in CAMPAIGNS}
    else:
        campaign_totals = _allocate(args.reports, [campaign for campaign, _, _ in CAMPAIGNS], rng)

    all_stats: dict[str, dict] = {}

    for campaign, model, column in CAMPAIGNS:
        stats = {
            "count": 0,
            "zero": 0,
            "high": 0,
            "coverage_sum": 0.0,
            "coverage_min": float("inf"),
            "coverage_max": float("-inf"),
            "earliest": datetime.max,
            "latest": datetime.min,
        }
        rows = _iter_report_rows(
            campaign,
            column,
            campaign_totals[campaign],
            geography,
            populations,
            args,
            rng,
            stats,
        )
        inserted = await _insert_in_batches(db, model, rows, args.batch_size)
        all_stats[campaign] = stats

        if stats["count"]:
            average_coverage = stats["coverage_sum"] / stats["count"]
            print(
                f"Inserted {inserted} {campaign.upper()} reports "
                f"(coverage {stats['coverage_min'] * 100:.1f}%-{stats['coverage_max'] * 100:.1f}%, "
                f"avg {average_coverage * 100:.1f}%; anomalies: "
                f"{stats['zero']} zero, {stats['high']} over 100%)."
            )
        else:
            print(f"Inserted 0 {campaign.upper()} reports.")

    return all_stats


async def _print_final_counts(db: AsyncSession) -> None:
    print("\nFinal counts:")
    for model in (
        Province,
        District,
        Subdistrict,
        Puskesmas,
        ReportMR,
        ReportOPV,
        Population,
        User,
    ):
        count = (
            await db.execute(select(func.count()).select_from(model))
        ).scalar() or 0
        print(f"  {model.__tablename__}: {count}")


async def seed(args: argparse.Namespace) -> None:
    rng = random.Random(args.seed)
    engine = _build_engine()
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with session_factory() as db:
            await _ensure_admin_user(db)

            geography = await _load_geography(db)
            if not geography:
                raise SystemExit(
                    "No puskesmas found. Seed the geographic hierarchy first, for example:\n"
                    "  poetry run python scripts/seed_province_reports.py"
                )

            province_count = len(geography)
            puskesmas_count = sum(len(rows) for rows in geography.values())
            print(
                f"Loaded {province_count} provinces and {puskesmas_count} puskesmas "
                f"for the last {args.days} days."
            )

            populations = await _ensure_populations(db, geography, rng)
            await _clear_reports(db)

            stats = await _seed_reports(db, geography, populations, args, rng)
            await db.commit()

            total_reports = sum(item["count"] for item in stats.values())
            earliest = min(item["earliest"] for item in stats.values() if item["count"])
            latest = max(item["latest"] for item in stats.values() if item["count"])
            print(
                f"\nSeeded {total_reports} reports from "
                f"{earliest.date()} to {latest.date()}."
            )
            await _print_final_counts(db)
    finally:
        await engine.dispose()


def main() -> None:
    asyncio.run(seed(_parse_args()))


if __name__ == "__main__":
    main()
