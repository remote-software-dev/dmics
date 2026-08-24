# DMICS — Laravel to FastAPI + Next.js + Neon

## Project Structure

```
laravel_to_fastapi_next_neon/
├── backend/          # FastAPI backend (Python, SQLAlchemy 2.0, asyncpg)
│   ├── app/
│   │   ├── api/      # API route handlers
│   │   ├── core/     # Config, database, utilities
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic request/response schemas
│   │   └── main.py   # FastAPI application entry point
│   ├── .env.example
│   ├── pyproject.toml
│   └── poetry.lock
├── frontend/         # Next.js App Router frontend (TypeScript, Tailwind)
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── lib/      # API client, types
│   │   └── components/
│   └── package.json
└── dmics/           # Legacy Laravel codebase (reference only)
```

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
cp .env.example .env   # Fill in your Neon DATABASE_URL
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:3000

## Database Schema (campaign schema)

| Table           | Description                           |
|-----------------|---------------------------------------|
| provinces       | Province-level geographic data        |
| districts       | District/city geographic data         |
| subdistricts    | Subdistrict (kecamatan) geographic data|
| puskesmas       | Health centers (puskesmas)            |
| reportmr        | MR vaccination campaign reports       |
| reportopv       | OPV vaccination campaign reports      |
| populations     | Target population data per location   |
