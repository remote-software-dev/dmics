export interface Province {
  id: string;
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface District {
  id: string;
  code: string;
  province_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Subdistrict {
  id: string;
  code: string;
  district_id: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Puskesmas {
  id: string;
  code: string;
  name: string;
  province_id: string;
  district_id: string;
  subdistrict_id: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportMR {
  id: string;
  date: string;
  subdistrict_code: string;
  id_puskesmas: string;
  dashboard_reporter: string | null;
  channel: string;
  province: string | null;
  district: string | null;
  puskesmas: string | null;
  balita_mr: number;
  campaign_type: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportOPV {
  id: string;
  date: string;
  subdistrict_code: string;
  id_puskesmas: string;
  dashboard_reporter: string | null;
  channel: string;
  province: string | null;
  district: string | null;
  puskesmas: string | null;
  balita_opv: number;
  campaign_type: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Population {
  id: string;
  target_type: string;
  target_code: string;
  campaign_type: string | null;
  year: number;
  total: number;
  extra_metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DashboardStats {
  total_provinces: number;
  total_districts: number;
  total_puskesmas: number;
  total_reports: number;
  total_mr_reports: number;
  total_opv_reports: number;
}

export interface CoverageData {
  mr_coverage: number;
  opv_coverage: number;
  total_vaccinated_mr: number;
  total_vaccinated_opv: number;
  total_population_mr: number;
  total_population_opv: number;
}

export interface VaccinationTrend {
  dates: string[];
  mr: number[];
  opv: number[];
}

export interface ProvinceChartData {
  labels: string[];
  data: number[];
}

export interface PaginatedReports {
  items: ReportMR[] | ReportOPV[];
  total: number;
  page: number;
  size: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ReportCreateRequest {
  date: string;
  subdistrict_code: string;
  id_puskesmas: string;
  dashboard_reporter: string;
  channel: string;
  province: string;
  district: string;
  puskesmas: string;
  balita_mr?: number;
  balita_opv?: number;
}

export interface ProvinceCreateRequest {
  code: string;
  name: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

export interface DistrictCreateRequest {
  code: string;
  province_id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

export interface SubdistrictCreateRequest {
  code: string;
  district_id: string;
  name: string;
  is_active?: boolean;
}

export interface PuskesmasCreateRequest {
  code: string;
  name: string;
  province_id: string;
  district_id: string;
  subdistrict_id: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
