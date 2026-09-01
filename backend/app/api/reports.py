import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import ReportMR
from app.schemas.schemas import ReportMRCreate, ReportMRRead

router = APIRouter(prefix="/reports/mr", tags=["Reports"])


@router.get(
    "/",
    response_model=list[ReportMRRead],
    summary="List MR vaccination reports",
    description="Retrieve all Measles-Rubella (MR) vaccination reports.",
)
async def list_mr_reports(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    result = await db.execute(
        select(ReportMR).order_by(ReportMR.date.desc()).offset(offset).limit(size)
    )
    return result.scalars().all()


@router.get(
    "/recent",
    response_model=dict,
    summary="Recent MR reports with pagination",
    description="Returns recent MR reports with total count for the dashboard table.",
)
async def recent_mr_reports(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(ReportMR.id)))).scalar() or 0
    offset = (page - 1) * size
    result = await db.execute(
        select(ReportMR).order_by(ReportMR.date.desc()).offset(offset).limit(size)
    )
    items = result.scalars().all()
    return {
        "items": [ReportMRRead.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get(
    "/{report_id}",
    response_model=ReportMRRead,
    summary="Get MR report by ID",
    description="Retrieve a single MR vaccination report by its UUID.",
)
async def get_mr_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReportMR).where(ReportMR.id == _uuid.UUID(report_id)))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post(
    "/",
    response_model=ReportMRRead,
    status_code=201,
    summary="Create MR report",
    description="Submit a new MR vaccination report.",
)
async def create_mr_report(data: ReportMRCreate, db: AsyncSession = Depends(get_db)):
    report = ReportMR(
        id=_uuid.uuid4(),
        **data.model_dump(),
        channel="dashboard",
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report
