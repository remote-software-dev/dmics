from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend_app.core.database import get_db
from backend_app.models.models import Puskesmas
from backend_app.schemas.schemas import PuskesmasCreate, PuskesmasRead, PuskesmasUpdate

router = APIRouter(prefix="/puskesmas", tags=["Puskesmas"])


@router.get("", response_model=list[PuskesmasRead], summary="List all puskesmas")
async def list_puskesmas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Puskesmas).order_by(Puskesmas.name))
    return result.scalars().all()


@router.get("/{puskesmas_id}", response_model=PuskesmasRead, summary="Get puskesmas by ID")
async def get_puskesmas(puskesmas_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Puskesmas).where(Puskesmas.id == UUID(puskesmas_id)))
    puskesmas = result.scalar_one_or_none()
    if puskesmas is None:
        raise HTTPException(status_code=404, detail="Puskesmas not found")
    return puskesmas


@router.post("", response_model=PuskesmasRead, status_code=201, summary="Create puskesmas")
async def create_puskesmas(data: PuskesmasCreate, db: AsyncSession = Depends(get_db)):
    puskesmas = Puskesmas(**data.model_dump())
    db.add(puskesmas)
    await db.flush()
    await db.refresh(puskesmas)
    return puskesmas


@router.put("/{puskesmas_id}", response_model=PuskesmasRead, summary="Update puskesmas")
async def update_puskesmas(puskesmas_id: str, data: PuskesmasUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Puskesmas).where(Puskesmas.id == UUID(puskesmas_id)))
    puskesmas = result.scalar_one_or_none()
    if puskesmas is None:
        raise HTTPException(status_code=404, detail="Puskesmas not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(puskesmas, key, value)
    await db.flush()
    await db.refresh(puskesmas)
    return puskesmas


@router.delete("/{puskesmas_id}", status_code=204, summary="Delete puskesmas")
async def delete_puskesmas(puskesmas_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Puskesmas).where(Puskesmas.id == UUID(puskesmas_id)))
    puskesmas = result.scalar_one_or_none()
    if puskesmas is None:
        raise HTTPException(status_code=404, detail="Puskesmas not found")
    await db.delete(puskesmas)
