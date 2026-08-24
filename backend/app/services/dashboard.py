from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import District, Population, Puskesmas, Province, ReportMR, ReportOPV


async def get_dashboard_stats(db: AsyncSession) -> dict:
    provinces = (await db.execute(select(func.count(Province.id)))).scalar() or 0
    districts = (await db.execute(select(func.count(District.id)))).scalar() or 0
    puskesmas = (await db.execute(select(func.count(Puskesmas.id)))).scalar() or 0
    mr_reports = (await db.execute(select(func.count(ReportMR.id)))).scalar() or 0
    opv_reports = (await db.execute(select(func.count(ReportOPV.id)))).scalar() or 0

    return {
        "total_provinces": provinces,
        "total_districts": districts,
        "total_puskesmas": puskesmas,
        "total_reports": mr_reports + opv_reports,
        "total_mr_reports": mr_reports,
        "total_opv_reports": opv_reports,
    }


async def get_coverage(db: AsyncSession) -> dict:
    total_vaccinated_mr = (
        await db.execute(select(func.coalesce(func.sum(ReportMR.balita_mr), 0)))
    ).scalar() or 0

    total_vaccinated_opv = (
        await db.execute(select(func.coalesce(func.sum(ReportOPV.balita_opv), 0)))
    ).scalar() or 0

    total_population_mr = (
        await db.execute(
            select(func.coalesce(func.sum(Population.total), 0)).where(
                Population.campaign_type == "mr"
            )
        )
    ).scalar() or 0

    total_population_opv = (
        await db.execute(
            select(func.coalesce(func.sum(Population.total), 0)).where(
                Population.campaign_type == "opv"
            )
        )
    ).scalar() or 0

    mr_coverage = (
        round((total_vaccinated_mr / total_population_mr) * 100, 1)
        if total_population_mr > 0
        else 0
    )
    opv_coverage = (
        round((total_vaccinated_opv / total_population_opv) * 100, 1)
        if total_population_opv > 0
        else 0
    )

    return {
        "mr_coverage": mr_coverage,
        "opv_coverage": opv_coverage,
        "total_vaccinated_mr": total_vaccinated_mr,
        "total_vaccinated_opv": total_vaccinated_opv,
        "total_population_mr": total_population_mr,
        "total_population_opv": total_population_opv,
    }


async def get_vaccination_trend(db: AsyncSession, days: int = 14) -> dict:
    today = date.today()
    start_date = today - timedelta(days=days)

    mr_rows = (
        await db.execute(
            select(
                ReportMR.date,
                func.sum(ReportMR.balita_mr).label("total"),
            )
            .where(ReportMR.date >= start_date)
            .group_by(ReportMR.date)
            .order_by(ReportMR.date)
        )
    ).all()

    opv_rows = (
        await db.execute(
            select(
                ReportOPV.date,
                func.sum(ReportOPV.balita_opv).label("total"),
            )
            .where(ReportOPV.date >= start_date)
            .group_by(ReportOPV.date)
            .order_by(ReportOPV.date)
        )
    ).all()

    mr_by_date = {}
    for row in mr_rows:
        d = row[0]
        if hasattr(d, "date"):
            d = d.date()
        mr_by_date[str(d)] = row[1]

    opv_by_date = {}
    for row in opv_rows:
        d = row[0]
        if hasattr(d, "date"):
            d = d.date()
        opv_by_date[str(d)] = row[1]

    all_dates = sorted(set(list(mr_by_date.keys()) + list(opv_by_date.keys())))

    from datetime import datetime as dt

    dates = []
    mr_data = []
    opv_data = []
    for d in all_dates:
        parsed = dt.strptime(d, "%Y-%m-%d")
        dates.append(parsed.strftime("%d %b"))
        mr_data.append(mr_by_date.get(d, 0))
        opv_data.append(opv_by_date.get(d, 0))

    return {"dates": dates, "mr": mr_data, "opv": opv_data}


async def get_by_province(db: AsyncSession, limit: int = 8) -> dict:
    rows = (
        await db.execute(
            select(
                ReportMR.province,
                func.sum(ReportMR.balita_mr).label("total"),
            )
            .group_by(ReportMR.province)
            .order_by(func.sum(ReportMR.balita_mr).desc())
            .limit(limit)
        )
    ).all()

    return {
        "labels": [r[0] or "Unknown" for r in rows],
        "data": [r[1] or 0 for r in rows],
    }
