from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend_app.core.database import get_db
from backend_app.models.models import Subdistrict
from backend_app.schemas.schemas import SubdistrictCreate, SubdistrictRead, SubdistrictUpdate

router = APIRouter(prefix="/subdistricts", tags=["Subdistricts"])


@router.get("", response_model=list[SubdistrictRead], summary="List all subdistricts")
async def list_subdistricts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subdistrict).order_by(Subdistrict.name))
    return result.scalars().all()


@router.get("/{subdistrict_id}", response_model=SubdistrictRead, summary="Get subdistrict by ID")
async def get_subdistrict(subdistrict_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subdistrict).where(Subdistrict.id == UUID(subdistrict_id)))
    subdistrict = result.scalar_one_or_none()
    if subdistrict is None:
        raise HTTPException(status_code=404, detail="Subdistrict not found")
    return subdistrict


@router.post("", response_model=SubdistrictRead, status_code=201, summary="Create subdistrict")
async def create_subdistrict(data: SubdistrictCreate, db: AsyncSession = Depends(get_db)):
    subdistrict = Subdistrict(**data.model_dump())
    db.add(subdistrict)
    await db.flush()
    await db.refresh(subdistrict)
    return subdistrict


@router.put("/{subdistrict_id}", response_model=SubdistrictRead, summary="Update subdistrict")
async def update_subdistrict(subdistrict_id: str, data: SubdistrictUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subdistrict).where(Subdistrict.id == UUID(subdistrict_id)))
    subdistrict = result.scalar_one_or_none()
    if subdistrict is None:
        raise HTTPException(status_code=404, detail="Subdistrict not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(subdistrict, key, value)
    await db.flush()
    await db.refresh(subdistrict)
    return subdistrict


@router.delete("/{subdistrict_id}", status_code=204, summary="Delete subdistrict")
async def delete_subdistrict(subdistrict_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subdistrict).where(Subdistrict.id == UUID(subdistrict_id)))
    subdistrict = result.scalar_one_or_none()
    if subdistrict is None:
        raise HTTPException(status_code=404, detail="Subdistrict not found")
    await db.delete(subdistrict)
