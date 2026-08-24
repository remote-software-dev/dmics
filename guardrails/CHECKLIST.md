# DMICS Migration Checklist

> Laravel → FastAPI + Next.js + Neon
> Mark each item as `[x]` when tests pass. Track progress here.

---

## Phase 1: Project Setup

- [x] FastAPI backend scaffolded with Poetry/pip
- [ ] Next.js frontend scaffolded with App Router
- [x] SQLAlchemy 2.0 async models created (all 8 tables)
- [x] Pydantic schemas for all request/response models
- [ ] Database connection to Neon configured
- [x] Swagger UI at `/docs` and ReDoc at `/redoc`

## Phase 2: Authentication

- [ ] POST /api/v1/auth/login — session-based or JWT
- [ ] POST /api/v1/auth/register — with validation (username unique, password min 6, confirmed)
- [ ] POST /api/v1/auth/logout
- [ ] Auth middleware protecting all routes except login/register
- [ ] Admin middleware for geographic/tools routes
- [ ] User model: isAdmin() logic (positions: admin, Administrator, UNICEF Editor)
- [ ] User model: hasProvinceAccess() — province '0' means full access
- [ ] User model: getPhoneAttribute() — username with 0→+62

## Phase 3: Geographic CRUD (Admin only)

### Provinces
- [x] GET /api/v1/geographic/provinces — paginated, with search, with districts_count
- [ ] POST /api/v1/geographic/provinces — code unique, lat/lng bounds
- [ ] PUT /api/v1/geographic/provinces/{id} — code unique excluding self
- [ ] DELETE /api/v1/geographic/provinces/{id}

### Districts
- [x] GET /api/v1/geographic/districts — paginated, search, province_id filter
- [ ] POST /api/v1/geographic/districts — code unique, province_id exists
- [ ] PUT /api/v1/geographic/districts/{id}
- [ ] DELETE /api/v1/geographic/districts/{id}

### Subdistricts
- [ ] GET /api/v1/geographic/subdistricts — paginated, search, district_id filter
- [ ] POST /api/v1/geographic/subdistricts — code unique, district_id exists
- [ ] PUT /api/v1/geographic/subdistricts/{id}
- [ ] DELETE /api/v1/geographic/subdistricts/{id}

### Puskesmas
- [ ] GET /api/v1/geographic/puskesmas — paginated, search, province/district/subdistrict filters
- [ ] POST /api/v1/geographic/puskesmas — code unique, all FKs exist
- [ ] PUT /api/v1/geographic/puskesmas/{id}
- [ ] DELETE /api/v1/geographic/puskesmas/{id}

## Phase 4: Reports

### Report Submission
- [ ] POST /api/v1/reports/submit — auto-fills from user profile
- [ ] Validation: date <= today, campaign_type in mr/opv, balita_count >= 0
- [ ] Creates ReportMr or ReportOpv based on campaign_type

### Report Views
- [ ] GET /api/v1/reports/province — aggregated MR+OPV per province, population join
- [ ] GET /api/v1/reports/district — filtered by province_id, district_id
- [ ] GET /api/v1/reports/puskesmas — filtered by province/district/subdistrict/puskesmas
- [ ] GET /api/v1/reports/daily — max 7 day range, daily aggregation
- [ ] Province-scoping: auto-filter by user.province if not '0'

### Revisions
- [ ] GET /api/v1/reports/revisions — only after 5PM, empty reports only
- [ ] PUT /api/v1/reports/revisions/{id} — preserves original values

### RCA
- [ ] GET /api/v1/rca — paginated reports
- [ ] POST /api/v1/rca — channel='rca', manual location entry

## Phase 5: Dashboard

- [ ] GET /api/v1/dashboard — all aggregated stats
- [ ] Coverage calculation: (vaccinated / population) * 100
- [ ] Daily trends (last 14 days)
- [ ] Province breakdown (top 8 by MR)
- [ ] Recent reports (last 10 MR, last 10 OPV)

## Phase 6: Tools (Admin only)

- [ ] POST /api/v1/tools/upload — xlsx/xls/csv, max 10MB
- [ ] POST /api/v1/tools/export — CSV/XLSX, filters, combined option
- [ ] GET /api/v1/tools/not-reported — puskesmas with no reports in date range
- [ ] GET /api/v1/tools/codelist — all geographic data ordered by code
- [ ] POST /api/v1/tools/contact — name, email, subject, message

## Phase 7: Frontend (Next.js)

- [ ] Login/Register pages
- [ ] Dashboard page with charts
- [ ] Province/District/Subdistrict/Puskesmas CRUD pages
- [ ] Report submission form
- [ ] Report view pages (province, district, puskesmas, daily)
- [ ] Revision page
- [ ] RCA form
- [ ] Tools pages (upload, export, not-reported, codelist, contact)

## Phase 8: Testing

- [x] pytest tests for all API endpoints
- [ ] Pydantic validation tests (all field validators)
- [ ] Business logic tests (7-day range, 5PM revision, auto-fill)
- [ ] Parallel comparison tests (Laravel vs FastAPI)
- [ ] Frontend integration tests

---

## Progress Summary

| Phase | Total Items | Completed | % |
|-------|------------|-----------|---|
| 1. Setup | 6 | 4 | 67% |
| 2. Auth | 9 | 0 | 0% |
| 3. Geographic | 16 | 2 | 13% |
| 4. Reports | 12 | 0 | 0% |
| 5. Dashboard | 5 | 0 | 0% |
| 6. Tools | 5 | 0 | 0% |
| 7. Frontend | 8 | 0 | 0% |
| 8. Testing | 5 | 1 | 20% |
| **Total** | **66** | **7** | **11%** |
