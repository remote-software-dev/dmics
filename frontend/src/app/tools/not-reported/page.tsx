"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";
import { Puskesmas, District, Province } from "@/lib/types";

interface NotReportedEntry {
  puskesmas: Puskesmas;
  districtName: string;
  provinceName: string;
}

export default function NotReportedPage() {
  const { token } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<NotReportedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    setFetched(false);

    try {
      const API_BASE =
        process.env.NEXT_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };

      const [puskesmasRes, districtsRes, provincesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/puskesmas/`, { headers }).then((r) =>
          r.json()
        ),
        fetch(`${API_BASE}/api/v1/districts/`, { headers }).then((r) =>
          r.json()
        ),
        fetch(`${API_BASE}/api/v1/provinces/`, { headers }).then((r) =>
          r.json()
        ),
      ]);

      const allPuskesmas: Puskesmas[] = puskesmasRes;
      const allDistricts: District[] = districtsRes;
      const allProvinces: Province[] = provincesRes;

      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      let reportedIds: Set<string> = new Set();
      try {
        const [mrRes, opvRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/reports/mr/recent?size=10000&${params}`, {
            headers,
          }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/reports/opv/recent?size=10000&${params}`, {
            headers,
          }).then((r) => r.json()),
        ]);
        const mrItems = mrRes.items || [];
        const opvItems = opvRes.items || [];
        reportedIds = new Set([
          ...mrItems.map((r: { id_puskesmas: string }) => r.id_puskesmas),
          ...opvItems.map((r: { id_puskesmas: string }) => r.id_puskesmas),
        ]);
      } catch {
        // If reports endpoint fails, show all as not reported
      }

      const districtMap = new Map(allDistricts.map((d) => [d.id, d]));
      const provinceMap = new Map(allProvinces.map((p) => [p.id, p]));

      const notReported = allPuskesmas
        .filter((p) => !reportedIds.has(p.id))
        .map((p) => ({
          puskesmas: p,
          districtName: districtMap.get(p.district_id)?.name || "Unknown",
          provinceName:
            provinceMap.get(districtMap.get(p.district_id)?.province_id || "")
              ?.name || "Unknown",
        }));

      setResults(notReported);
      setFetched(true);
    } catch {
      setError("Failed to load data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Not Reported Puskesmas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Puskesmas that have not submitted reports for the selected period.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {fetched && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              {results.length} Puskesmas Not Reported
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              All puskesmas have reported for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Puskesmas Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Province
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {results.map((entry, idx) => (
                    <tr key={entry.puskesmas.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {entry.puskesmas.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {entry.districtName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {entry.provinceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          Not Reported
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
