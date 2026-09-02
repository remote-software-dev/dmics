"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Province, ReportMR, ReportOPV, PaginatedReports } from "@/lib/types";
import { BarChart3, FileText, MapPin } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function ProvinceReportsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"mr" | "opv">("mr");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [mrReports, setMrReports] = useState<ReportMR[]>([]);
  const [opvReports, setOpvReports] = useState<ReportOPV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    async function load() {
      try {
        const [provRes, mrRes, opvRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/provinces/", { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/reports/mr/recent?size=10000", { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/reports/opv/recent?size=10000", { headers }).then((r) => r.json()),
        ]);
        setProvinces(provRes);
        setMrReports(((mrRes as PaginatedReports).items || []) as ReportMR[]);
        setOpvReports(((opvRes as PaginatedReports).items || []) as ReportOPV[]);
      } catch {
        setError("Failed to load province reports.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const filteredMr = useMemo(
    () => (provinceFilter ? mrReports.filter((r) => r.province === provinceFilter) : mrReports),
    [mrReports, provinceFilter]
  );

  const filteredOpv = useMemo(
    () => (provinceFilter ? opvReports.filter((r) => r.province === provinceFilter) : opvReports),
    [opvReports, provinceFilter]
  );

  const mrAggregated = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const r of filteredMr) {
      const key = r.province || "Unknown";
      const existing = map.get(key) || { name: key, total: 0, count: 0 };
      existing.total += r.balita_mr;
      existing.count += 1;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredMr]);

  const opvAggregated = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const r of filteredOpv) {
      const key = r.province || "Unknown";
      const existing = map.get(key) || { name: key, total: 0, count: 0 };
      existing.total += r.balita_opv;
      existing.count += 1;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredOpv]);

  const aggregated = tab === "mr" ? mrAggregated : opvAggregated;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading province reports...</div>
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Province Reports</h1>
            <p className="text-xs text-slate-500">Vaccination data aggregated by province</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">All Provinces</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 rounded-md p-0.5">
            <button
              onClick={() => setTab("mr")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                tab === "mr"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              MR Reports
            </button>
            <button
              onClick={() => setTab("opv")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                tab === "opv"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              OPV Reports
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Province Name
                </th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Vaccinated
                </th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Reports Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aggregated.length > 0 ? (
                aggregated.map((row, idx) => (
                  <tr
                    key={row.name}
                    className="hover:bg-slate-50/50 transition-colors duration-100"
                  >
                    <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{row.name}</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-md ${
                          tab === "mr"
                            ? "text-indigo-700 bg-indigo-50"
                            : "text-violet-700 bg-violet-50"
                        }`}
                      >
                        {row.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-slate-600">
                      {row.count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-500">No reports found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        No {tab.toUpperCase()} reports available for the selected filter
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
