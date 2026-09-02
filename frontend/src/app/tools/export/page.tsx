"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Download } from "lucide-react";
import { Province } from "@/lib/types";

export default function ExportDataPage() {
  const { token } = useAuth();
  const [campaignType, setCampaignType] = useState<"mr" | "opv" | "both">("both");
  const [fileFormat, setFileFormat] = useState<"csv" | "excel">("csv");
  const [provinceId, setProvinceId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_BASE}/api/v1/provinces/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => {});
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const params = new URLSearchParams({
        campaign_type: campaignType,
        format: fileFormat,
      });
      if (provinceId) params.set("province_id", provinceId);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(
        `${API_BASE}/api/v1/reports/export?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Export failed");
      }

      setSuccess(
        `Export generated successfully (${fileFormat.toUpperCase()} format). Your download will begin shortly.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Export Data</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Type
              </label>
              <div className="flex gap-4">
                {(["mr", "opv", "both"] as const).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="campaignType"
                      value={type}
                      checked={campaignType === type}
                      onChange={() => setCampaignType(type)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    {type === "mr"
                      ? "MR"
                      : type === "opv"
                        ? "OPV"
                        : "Both"}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                File Format
              </label>
              <select
                value={fileFormat}
                onChange={(e) =>
                  setFileFormat(e.target.value as "csv" | "excel")
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Province
            </label>
            <select
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Provinces</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {loading ? "Generating..." : "Generate Export"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
