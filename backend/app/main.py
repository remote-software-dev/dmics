from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, districts, health, populations, provinces, puskesmas, reports, reports_opv, subdistricts
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="DMICS (Digital Monitoring Immunization Campaign System) API. "
    "Provides endpoints for managing vaccination campaign data across "
    "provinces, districts, subdistricts, and puskesmas in Indonesia.",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
