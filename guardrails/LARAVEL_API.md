# DMICS API Documentation — Laravel Source of Truth

> Generated from analyzing `dmics/src/routes/web.php` and all controllers.
> Laravel serves both web views (Blade) and has no `routes/api.php`. All endpoints below are web routes that return views or redirect. The FastAPI rewrite must convert these to REST JSON endpoints.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Dashboard](#2-dashboard)
3. [Reports (View)](#3-reports-view)
4. [Report Submission](#4-report-submission)
5. [Revisions](#5-revisions)
6. [RCA (Report Campaign Activities)](#6-rca)
7. [Geographic CRUD — Provinces](#7-geographic-crud--provinces)
8. [Geographic CRUD — Districts](#8-geographic-crud--districts)
9. [Geographic CRUD — Subdistricts](#9-geographic-crud--subdistricts)
10. [Geographic CRUD — Puskesmas](#10-geographic-crud--puskesmas)
11. [Tools — Upload](#11-tools--upload)
12. [Tools — Export](#12-tools--export)
13. [Tools — Not Reported](#13-tools--not-reported)
14. [Tools — Codelist](#14-tools--codelist)
15. [Tools — Contact](#15-tools--contact)

---

## 1. Authentication

### POST /login

**Middleware:** None
**Request:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "remember": "boolean (optional)"
}
```
**Response:** 302 redirect to `/dashboard` on success, back with errors on failure.
**Validation:**
- `username` — required, string
- `password` — required, string

### POST /register

**Middleware:** None
**Request:**
```json
{
  "username": "string (required, unique:users,username)",
  "password": "string (required, confirmed, min:6)",
  "password_confirmation": "string (required with password)",
  "nama": "string (required)",
  "email": "string (nullable, email)",
  "position": "string (required, in:reporter,admin)",
  "province": "string (required)"
}
```
**Response:** 302 redirect to `/dashboard` on success.
**Business Logic:**
- Password hashed with `Hash::make()`
- `legacy_hash` set to `'bcrypt'`
- `datecreated` set to `now()`
- User auto-logged in after registration

### POST /logout

**Middleware:** auth
**Response:** 302 redirect to `/login`

---

## 2. Dashboard

### GET /dashboard

**Middleware:** auth
**Response:** View with aggregated data:
```json
{
  "totalProvinces": "integer",
  "totalDistricts": "integer",
  "totalSubdistricts": "integer",
  "totalPuskesmas": "integer",
  "totalMrReports": "integer",
  "totalOpvReports": "integer",
  "totalReports": "integer",
  "totalVaccinatedMr": "integer (sum of balita_mr)",
  "totalVaccinatedOpv": "integer (sum of balita_opv)",
  "totalPopulationMr": "integer (from populations table)",
  "totalPopulationOpv": "integer (from populations table)",
  "mrCoverage": "float (percentage, 1 decimal)",
  "opvCoverage": "float (percentage, 1 decimal)",
  "recentMrReports": "ReportMr[] (last 10, with puskesmasRef)",
  "recentOpvReports": "ReportOpv[] (last 10, with puskesmasRef)",
  "chartDates": "string[] (JSON, last 14 days)",
  "chartMr": "integer[] (JSON, daily MR totals)",
  "chartOpv": "integer[] (JSON, daily OPV totals)",
  "chartProvinceLabels": "string[] (JSON, top 8 provinces by MR)",
  "chartProvinceData": "integer[] (JSON, MR totals per province)"
}
```
**Business Logic:**
- Coverage = `(totalVaccinated / totalPopulation) * 100` rounded to 1 decimal
- Daily trends: last 14 days, grouped by date
- Province breakdown: top 8 by MR vaccination count

---

## 3. Reports (View)

### GET /reports/province

**Middleware:** auth
**Query Params:**
- `province` (optional) — filter by province name
**Business Logic:**
- If user.province !== '0', auto-filter to user's province
- Aggregates MR and OPV vaccination data per province
- Joins with Population table for coverage calculation
**Response Shape (per province):**
```json
{
  "province_name": "string",
  "total_vaccinated": "integer",
  "population": "integer (from populations)",
  "reports_count": "integer (MR only)"
}
```

### GET /reports/district

**Middleware:** auth
**Query Params:**
- `province_id` (optional) — filter by province UUID
- `district_id` (optional) — filter by district UUID
**Business Logic:**
- Auto-filters by user.province if not '0'
- Returns both MR and OPV data per district
**Response Shape (per district):**
```json
{
  "district_name": "string",
  "province_name": "string",
  "total_vaccinated": "integer",
  "population": "integer",
  "reports_count": "integer"
}
```

### GET /reports/puskesmas

**Middleware:** auth
**Query Params:**
- `province_id`, `district_id`, `subdistrict_id`, `puskesmas_id` (all optional)
**Response Shape (per puskesmas):**
```json
{
  "puskesmas_name": "string",
  "subdistrict_name": "string",
  "district_name": "string",
  "total_vaccinated": "integer",
  "population": "integer (from subdistrict level)",
  "reports_count": "integer"
}
```

### GET /reports/daily

**Middleware:** auth
**Query Params:**
- `date_from` (default: 7 days ago)
- `date_to` (default: today)
- `province`, `district`, `puskesmas` (optional filters)
**Business Logic:**
- **Max date range: 7 days** (validated server-side)
- Returns daily aggregated MR and OPV totals
**Response Shape:**
```json
{
  "reports": [
    {
      "date": "string (YYYY-MM-DD)",
      "total_mr": "integer",
      "total_opv": "integer"
    }
  ]
}
```

---

## 4. Report Submission

### GET /data-entry/submit

**Middleware:** auth
**Response:** View with user info and puskesmas details

### POST /data-entry/submit

**Middleware:** auth
**Request:**
```json
{
  "date": "date (required, before_or_equal:today)",
  "campaign_type": "string (required, in:mr,opv)",
  "balita_count": "integer (required, min:0)"
}
```
**Business Logic:**
- Automatically fills: `subdistrict_code`, `id_puskesmas`, `dashboard_reporter`, `channel='dashboard'`, `province`, `district`, `puskesmas` from authenticated user
- Creates ReportMr or ReportOpv based on campaign_type

---

## 5. Revisions

### GET /data-entry/revision

**Middleware:** auth
**Business Logic:**
- **Only available after 5:00 PM** (`now()->hour < 17` returns error)
- Filters reports where `balita_mr = 0` or `balita_opv = 0` (empty reports)
- Supports filters: province, district, subdistrict_code, puskesmas

### PUT /data-entry/revision/{id}

**Middleware:** auth
**Request:**
```json
{
  "type": "string (required, in:mr,opv)",
  "new_value": "integer (required, min:0)"
}
```
**Business Logic:**
- Preserves original values: sets `balita_mr_ori` / `balita_opv_ori` and `date_ori`
- Updates the current `balita_mr` / `balita_opv`

---

## 6. RCA (Report Campaign Activities)

### GET /rca

**Middleware:** auth
**Query Params:** `province`, `district`, `puskesmas` (optional)
**Response:** Paginated MR and OPV reports (15 per page)

### GET /rca/create

**Middleware:** auth
**Response:** View with provinces, districts, puskesmas lists

### POST /rca

**Middleware:** auth
**Request:**
```json
{
  "date": "date (required, before_or_equal:today)",
  "province": "string (required)",
  "district": "string (required)",
  "puskesmas": "string (required)",
  "campaign_type": "string (required, in:mr,opv)",
  "balita_count": "integer (required, min:0)",
  "notes": "string (nullable)"
}
```
**Business Logic:**
- Creates report with `channel = 'rca'`
- Does NOT auto-fill location from user — manual entry

---

## 7. Geographic CRUD — Provinces

All under `admin` middleware, prefix `/geographic`.

### GET /geographic/provinces

**Query Params:** `search` (optional, filters by name LIKE)
**Response:** Paginated provinces with `districts_count` (withCount)

### POST /geographic/provinces

**Request:**
```json
{
  "code": "string (required, unique:campaign.provinces,code)",
  "name": "string (required, max:255)",
  "latitude": "numeric (nullable, between:-90,90)",
  "longitude": "numeric (nullable, between:-180,180)",
  "is_active": "boolean (default: true)"
}
```

### PUT /geographic/provinces/{province}

**Request:** Same as POST, code unique validation excludes self

### DELETE /geographic/provinces/{province}

**Response:** Redirect with success message

---

## 8. Geographic CRUD — Districts

### GET /geographic/districts

**Query Params:** `search`, `province_id` (optional)
**Response:** Paginated districts with province relation

### POST /geographic/districts

**Request:**
```json
{
  "code": "string (required, unique:campaign.districts,code)",
  "province_id": "uuid (required, exists:campaign.provinces,id)",
  "name": "string (required, max:255)",
  "latitude": "numeric (nullable, between:-90,90)",
  "longitude": "numeric (nullable, between:-180,180)",
  "is_active": "boolean (default: true)"
}
```

### PUT /geographic/districts/{district}

Same as POST, code unique excludes self.

### DELETE /geographic/districts/{district}

---

## 9. Geographic CRUD — Subdistricts

### GET /geographic/subdistricts

**Query Params:** `search`, `district_id` (optional)

### POST /geographic/subdistricts

**Request:**
```json
{
  "code": "string (required, unique:campaign.subdistricts,code)",
  "district_id": "uuid (required, exists:campaign.districts,id)",
  "name": "string (required, max:255)",
  "is_active": "boolean (default: true)"
}
```

### PUT /geographic/subdistricts/{subdistrict}
### DELETE /geographic/subdistricts/{subdistrict}

---

## 10. Geographic CRUD — Puskesmas

### GET /geographic/puskesmas

**Query Params:** `search`, `province_id`, `district_id`, `subdistrict_id` (all optional)

### POST /geographic/puskesmas

**Request:**
```json
{
  "code": "string (required, unique:campaign.puskesmas,code)",
  "name": "string (required, max:255)",
  "province_id": "uuid (required, exists:campaign.provinces,id)",
  "district_id": "uuid (required, exists:campaign.districts,id)",
  "subdistrict_id": "uuid (required, exists:campaign.subdistricts,id)",
  "address": "string (nullable)",
  "latitude": "numeric (nullable, between:-90,90)",
  "longitude": "numeric (nullable, between:-180,180)"
}
```

### PUT /geographic/puskesmas/{puskesmas}
### DELETE /geographic/puskesmas/{puskesmas}

---

## 11. Tools — Upload

### POST /tools/upload

**Middleware:** auth + admin
**Request:** Multipart form data
```
file: required, file, max:10240KB, mimes:xlsx,xls,csv
```
**Business Logic:**
- Stores file in `uploads/` directory with timestamp prefix

---

## 12. Tools — Export

### POST /tools/export

**Middleware:** auth + admin
**Request:**
```json
{
  "export_type": "string (required, in:mr,opv,combined)",
  "format": "string (required, in:csv,xlsx)",
  "province": "string (nullable)",
  "district": "string (nullable)",
  "puskesmas": "string (nullable)",
  "date_from": "date (nullable)",
  "date_to": "date (nullable, after_or_equal:date_from)"
}
```
**Business Logic:**
- Filters reports by province, district, puskesmas, date range
- Generates CSV/XLSX with columns: Date, Province, District, Puskesmas, Balita (MR/OPV)

---

## 13. Tools — Not Reported

### GET /tools/not-reported

**Middleware:** auth + admin
**Query Params:** `date_from` (default: today), `date_to` (default: today), `province_id`, `district_id` (optional)
**Business Logic:**
- Finds puskesmas that have NOT submitted any reports in the date range
- Filters by user.province if not '0'

---

## 14. Tools — Codelist

### GET /tools/codelist

**Middleware:** auth + admin
**Response:** All provinces, districts (with province), subdistricts (with district), puskesmas (with all relations), ordered by code

---

## 15. Tools — Contact

### POST /tools/contact

**Middleware:** auth + admin
**Request:**
```json
{
  "name": "string (required, max:255)",
  "email": "string (required, email, max:255)",
  "subject": "string (required, max:255)",
  "message": "string (required)"
}
```

---

## Key Business Rules Summary

| Rule | Location |
|------|----------|
| User positions: `reporter`, `admin`, `Administrator`, `UNICEF Editor` | RegisterController, User model |
| Admin check: `in_array(position, ['admin', 'Administrator', 'UNICEF Editor'])` | User.isAdmin() |
| Province access: user.province `'0'` = all, otherwise scoped | User.hasProvinceAccess() |
| Revisions only after 5:00 PM | RevisionController.index() |
| Daily report max range: 7 days | ReportController.daily() |
| Report submission auto-fills location from user profile | ReportSubmissionController.store() |
| RCA submissions use `channel = 'rca'` | RcaController.store() |
| Phone number: username with `0` replaced by `+62` | User.getPhoneAttribute() |
| Registration password: min 6, confirmed, hashed with bcrypt | RegisterController.store() |
| Upload max: 10MB, types: xlsx, xls, csv | UploadController.store() |
