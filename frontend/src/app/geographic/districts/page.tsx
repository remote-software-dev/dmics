"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/api";

interface District {
  id: number;
  code: string;
  province_id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

interface Province {
  id: number;
  name: string;
}

export default function DistrictsPage() {
  const { token } = useAuth();
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: "Bearer " + token };
      const [distRes, provRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/districts/`, { headers }),
        fetch(`${API_BASE}/api/v1/provinces/`, { headers }),
      ]);
      if (!distRes.ok) throw new Error("Failed to fetch districts");
      const distData = await distRes.json();
      const provData = await provRes.json();
      setDistricts(Array.isArray(distData) ? distData : distData.items || []);
      setProvinces(Array.isArray(provData) ? provData : provData.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load districts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getProvinceName = (provinceId: number) => {
    return provinces.find((p) => p.id === provinceId)?.name || "-";
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this district?")) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/districts/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to delete district");
      setDistricts(districts.filter((d) => d.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete district");
    }
  };

  const filtered = districts.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchProvince = filterProvince ? d.province_id === Number(filterProvince) : true;
    return matchSearch && matchProvince;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading districts...</div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Districts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage district data</p>
        </div>
        <Link
          href="/geographic/districts/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Create New
        </Link>
      </div>

      <div className="bg-white rounded-md shadow-sm p-4 flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search districts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={filterProvince}
          onChange={(e) => setFilterProvince(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All Provinces</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Code</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Province</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Active</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                  No data found
                </td>
              </tr>
            ) : (
              filtered.map((district) => (
                <tr key={district.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{district.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{district.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getProvinceName(district.province_id)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${district.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {district.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Link
                      href={`/geographic/districts/${district.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(district.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
