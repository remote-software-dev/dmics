from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Population
from app.schemas.schemas import PopulationCreate, PopulationRead, PopulationUpdate

router = APIRouter(prefix="/populations", tags=["Populations"])


@router.get("/", response_model=list[PopulationRead], summary="List all populations")
async def list_populations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Population).order_by(Population.target_type))
    return result.scalars().all()


@router.get("/{population_id}", response_model=PopulationRead, summary="Get population by ID")
async def get_population(population_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Population).where(Population.id == UUID(population_id)))
    population = result.scalar_one_or_none()
    if population is None:
        raise HTTPException(status_code=404, detail="Population not found")
    return population


@router.post("/", response_model=PopulationRead, status_code=201, summary="Create population")
async def create_population(data: PopulationCreate, db: AsyncSession = Depends(get_db)):
    population = Population(**data.model_dump())
    db.add(population)
    await db.flush()
    await db.refresh(population)
    return population


@router.put("/{population_id}", response_model=PopulationRead, summary="Update population")
async def update_population(population_id: str, data: PopulationUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Population).where(Population.id == UUID(population_id)))
    population = result.scalar_one_or_none()
    if population is None:
        raise HTTPException(status_code=404, detail="Population not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(population, key, value)
    await db.flush()
    await db.refresh(population)
    return population


@router.delete("/{population_id}", status_code=204, summary="Delete population")
async def delete_population(population_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Population).where(Population.id == UUID(population_id)))
    population = result.scalar_one_or_none()
    if population is None:
        raise HTTPException(status_code=404, detail="Population not found")
    await db.delete(population)
