"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/api";

interface Subdistrict {
  id: number;
  code: string;
  district_id: number;
  name: string;
  is_active: boolean;
}

interface District {
  id: number;
  name: string;
}

export default function SubdistrictsPage() {
  const { token } = useAuth();
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: "Bearer " + token };
      const [subRes, distRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/subdistricts/`, { headers }),
        fetch(`${API_BASE}/api/v1/districts/`, { headers }),
      ]);
      if (!subRes.ok) throw new Error("Failed to fetch subdistricts");
      const subData = await subRes.json();
      const distData = await distRes.json();
      setSubdistricts(Array.isArray(subData) ? subData : subData.items || []);
      setDistricts(Array.isArray(distData) ? distData : distData.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load subdistricts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getDistrictName = (districtId: number) => {
    return districts.find((d) => d.id === districtId)?.name || "-";
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subdistrict?")) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/subdistricts/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to delete subdistrict");
      setSubdistricts(subdistricts.filter((s) => s.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete subdistrict");
    }
  };

  const filtered = subdistricts.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchDistrict = filterDistrict ? s.district_id === Number(filterDistrict) : true;
    return matchSearch && matchDistrict;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading subdistricts...</div>
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
          <h1 className="text-2xl font-bold text-slate-900">Subdistricts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage subdistrict data</p>
        </div>
        <Link
          href="/geographic/subdistricts/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Create New
        </Link>
      </div>

      <div className="bg-white rounded-md shadow-sm p-4 flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search subdistricts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
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
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">District</th>
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
              filtered.map((subdistrict) => (
                <tr key={subdistrict.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{subdistrict.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{subdistrict.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getDistrictName(subdistrict.district_id)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${subdistrict.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {subdistrict.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Link
                      href={`/geographic/subdistricts/${subdistrict.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(subdistrict.id)}
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
