"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Province, District, ReportMR, ReportOPV } from "@/lib/types";
import { API_BASE } from "@/lib/api";

export default function DataRevisionPage() {
  const { token } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [allDistricts, setAllDistricts] = useState<District[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [mrReports, setMrReports] = useState<ReportMR[]>([]);
  const [opvReports, setOpvReports] = useState<ReportOPV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [provRes, distRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/provinces/", { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/districts/", { headers }).then((r) => r.json()),
        ]);
        setProvinces(provRes);
        setAllDistricts(distRes);
      } catch {
        setError("Failed to load reference data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  useEffect(() => {
    if (selectedProvince) {
      setDistricts(allDistricts.filter((d) => d.province_id === selectedProvince));
      setSelectedDistrict("");
    }
  }, [selectedProvince, allDistricts]);

  async function loadReports() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [mrRes, opvRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/reports/mr/recent?page=1&size=100", { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/reports/opv/recent?page=1&size=100", { headers }).then((r) => r.json()),
      ]);
      let mrItems: ReportMR[] = mrRes.items || [];
      let opvItems: ReportOPV[] = opvRes.items || [];

      if (filterDate) {
        mrItems = mrItems.filter((r) => r.date === filterDate);
        opvItems = opvItems.filter((r) => r.date === filterDate);
      }
      if (selectedDistrict) {
        const distObj = allDistricts.find((d) => d.id === selectedDistrict);
        if (distObj) {
          mrItems = mrItems.filter((r) => r.district === distObj.name);
          opvItems = opvItems.filter((r) => r.district === distObj.name);
        }
      }
      if (selectedProvince) {
        const provObj = provinces.find((p) => p.id === selectedProvince);
        if (provObj) {
          mrItems = mrItems.filter((r) => r.province === provObj.name);
          opvItems = opvItems.filter((r) => r.province === provObj.name);
        }
      }

      setMrReports(mrItems);
      setOpvReports(opvItems);
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && token) loadReports();
  }, [filterDate, selectedProvince, selectedDistrict]);

  const allReports = [
    ...mrReports.map((r) => ({ ...r, _type: "MR" as const })),
    ...opvReports.map((r) => ({ ...r, _type: "OPV" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Data Revision</h1>

      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Data can only be revised before 17:00 on the same day
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Province</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All provinces</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedProvince}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            onClick={loadReports}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Puskesmas</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Campaign</th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading reports...
                  </td>
                </tr>
              ) : allReports.length > 0 ? (
                allReports.map((report, idx) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors duration-100">
                    <td className="px-5 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-700">
                      {new Date(report.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{report.puskesmas || "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md ${
                        report._type === "MR" ? "text-indigo-700 bg-indigo-50" : "text-violet-700 bg-violet-50"
                      }`}>
                        {report._type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-slate-800">
                      {report._type === "MR" ? (report as unknown as Record<string, number>).balita_mr : (report as unknown as Record<string, number>).balita_opv}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        Revise
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                    No reports found for the selected filters
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
