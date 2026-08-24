"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Province {
  id: number;
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export default function ProvincesPage() {
  const { token } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchProvinces = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/v1/provinces/", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to fetch provinces");
      const data = await res.json();
      setProvinces(Array.isArray(data) ? data : data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load provinces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvinces();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this province?")) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/provinces/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to delete province");
      setProvinces(provinces.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete province");
    }
  };

  const filtered = provinces.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading provinces...</div>
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
          <h1 className="text-2xl font-bold text-slate-900">Provinces</h1>
          <p className="text-slate-500 text-sm mt-1">Manage province data</p>
        </div>
        <Link
          href="/geographic/provinces/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Create New
        </Link>
      </div>

      <div className="bg-white rounded-md shadow-sm p-4">
        <input
          type="text"
          placeholder="Search provinces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Code</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Latitude</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Longitude</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Active</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                  No data found
                </td>
              </tr>
            ) : (
              filtered.map((province) => (
                <tr key={province.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{province.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{province.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{province.latitude ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{province.longitude ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${province.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {province.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Link
                      href={`/geographic/provinces/${province.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(province.id)}
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
