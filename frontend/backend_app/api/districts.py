from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import District
from app.schemas.schemas import DistrictRead

router = APIRouter(prefix="/districts", tags=["Districts"])


@router.get(
    "/",
    response_model=list[DistrictRead],
    summary="List all districts",
    description="Retrieve a list of all districts with their codes, province references, and coordinates.",
)
async def list_districts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(District).order_by(District.name))
    return result.scalars().all()


@router.get(
    "/{district_id}",
    response_model=DistrictRead,
    summary="Get district by ID",
    description="Retrieve a single district by its UUID.",
)
async def get_district(district_id: str, db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    result = await db.execute(select(District).where(District.id == UUID(district_id)))
    district = result.scalar_one_or_none()
    if district is None:
        raise HTTPException(status_code=404, detail="District not found")
    return district
