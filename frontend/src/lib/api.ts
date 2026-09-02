import { getToken } from "./auth";
import {
  Province,
  District,
  Subdistrict,
  Puskesmas,
  Population,
  DashboardStats,
  CoverageData,
  VaccinationTrend,
  ProvinceChartData,
  PaginatedReports,
  ReportMR,
  ReportOPV,
  AuthResponse,
  LoginRequest,
  ReportCreateRequest,
  ProvinceCreateRequest,
  DistrictCreateRequest,
  SubdistrictCreateRequest,
  PuskesmasCreateRequest,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Provinces
export async function fetchProvinces(): Promise<Province[]> {
  return apiFetch<Province[]>("/api/v1/provinces/");
}

export async function fetchProvince(id: string): Promise<Province> {
  return apiFetch<Province>(`/api/v1/provinces/${id}`);
}

export async function createProvince(data: ProvinceCreateRequest): Promise<Province> {
  return apiFetch<Province>("/api/v1/provinces/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProvince(id: string, data: Partial<ProvinceCreateRequest>): Promise<Province> {
  return apiFetch<Province>(`/api/v1/provinces/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProvince(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/provinces/${id}`, { method: "DELETE" });
}

// Districts
export async function fetchDistricts(): Promise<District[]> {
  return apiFetch<District[]>("/api/v1/districts/");
}

export async function fetchDistrict(id: string): Promise<District> {
  return apiFetch<District>(`/api/v1/districts/${id}`);
}

export async function createDistrict(data: DistrictCreateRequest): Promise<District> {
  return apiFetch<District>("/api/v1/districts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDistrict(id: string, data: Partial<DistrictCreateRequest>): Promise<District> {
  return apiFetch<District>(`/api/v1/districts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDistrict(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/districts/${id}`, { method: "DELETE" });
}

// Subdistricts
export async function fetchSubdistricts(): Promise<Subdistrict[]> {
  return apiFetch<Subdistrict[]>("/api/v1/subdistricts/");
}

export async function fetchSubdistrict(id: string): Promise<Subdistrict> {
  return apiFetch<Subdistrict>(`/api/v1/subdistricts/${id}`);
}

export async function createSubdistrict(data: SubdistrictCreateRequest): Promise<Subdistrict> {
  return apiFetch<Subdistrict>("/api/v1/subdistricts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSubdistrict(id: string, data: Partial<SubdistrictCreateRequest>): Promise<Subdistrict> {
  return apiFetch<Subdistrict>(`/api/v1/subdistricts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSubdistrict(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/subdistricts/${id}`, { method: "DELETE" });
}

// Puskesmas
export async function fetchPuskesmasList(): Promise<Puskesmas[]> {
  return apiFetch<Puskesmas[]>("/api/v1/puskesmas/");
}

export async function fetchPuskesmas(id: string): Promise<Puskesmas> {
  return apiFetch<Puskesmas>(`/api/v1/puskesmas/${id}`);
}

export async function createPuskesmas(data: PuskesmasCreateRequest): Promise<Puskesmas> {
  return apiFetch<Puskesmas>("/api/v1/puskesmas/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePuskesmas(id: string, data: Partial<PuskesmasCreateRequest>): Promise<Puskesmas> {
  return apiFetch<Puskesmas>(`/api/v1/puskesmas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePuskesmas(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/puskesmas/${id}`, { method: "DELETE" });
}

// Populations
export async function fetchPopulations(): Promise<Population[]> {
  return apiFetch<Population[]>("/api/v1/populations/");
}

// Dashboard
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/v1/dashboard/stats");
}

export async function fetchCoverage(): Promise<CoverageData> {
  return apiFetch<CoverageData>("/api/v1/dashboard/coverage");
}

export async function fetchVaccinationTrend(): Promise<VaccinationTrend> {
  return apiFetch<VaccinationTrend>("/api/v1/dashboard/vaccination-trend");
}

export async function fetchByProvince(): Promise<ProvinceChartData> {
  return apiFetch<ProvinceChartData>("/api/v1/dashboard/by-province");
}

// Reports
export async function fetchRecentMRReports(
  page = 1,
  size = 10
): Promise<PaginatedReports> {
  return apiFetch<PaginatedReports>(
    `/api/v1/reports/mr/recent?page=${page}&size=${size}`
  );
}

export async function fetchRecentOPVReports(
  page = 1,
  size = 10
): Promise<PaginatedReports> {
  return apiFetch<PaginatedReports>(
    `/api/v1/reports/opv/recent?page=${page}&size=${size}`
  );
}

export async function createMRReport(data: ReportCreateRequest): Promise<ReportMR> {
  return apiFetch<ReportMR>("/api/v1/reports/mr", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createOPVReport(data: ReportCreateRequest): Promise<ReportOPV> {
  return apiFetch<ReportOPV>("/api/v1/reports/opv", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
