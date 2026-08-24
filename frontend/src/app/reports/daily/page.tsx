"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Province, ReportMR, ReportOPV, PaginatedReports } from "@/lib/types";
import { Calendar, FileText, MapPin } from "lucide-react";

interface DailyRow {
  date: string;
  puskesmas: string;
  province: string;
  mrCount: number;
  opvCount: number;
}

export default function DailyReportsPage() {
  const { token } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [mrReports, setMrReports] = useState<ReportMR[]>([]);
  const [opvReports, setOpvReports] = useState<ReportOPV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    async function load() {
      try {
        const [provRes, mrRes, opvRes] = await Promise.all([
          fetch("/api/v1/provinces/", { headers }).then((r) => r.json()),
          fetch("/api/v1/reports/mr/recent?size=10000", { headers }).then((r) => r.json()),
          fetch("/api/v1/reports/opv/recent?size=10000", { headers }).then((r) => r.json()),
        ]);
        setProvinces(provRes);
        setMrReports(((mrRes as PaginatedReports).items || []) as ReportMR[]);
        setOpvReports(((opvRes as PaginatedReports).items || []) as ReportOPV[]);
      } catch {
        setError("Failed to load daily reports.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const combinedRows = useMemo(() => {
    const mrByDate = new Map<string, ReportMR[]>();
    for (const r of mrReports) {
      const dateKey = r.date?.split("T")[0] || r.date;
      if (!mrByDate.has(dateKey)) mrByDate.set(dateKey, []);
      mrByDate.get(dateKey)!.push(r);
    }

    const opvByDate = new Map<string, ReportOPV[]>();
    for (const r of opvReports) {
      const dateKey = r.date?.split("T")[0] || r.date;
      if (!opvByDate.has(dateKey)) opvByDate.set(dateKey, []);
      opvByDate.get(dateKey)!.push(r);
    }

    const allDates = new Set<string>([
      ...Array.from(mrByDate.keys()),
      ...Array.from(opvByDate.keys()),
    ]);
    const rows: DailyRow[] = [];

    for (const date of Array.from(allDates)) {
      const dayMr = mrByDate.get(date) || [];
      const dayOpv = opvByDate.get(date) || [];

      if (provinceFilter) {
        const filteredDayMr = dayMr.filter((r) => r.province === provinceFilter);
        const filteredDayOpv = dayOpv.filter((r) => r.province === provinceFilter);

        const puskesmasMap = new Map<string, DailyRow>();
        for (const r of filteredDayMr) {
          const key = r.puskesmas || "Unknown";
          const existing = puskesmasMap.get(key) || {
            date,
            puskesmas: key,
            province: r.province || "-",
            mrCount: 0,
            opvCount: 0,
          };
          existing.mrCount += r.balita_mr;
          puskesmasMap.set(key, existing);
        }
        for (const r of filteredDayOpv) {
          const key = r.puskesmas || "Unknown";
          const existing = puskesmasMap.get(key) || {
            date,
            puskesmas: key,
            province: r.province || "-",
            mrCount: 0,
            opvCount: 0,
          };
          existing.opvCount += r.balita_opv;
          puskesmasMap.set(key, existing);
        }
        rows.push(...Array.from(puskesmasMap.values()));
      } else {
        const puskesmasMap = new Map<string, DailyRow>();
        for (const r of dayMr) {
          const key = r.puskesmas || "Unknown";
          const existing = puskesmasMap.get(key) || {
            date,
            puskesmas: key,
            province: r.province || "-",
            mrCount: 0,
            opvCount: 0,
          };
          existing.mrCount += r.balita_mr;
          puskesmasMap.set(key, existing);
        }
        for (const r of dayOpv) {
          const key = r.puskesmas || "Unknown";
          const existing = puskesmasMap.get(key) || {
            date,
            puskesmas: key,
            province: r.province || "-",
            mrCount: 0,
            opvCount: 0,
          };
          existing.opvCount += r.balita_opv;
          puskesmasMap.set(key, existing);
        }
        rows.push(...Array.from(puskesmasMap.values()));
      }
    }

    let result = rows.sort((a, b) => {
      if (a.date === b.date) return a.puskesmas.localeCompare(b.puskesmas);
      return b.date.localeCompare(a.date);
    });

    if (dateFrom) result = result.filter((r) => r.date >= dateFrom);
    if (dateTo) result = result.filter((r) => r.date <= dateTo);

    return result;
  }, [mrReports, opvReports, provinceFilter, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading daily reports...</div>
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
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Daily Reports</h1>
            <p className="text-xs text-slate-500">Daily vaccination submission overview</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
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
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="text-sm border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="text-sm border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {combinedRows.length} record{combinedRows.length !== 1 ? "s" : ""} found
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
                  Date
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Puskesmas
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Province
                </th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  MR Count
                </th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  OPV Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedRows.length > 0 ? (
                combinedRows.map((row, idx) => (
                  <tr
                    key={`${row.date}-${row.puskesmas}-${idx}`}
                    className="hover:bg-slate-50/50 transition-colors duration-100"
                  >
                    <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-slate-700">
                        {new Date(row.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">{row.puskesmas}</td>
                    <td className="px-5 py-3 text-slate-600">{row.province}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-md text-indigo-700 bg-indigo-50">
                        {row.mrCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-md text-violet-700 bg-violet-50">
                        {row.opvCount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-500">No reports found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        No daily reports available for the selected filters
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
