import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_app.api import auth, dashboard, districts, health, populations, provinces, puskesmas, reports, reports_opv, subdistricts
from backend_app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


async def _create_default_admin():
    """Auto-create a default admin user if no users exist (first-run bootstrap)."""
    from sqlalchemy import select
    from backend_app.core.database import get_async_session_factory
    from backend_app.core.security import get_password_hash
    from backend_app.models.models import User

    sf = await get_async_session_factory()
    async with sf() as db:
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none() is not None:
            logger.info("Users already exist, skipping default admin creation.")
            return

        user = User(
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
        db.add(user)
        await db.commit()
        logger.info(
            "Default admin created — Phone: 081234567890, Password: password"
        )


@asynccontextmanager
async def lifespan(application: FastAPI):
    try:
        from backend_app.core.database import create_tables
        await create_tables()
    except Exception as exc:
        logger.warning("Table creation skipped: %s", exc)
    try:
        await _create_default_admin()
    except Exception as exc:
        logger.warning("Default admin creation skipped: %s", exc)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="DMICS (Digital Monitoring Immunization Campaign System) API. "
    "Provides endpoints for managing vaccination campaign data across "
    "provinces, districts, subdistricts, and puskesmas in Indonesia.",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Health", "description": "API health check and status endpoints."},
        {"name": "Auth", "description": "Authentication endpoints."},
        {"name": "Dashboard", "description": "Dashboard statistics and chart data."},
        {"name": "Provinces", "description": "CRUD operations for province-level geographic data."},
        {"name": "Districts", "description": "CRUD operations for district-level geographic data."},
        {"name": "Subdistricts", "description": "CRUD operations for subdistrict-level geographic data."},
        {"name": "Puskesmas", "description": "CRUD operations for puskesmas (health centers)."},
        {"name": "Populations", "description": "Population target data for coverage calculations."},
        {"name": "Reports", "description": "Vaccination campaign report data (MR and OPV)."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(provinces.router, prefix=settings.API_V1_PREFIX)
app.include_router(districts.router, prefix=settings.API_V1_PREFIX)
app.include_router(subdistricts.router, prefix=settings.API_V1_PREFIX)
app.include_router(puskesmas.router, prefix=settings.API_V1_PREFIX)
app.include_router(populations.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_opv.router, prefix=settings.API_V1_PREFIX)
