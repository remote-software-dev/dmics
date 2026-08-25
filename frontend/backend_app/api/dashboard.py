from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend_app.core.database import get_db
from backend_app.schemas.schemas import (
    CoverageData,
    DashboardStats,
    ProvinceChartData,
    VaccinationTrend,
)
from backend_app.services.dashboard import (
    get_by_province,
    get_coverage,
    get_dashboard_stats,
    get_vaccination_trend,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Dashboard statistics",
    description="Returns total provinces, districts, puskesmas, and report counts.",
)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    return await get_dashboard_stats(db)


@router.get(
    "/coverage",
    response_model=CoverageData,
    summary="Vaccination coverage",
    description="Returns MR and OPV coverage percentages with vaccinated and population counts.",
)
async def dashboard_coverage(db: AsyncSession = Depends(get_db)):
    return await get_coverage(db)


@router.get(
    "/vaccination-trend",
    response_model=VaccinationTrend,
    summary="Vaccination trend",
    description="Returns last 14 days of MR vs OPV data for the line chart.",
)
async def dashboard_trend(db: AsyncSession = Depends(get_db)):
    return await get_vaccination_trend(db)


@router.get(
    "/by-province",
    response_model=ProvinceChartData,
    summary="By province",
    description="Returns top provinces by MR report count for the bar chart.",
)
async def dashboard_by_province(db: AsyncSession = Depends(get_db)):
    return await get_by_province(db)
