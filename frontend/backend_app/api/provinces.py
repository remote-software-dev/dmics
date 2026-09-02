from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend_app.core.database import get_db
from backend_app.models.models import Province
from backend_app.schemas.schemas import ProvinceRead

router = APIRouter(prefix="/provinces", tags=["Provinces"])


@router.get(
    "",
    response_model=list[ProvinceRead],
    summary="List all provinces",
    description="Retrieve a list of all provinces with their codes, names, and coordinates.",
)
async def list_provinces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Province).order_by(Province.name))
    return result.scalars().all()


@router.get(
    "/{province_id}",
    response_model=ProvinceRead,
    summary="Get province by ID",
    description="Retrieve a single province by its UUID.",
)
async def get_province(province_id: str, db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    result = await db.execute(select(Province).where(Province.id == UUID(province_id)))
    province = result.scalar_one_or_none()
    if province is None:
        raise HTTPException(status_code=404, detail="Province not found")
    return province
