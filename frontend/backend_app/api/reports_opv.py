import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend_app.core.database import get_db
from backend_app.models.models import ReportOPV
from backend_app.schemas.schemas import ReportOPVCreate, ReportOPVRead

router = APIRouter(prefix="/reports/opv", tags=["Reports"])


@router.get(
    "",
    response_model=list[ReportOPVRead],
    summary="List OPV vaccination reports",
    description="Retrieve all Oral Polio Vaccine (OPV) vaccination reports.",
)
async def list_opv_reports(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    result = await db.execute(
        select(ReportOPV).order_by(ReportOPV.date.desc()).offset(offset).limit(size)
    )
    return result.scalars().all()


@router.get(
    "/recent",
    response_model=dict,
    summary="Recent OPV reports with pagination",
    description="Returns recent OPV reports with total count for the dashboard table.",
)
async def recent_opv_reports(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(ReportOPV.id)))).scalar() or 0
    offset = (page - 1) * size
    result = await db.execute(
        select(ReportOPV).order_by(ReportOPV.date.desc()).offset(offset).limit(size)
    )
    items = result.scalars().all()
    return {
        "items": [ReportOPVRead.model_validate(i).model_dump() for i in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get(
    "/{report_id}",
    response_model=ReportOPVRead,
    summary="Get OPV report by ID",
    description="Retrieve a single OPV vaccination report by its UUID.",
)
async def get_opv_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReportOPV).where(ReportOPV.id == _uuid.UUID(report_id)))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post(
    "",
    response_model=ReportOPVRead,
    status_code=201,
    summary="Create OPV report",
    description="Submit a new OPV vaccination report.",
)
async def create_opv_report(data: ReportOPVCreate, db: AsyncSession = Depends(get_db)):
    report = ReportOPV(
        id=_uuid.uuid4(),
        **data.model_dump(),
        channel="dashboard",
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report
