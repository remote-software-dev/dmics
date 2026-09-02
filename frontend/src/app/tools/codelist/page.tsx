"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import { Province, District, Subdistrict, Puskesmas } from "@/lib/types";

export default function CodelistPage() {
  const { token } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(
    new Set()
  );
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(
    new Set()
  );
  const [expandedSubdistricts, setExpandedSubdistricts] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const API_BASE =
          process.env.NEXT_API_URL || "http://localhost:8000";
        const [provRes, distRes, subRes, puskRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/provinces/`, { headers }).then((r) =>
            r.json()
          ),
          fetch(`${API_BASE}/api/v1/districts/`, { headers }).then((r) =>
            r.json()
          ),
          fetch(`${API_BASE}/api/v1/subdistricts/`, { headers }).then((r) =>
            r.json()
          ),
          fetch(`${API_BASE}/api/v1/puskesmas/`, { headers }).then((r) =>
            r.json()
          ),
        ]);
        setProvinces(provRes);
        setDistricts(distRes);
        setSubdistricts(subRes);
        setPuskesmasList(puskRes);
      } catch {
        setError("Failed to load geographic data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const q = search.toLowerCase();

  function matchesSearch(
    name: string,
    code: string,
    children?: { name: string; code: string }[]
  ): boolean {
    if (name.toLowerCase().includes(q) || code.toLowerCase().includes(q))
      return true;
    if (children) return children.some((c) => matchesSearch(c.name, c.code));
    return false;
  }

  function toggleProvince(id: string) {
    setExpandedProvinces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDistrict(id: string) {
    setExpandedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSubdistrict(id: string) {
    setExpandedSubdistricts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading geographic data...</div>
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

  const filteredProvinces = provinces.filter((p) => {
    if (!q) return true;
    const provDistricts = districts.filter((d) => d.province_id === p.id);
    return matchesSearch(
      p.name,
      p.code,
      provDistricts.map((d) => ({ name: d.name, code: d.code }))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Geographic Code Reference
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Reference list of codes for provinces, districts, subdistricts, and
          puskesmas.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 divide-y divide-slate-200">
        {filteredProvinces.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No results found.
          </div>
        )}

        {filteredProvinces.map((province) => {
          const provDistricts = districts.filter(
            (d) => d.province_id === province.id
          );
          const isProvExpanded = expandedProvinces.has(province.id);
          return (
            <div key={province.id}>
              <button
                onClick={() => toggleProvince(province.id)}
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 text-left"
              >
                {isProvExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span className="text-xs font-mono text-slate-400 w-16 flex-shrink-0">
                  {province.code}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {province.name}
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  {provDistricts.length} districts
                </span>
              </button>

              {isProvExpanded && (
                <div className="bg-slate-50 border-t border-slate-100">
                  {provDistricts.map((district) => {
                    const distSubdistricts = subdistricts.filter(
                      (s) => s.district_id === district.id
                    );
                    const isDistExpanded = expandedDistricts.has(district.id);
                    return (
                      <div key={district.id}>
                        <button
                          onClick={() => toggleDistrict(district.id)}
                          className="w-full flex items-center gap-3 pl-14 pr-6 py-3 hover:bg-slate-100 text-left"
                        >
                          {isDistExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="text-xs font-mono text-slate-400 w-16 flex-shrink-0">
                            {district.code}
                          </span>
                          <span className="text-sm text-slate-700">
                            {district.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">
                            {distSubdistricts.length} subdistricts
                          </span>
                        </button>

                        {isDistExpanded && (
                          <div className="bg-white border-t border-slate-100">
                            {distSubdistricts.map((subdistrict) => {
                              const subPuskesmas = puskesmasList.filter(
                                (p) => p.subdistrict_id === subdistrict.id
                              );
                              const isSubExpanded =
                                expandedSubdistricts.has(subdistrict.id);
                              return (
                                <div key={subdistrict.id}>
                                  <button
                                    onClick={() =>
                                      toggleSubdistrict(subdistrict.id)
                                    }
                                    className="w-full flex items-center gap-3 pl-[8.5rem] pr-6 py-2.5 hover:bg-slate-50 text-left"
                                  >
                                    {isSubExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-mono text-slate-400 w-16 flex-shrink-0">
                                      {subdistrict.code}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                      {subdistrict.name}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-auto">
                                      {subPuskesmas.length} puskesmas
                                    </span>
                                  </button>

                                  {isSubExpanded && (
                                    <div className="border-t border-slate-100">
                                      {subPuskesmas.length === 0 && (
                                        <div className="pl-[12rem] pr-6 py-2 text-xs text-slate-400 italic">
                                          No puskesmas
                                        </div>
                                      )}
                                      {subPuskesmas.map((p) => (
                                        <div
                                          key={p.id}
                                          className="flex items-center gap-3 pl-[12rem] pr-6 py-2"
                                        >
                                          <span className="text-xs font-mono text-slate-400 w-16 flex-shrink-0">
                                            {p.code}
                                          </span>
                                          <span className="text-sm text-slate-500">
                                            {p.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
