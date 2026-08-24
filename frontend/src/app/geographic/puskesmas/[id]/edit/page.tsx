"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Province {
  id: number;
  name: string;
}

interface District {
  id: number;
  province_id: number;
  name: string;
}

interface Subdistrict {
  id: number;
  district_id: number;
  name: string;
}

export default function EditPuskesmasPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [allDistricts, setAllDistricts] = useState<District[]>([]);
  const [allSubdistricts, setAllSubdistricts] = useState<Subdistrict[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    province_id: "",
    district_id: "",
    subdistrict_id: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (!token || !id) return;
    const headers = { Authorization: "Bearer " + token };
    Promise.all([
      fetch(`/api/v1/puskesmas/${id}`, { headers }).then((r) => r.json()),
      fetch("/api/v1/provinces/", { headers }).then((r) => r.json()),
      fetch("/api/v1/districts/", { headers }).then((r) => r.json()),
      fetch("/api/v1/subdistricts/", { headers }).then((r) => r.json()),
    ])
      .then(([pusData, provData, distData, subData]) => {
        setForm({
          code: pusData.code || "",
          name: pusData.name || "",
          province_id: pusData.province_id?.toString() || "",
          district_id: pusData.district_id?.toString() || "",
          subdistrict_id: pusData.subdistrict_id?.toString() || "",
          address: pusData.address || "",
          latitude: pusData.latitude?.toString() || "",
          longitude: pusData.longitude?.toString() || "",
        });
        setProvinces(Array.isArray(provData) ? provData : provData.items || []);
        setAllDistricts(Array.isArray(distData) ? distData : distData.items || []);
        setAllSubdistricts(Array.isArray(subData) ? subData : subData.items || []);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, id]);

  const filteredDistricts = form.province_id
    ? allDistricts.filter((d) => d.province_id === Number(form.province_id))
    : [];

  const filteredSubdistricts = form.district_id
    ? allSubdistricts.filter((s) => s.district_id === Number(form.district_id))
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "province_id") {
        updated.district_id = "";
        updated.subdistrict_id = "";
      }
      if (name === "district_id") {
        updated.subdistrict_id = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/v1/puskesmas/${id}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          province_id: Number(form.province_id),
          district_id: Number(form.district_id),
          subdistrict_id: Number(form.subdistrict_id),
          address: form.address || null,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update puskesmas");
      }
      router.push("/geographic/puskesmas");
    } catch (e: any) {
      setError(e.message || "Failed to update puskesmas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading puskesmas...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Puskesmas</h1>
        <p className="text-slate-500 text-sm mt-1">Update puskesmas information</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Province</label>
            <select
              name="province_id"
              value={form.province_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Province</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <select
              name="district_id"
              value={form.district_id}
              onChange={handleChange}
              required
              disabled={!form.province_id}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100"
            >
              <option value="">Select District</option>
              {filteredDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subdistrict</label>
            <select
              name="subdistrict_id"
              value={form.subdistrict_id}
              onChange={handleChange}
              required
              disabled={!form.district_id}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100"
            >
              <option value="">Select Subdistrict</option>
              {filteredSubdistricts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <Link
            href="/geographic/puskesmas"
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
