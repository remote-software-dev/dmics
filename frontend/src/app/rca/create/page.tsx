"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Save } from "lucide-react";
import { Puskesmas } from "@/lib/types";
import { API_BASE } from "@/lib/api";

export default function CreateRCAReportPage() {
  const { token } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [village, setVillage] = useState("");
  const [selectedPuskesmas, setSelectedPuskesmas] = useState("");
  const [seen, setSeen] = useState<number>(0);
  const [immunized, setImmunized] = useState<number>(0);
  const [unimmunized, setUnimmunized] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [source, setSource] = useState("");
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);

  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const puskRes = await fetch(`${API_BASE}/api/v1/puskesmas/", { headers }).then((r) => r.json());
        setPuskesmasList(puskRes);
      } catch {
        setError("Failed to load puskesmas data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const selectedPuskesmasObj = puskesmasList.find((p) => p.id === selectedPuskesmas);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const body = {
      date,
      subdistrict_code: "",
      id_puskesmas: selectedPuskesmas,
      dashboard_reporter: "",
      channel: "rca",
      province: "",
      district: "",
      puskesmas: selectedPuskesmasObj?.name || "",
      balita_mr: immunized,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/reports/mr", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create RCA report");
      }
      setSuccess("RCA report created successfully!");
      setVillage("");
      setSelectedPuskesmas("");
      setSeen(0);
      setImmunized(0);
      setUnimmunized(0);
      setReason("");
      setSource("");
      setLatitude(0);
      setLongitude(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading puskesmas data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Create RCA Report</h1>

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
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Village</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Village name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Puskesmas</label>
            <select
              value={selectedPuskesmas}
              onChange={(e) => setSelectedPuskesmas(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select puskesmas</option>
              {puskesmasList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Seen</label>
              <input
                type="number"
                min={0}
                value={seen}
                onChange={(e) => setSeen(Number(e.target.value))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Immunized</label>
              <input
                type="number"
                min={0}
                value={immunized}
                onChange={(e) => setImmunized(Number(e.target.value))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unimmunized</label>
              <input
                type="number"
                min={0}
                value={unimmunized}
                onChange={(e) => setUnimmunized(Number(e.target.value))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Reason for unimmunized"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Data source"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Saving..." : "Save Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
