"use client";

import { useEffect, useState } from "react";
import { MapPin, Building2, Stethoscope, FileBarChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import StatsCard from "@/components/StatsCard";
import CoverageCard from "@/components/CoverageCard";
import TrendChart from "@/components/TrendChart";
import ProvinceChart from "@/components/ProvinceChart";
import DataTable from "@/components/DataTable";

import {
  DashboardStats,
  CoverageData,
  VaccinationTrend,
  ProvinceChartData,
  ReportMR,
  ReportOPV,
} from "@/lib/types";

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [coverage, setCoverage] = useState<CoverageData | null>(null);
  const [trend, setTrend] = useState<VaccinationTrend | null>(null);
  const [byProvince, setByProvince] = useState<ProvinceChartData | null>(null);
  const [mrReports, setMrReports] = useState<ReportMR[]>([]);
  const [opvReports, setOpvReports] = useState<ReportOPV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const base = "/api/v1";
        const [statsRes, coverageRes, trendRes, provinceRes, mrRes, opvRes] =
          await Promise.all([
            fetch(`${base}/dashboard/stats`, { headers }).then((r) => r.json()),
            fetch(`${base}/dashboard/coverage`, { headers }).then((r) =>
              r.json()
            ),
            fetch(`${base}/dashboard/vaccination-trend`, { headers }).then((r) =>
              r.json()
            ),
            fetch(`${base}/dashboard/by-province`, { headers }).then((r) =>
              r.json()
            ),
            fetch(`${base}/reports/mr/recent?size=10`, { headers }).then((r) =>
              r.json()
            ),
            fetch(`${base}/reports/opv/recent?size=10`, { headers }).then((r) =>
              r.json()
            ),
          ]);
        setStats(statsRes);
        setCoverage(coverageRes);
        setTrend(trendRes);
        setByProvince(provinceRes);
        setMrReports(mrRes.items || []);
        setOpvReports(opvRes.items || []);
      } catch {
        setError(
          "Failed to load dashboard data. The backend API may be starting up or unavailable."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in delay-1">
        <StatsCard
          title="Provinces"
          value={stats?.total_provinces || 0}
          icon={MapPin}
          color="indigo"
        />
        <StatsCard
          title="Districts"
          value={stats?.total_districts || 0}
          icon={Building2}
          color="violet"
        />
        <StatsCard
          title="Puskesmas"
          value={stats?.total_puskesmas || 0}
          icon={Stethoscope}
          color="emerald"
        />
        <StatsCard
          title="Total Reports"
          value={stats?.total_reports || 0}
          icon={FileBarChart}
          color="amber"
          badge={{
            label: `MR: ${(stats?.total_mr_reports || 0).toLocaleString()} | OPV: ${(stats?.total_opv_reports || 0).toLocaleString()}`,
            variant: "mr",
          }}
        />
      </div>

      {/* Coverage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in delay-2">
        <CoverageCard
          title="MR Coverage"
          subtitle="Measles-Rubella vaccination progress"
          percentage={coverage?.mr_coverage || 0}
          vaccinated={coverage?.total_vaccinated_mr || 0}
          population={coverage?.total_population_mr || 0}
          color="indigo"
        />
        <CoverageCard
          title="OPV Coverage"
          subtitle="Oral Polio Vaccine progress"
          percentage={coverage?.opv_coverage || 0}
          vaccinated={coverage?.total_vaccinated_opv || 0}
          population={coverage?.total_population_opv || 0}
          color="violet"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in delay-3">
        <TrendChart
          dates={trend?.dates || []}
          mr={trend?.mr || []}
          opv={trend?.opv || []}
        />
        <ProvinceChart
          labels={byProvince?.labels || []}
          data={byProvince?.data || []}
        />
      </div>

      {/* Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in delay-4">
        <DataTable
          title="Recent MR Reports"
          subtitle="Latest submissions"
          total={stats?.total_mr_reports || 0}
          totalLabel={`${stats?.total_mr_reports || 0} total`}
          color="indigo"
          reports={mrReports}
          valueField="balita_mr"
        />
        <DataTable
          title="Recent OPV Reports"
          subtitle="Latest submissions"
          total={stats?.total_opv_reports || 0}
          totalLabel={`${stats?.total_opv_reports || 0} total`}
          color="violet"
          reports={opvReports}
          valueField="balita_opv"
        />
      </div>
    </div>
  );
}
