"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/api";

interface District {
  id: number;
  name: string;
}

export default function EditSubdistrictPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [districts, setDistricts] = useState<District[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    district_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (!token || !id) return;
    const headers = { Authorization: "Bearer " + token };
    Promise.all([
      fetch(`${API_BASE}/api/v1/subdistricts/${id}`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/districts/", { headers }).then((r) => r.json()),
    ])
      .then(([subData, distData]) => {
        setForm({
          code: subData.code || "",
          name: subData.name || "",
          district_id: subData.district_id?.toString() || "",
          is_active: subData.is_active ?? true,
        });
        setDistricts(Array.isArray(distData) ? distData : distData.items || []);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/v1/subdistricts/${id}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          district_id: Number(form.district_id),
          is_active: form.is_active,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update subdistrict");
      }
      router.push("/geographic/subdistricts");
    } catch (e: any) {
      setError(e.message || "Failed to update subdistrict");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading subdistrict...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Subdistrict</h1>
        <p className="text-slate-500 text-sm mt-1">Update subdistrict information</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <select
              name="district_id"
              value={form.district_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
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
            href="/geographic/subdistricts"
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
