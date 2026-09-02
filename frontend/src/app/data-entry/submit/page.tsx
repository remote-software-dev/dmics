"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";
import { Province, District, Puskesmas, Subdistrict } from "@/lib/types";
import { API_BASE } from "@/lib/api";

export default function SubmitReportPage() {
  const { token } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [campaignType, setCampaignType] = useState<"mr" | "opv">("mr");
  const [balita, setBalita] = useState<number>(0);
  const [dashboardReporter, setDashboardReporter] = useState("");
  const [channel, setChannel] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [allDistricts, setAllDistricts] = useState<District[]>([]);
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [allPuskesmas, setAllPuskesmas] = useState<Puskesmas[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [allSubdistricts, setAllSubdistricts] = useState<Subdistrict[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedPuskesmas, setSelectedPuskesmas] = useState("");
  const [selectedSubdistrict, setSelectedSubdistrict] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [provRes, distRes, puskRes, subRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/provinces/`, { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/districts/`, { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/puskesmas/`, { headers }).then((r) => r.json()),
          fetch(`${API_BASE}/api/v1/subdistricts/`, { headers }).then((r) => r.json()),
        ]);
        setProvinces(provRes);
        setAllDistricts(distRes);
        setAllPuskesmas(puskRes);
        setAllSubdistricts(subRes);
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
      setSelectedPuskesmas("");
      setSelectedSubdistrict("");
      setPuskesmasList([]);
      setSubdistricts([]);
    }
  }, [selectedProvince, allDistricts]);

  useEffect(() => {
    if (selectedDistrict) {
      setPuskesmasList(allPuskesmas.filter((p) => p.district_id === selectedDistrict));
      setSubdistricts(allSubdistricts.filter((s) => s.district_id === selectedDistrict));
      setSelectedPuskesmas("");
      setSelectedSubdistrict("");
    }
  }, [selectedDistrict, allPuskesmas, allSubdistricts]);

  const selectedPuskesmasObj = allPuskesmas.find((p) => p.id === selectedPuskesmas);
  const selectedDistrictObj = allDistricts.find((d) => d.id === selectedDistrict);
  const selectedProvinceObj = provinces.find((p) => p.id === selectedProvince);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const body = {
      date,
      subdistrict_code: allSubdistricts.find((s) => s.id === selectedSubdistrict)?.code || "",
      id_puskesmas: selectedPuskesmas,
      dashboard_reporter: dashboardReporter,
      channel,
      province: selectedProvinceObj?.name || "",
      district: selectedDistrictObj?.name || "",
      puskesmas: selectedPuskesmasObj?.name || "",
      ...(campaignType === "mr" ? { balita_mr: balita } : { balita_opv: balita }),
    };

    const endpoint = campaignType === "mr" ? "/api/v1/reports/mr" : "/api/v1/reports/opv";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to submit report");
      }
      setSuccess("Report submitted successfully!");
      setBalita(0);
      setDashboardReporter("");
      setChannel("");
      setSelectedPuskesmas("");
      setSelectedSubdistrict("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading reference data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Submit Report</h1>

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
              <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="campaignType"
                    value="mr"
                    checked={campaignType === "mr"}
                    onChange={() => setCampaignType("mr")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  MR
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="campaignType"
                    value="opv"
                    checked={campaignType === "opv"}
                    onChange={() => setCampaignType("opv")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  OPV
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Province</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select province</option>
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
                required
                disabled={!selectedProvince}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              >
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Puskesmas</label>
              <select
                value={selectedPuskesmas}
                onChange={(e) => setSelectedPuskesmas(e.target.value)}
                required
                disabled={!selectedDistrict}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              >
                <option value="">Select puskesmas</option>
                {puskesmasList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subdistrict</label>
              <select
                value={selectedSubdistrict}
                onChange={(e) => setSelectedSubdistrict(e.target.value)}
                required
                disabled={!selectedDistrict}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              >
                <option value="">Select subdistrict</option>
                {subdistricts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Balita Vaccinated</label>
              <input
                type="number"
                min={0}
                value={balita}
                onChange={(e) => setBalita(Number(e.target.value))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dashboard Reporter</label>
              <input
                type="text"
                value={dashboardReporter}
                onChange={(e) => setDashboardReporter(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Reporter name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Channel</label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g. posyandu, puskesmas"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
