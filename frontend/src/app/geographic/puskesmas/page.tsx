"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Puskesmas {
  id: number;
  code: string;
  name: string;
  province_id: number;
  district_id: number;
  subdistrict_id: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

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
  name: string;
}

export default function PuskesmasPage() {
  const { token } = useAuth();
  const [puskesmas, setPuskesmas] = useState<Puskesmas[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: "Bearer " + token };
      const [pusRes, provRes, distRes, subRes] = await Promise.all([
        fetch("/api/v1/puskesmas/", { headers }),
        fetch("/api/v1/provinces/", { headers }),
        fetch("/api/v1/districts/", { headers }),
        fetch("/api/v1/subdistricts/", { headers }),
      ]);
      if (!pusRes.ok) throw new Error("Failed to fetch puskesmas");
      const pusData = await pusRes.json();
      const provData = await provRes.json();
      const distData = await distRes.json();
      const subData = await subRes.json();
      setPuskesmas(Array.isArray(pusData) ? pusData : pusData.items || []);
      setProvinces(Array.isArray(provData) ? provData : provData.items || []);
      setDistricts(Array.isArray(distData) ? distData : distData.items || []);
      setSubdistricts(Array.isArray(subData) ? subData : subData.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load puskesmas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getProvinceName = (id: number) => provinces.find((p) => p.id === id)?.name || "-";
  const getDistrictName = (id: number) => districts.find((d) => d.id === id)?.name || "-";
  const getSubdistrictName = (id: number) => subdistricts.find((s) => s.id === id)?.name || "-";

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this puskesmas?")) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/puskesmas/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to delete puskesmas");
      setPuskesmas(puskesmas.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete puskesmas");
    }
  };

  const filtered = puskesmas.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchProvince = filterProvince ? p.province_id === Number(filterProvince) : true;
    const matchDistrict = filterDistrict ? p.district_id === Number(filterDistrict) : true;
    return matchSearch && matchProvince && matchDistrict;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading puskesmas...</div>
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
          <h1 className="text-2xl font-bold text-slate-900">Puskesmas</h1>
          <p className="text-slate-500 text-sm mt-1">Manage puskesmas data</p>
        </div>
        <Link
          href="/geographic/puskesmas/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Create New
        </Link>
      </div>

      <div className="bg-white rounded-md shadow-sm p-4 flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search puskesmas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={filterProvince}
          onChange={(e) => {
            setFilterProvince(e.target.value);
            setFilterDistrict("");
          }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All Provinces</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All Districts</option>
          {districts
            .filter((d) => !filterProvince || d.province_id === Number(filterProvince))
            .map((d) => (
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
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Province</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">District</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Subdistrict</th>
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
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{p.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getProvinceName(p.province_id)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getDistrictName(p.district_id)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getSubdistrictName(p.subdistrict_id)}</td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Link
                      href={`/geographic/puskesmas/${p.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
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
