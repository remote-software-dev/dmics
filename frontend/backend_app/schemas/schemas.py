import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# --- Province ---

class ProvinceBase(BaseModel):
    code: str
    name: str
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool = True


class ProvinceCreate(ProvinceBase):
    pass


class ProvinceUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool | None = None


class ProvinceRead(ProvinceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --- District ---

class DistrictBase(BaseModel):
    code: str
    province_id: uuid.UUID
    name: str
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool = True


class DistrictCreate(DistrictBase):
    pass


class DistrictUpdate(BaseModel):
    code: str | None = None
    province_id: uuid.UUID | None = None
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool | None = None


class DistrictRead(DistrictBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --- Subdistrict ---

class SubdistrictBase(BaseModel):
    code: str
    district_id: uuid.UUID
    name: str
    is_active: bool = True


class SubdistrictCreate(SubdistrictBase):
    pass


class SubdistrictUpdate(BaseModel):
    code: str | None = None
    district_id: uuid.UUID | None = None
    name: str | None = None
    is_active: bool | None = None


class SubdistrictRead(SubdistrictBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --- Puskesmas ---

class PuskesmasBase(BaseModel):
    code: str
    name: str
    province_id: uuid.UUID
    district_id: uuid.UUID
    subdistrict_id: uuid.UUID
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PuskesmasCreate(PuskesmasBase):
    pass


class PuskesmasUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    province_id: uuid.UUID | None = None
    district_id: uuid.UUID | None = None
    subdistrict_id: uuid.UUID | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PuskesmasRead(PuskesmasBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --- Report MR ---

class ReportMRBase(BaseModel):
    date: datetime
    subdistrict_code: str
    id_puskesmas: str
    dashboard_reporter: str | None = None
    channel: str = "dashboard"
    province: str | None = None
    district: str | None = None
    puskesmas: str | None = None
    balita_mr: int = 0


class ReportMRCreate(BaseModel):
    date: datetime
    subdistrict_code: str
    id_puskesmas: str
    dashboard_reporter: str | None = None
    province: str | None = None
    district: str | None = None
    puskesmas: str | None = None
    balita_mr: int = 0


class ReportMRRead(ReportMRBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    campaign_type: str = "mr"
    balita_mr_ori: int | None = None
    date_ori: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --- Report OPV ---

class ReportOPVBase(BaseModel):
    date: datetime
    subdistrict_code: str
    id_puskesmas: str
    dashboard_reporter: str | None = None
    channel: str = "dashboard"
    province: str | None = None
    district: str | None = None
    puskesmas: str | None = None
    balita_opv: int = 0


class ReportOPVCreate(BaseModel):
    date: datetime
    subdistrict_code: str
    id_puskesmas: str
    dashboard_reporter: str | None = None
    province: str | None = None
    district: str | None = None
    puskesmas: str | None = None
    balita_opv: int = 0


class ReportOPVRead(ReportOPVBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    campaign_type: str = "opv"
    balita_opv_ori: int | None = None
    date_ori: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --- Population ---

class PopulationBase(BaseModel):
    target_type: str
    target_code: str
    campaign_type: str | None = None
    year: int
    total: int
    extra_metadata: dict | None = None


class PopulationCreate(PopulationBase):
    pass


class PopulationUpdate(BaseModel):
    target_type: str | None = None
    target_code: str | None = None
    campaign_type: str | None = None
    year: int | None = None
    total: int | None = None
    extra_metadata: dict | None = None


class PopulationRead(PopulationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --- User ---

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    nama: str | None = None
    email: str | None = None
    phone: str | None = None
    province: str | None = None
    position: str | None = None
    created_at: datetime | None = None


# --- Auth ---

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Dashboard ---

class DashboardStats(BaseModel):
    total_provinces: int
    total_districts: int
    total_puskesmas: int
    total_reports: int
    total_mr_reports: int
    total_opv_reports: int


class CoverageData(BaseModel):
    mr_coverage: float
    opv_coverage: float
    total_vaccinated_mr: int
    total_vaccinated_opv: int
    total_population_mr: int
    total_population_opv: int


class VaccinationTrend(BaseModel):
    dates: list[str]
    mr: list[int]
    opv: list[int]


class ProvinceChartData(BaseModel):
    labels: list[str]
    data: list[int]


# --- Paginated ---

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    size: int
