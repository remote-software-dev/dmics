"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { Province, District, ReportMR, ReportOPV } from "@/lib/types";
import { API_BASE } from "@/lib/api";

export default function RCAReportsPage() {
  const { token } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [allDistricts, setAllDistricts] = useState<District[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [activeTab, setActiveTab] = useState<"mr" | "opv">("mr");

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
          fetch(`${API_BASE}/api/v1/provinces/`, { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/districts/`, { headers }).then((r) => r.json()),
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

  useEffect(() => {
    if (!token) return;
    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [mrRes, opvRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/reports/mr/recent?page=1&size=100`, { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/reports/opv/recent?page=1&size=100`, { headers }).then((r) => r.json()),
        ]);
        setMrReports(mrRes.items || []);
        setOpvReports(opvRes.items || []);
      } catch {
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [token]);

  function filterReports<T extends { province?: string | null; district?: string | null }>(reports: T[]): T[] {
    let filtered = reports;
    if (selectedProvince) {
      const provObj = provinces.find((p) => p.id === selectedProvince);
      if (provObj) filtered = filtered.filter((r) => r.province === provObj.name);
    }
    if (selectedDistrict) {
      const distObj = allDistricts.find((d) => d.id === selectedDistrict);
      if (distObj) filtered = filtered.filter((r) => r.district === distObj.name);
    }
    return filtered;
  }

  const filteredMr = filterReports(mrReports);
  const filteredOpv = filterReports(opvReports);
  const activeReports = activeTab === "mr" ? filteredMr : filteredOpv;
  const valueField = activeTab === "mr" ? "balita_mr" : "balita_opv";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">RCA Reports</h1>
        <Link
          href="/rca/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("mr")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "mr"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          MR Reports
        </button>
        <button
          onClick={() => setActiveTab("opv")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "opv"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          OPV Reports
        </button>
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
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Province</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">District</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Puskesmas</th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Balita</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading reports...
                  </td>
                </tr>
              ) : activeReports.length > 0 ? (
                activeReports.map((report, idx) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors duration-100">
                    <td className="px-5 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-700">
                      {new Date(report.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{report.province || "-"}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{report.district || "-"}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{report.puskesmas || "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-md ${
                        activeTab === "mr" ? "text-indigo-700 bg-indigo-50" : "text-violet-700 bg-violet-50"
                      }`}>
                        {(report as unknown as Record<string, number>)[valueField]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{report.channel || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No reports found
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
