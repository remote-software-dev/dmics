"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of immunization campaign progress" },
  "/reports/province": { title: "Province Reports", subtitle: "Vaccination data aggregated by province" },
  "/reports/district": { title: "District Reports", subtitle: "Vaccination data aggregated by district" },
  "/reports/puskesmas": { title: "Puskesmas Reports", subtitle: "Vaccination data aggregated by puskesmas" },
  "/reports/daily": { title: "Daily Reports", subtitle: "Daily vaccination submission overview" },
  "/data-entry/submit": { title: "Submit Report", subtitle: "Enter new vaccination data" },
  "/data-entry/revision": { title: "Data Revision", subtitle: "Review and edit submitted reports" },
  "/rca": { title: "RCA Reports", subtitle: "Root Cause Analysis reports" },
  "/rca/create": { title: "Create RCA Report", subtitle: "Submit a new RCA report" },
  "/geographic/provinces": { title: "Provinces", subtitle: "Manage province data" },
  "/geographic/districts": { title: "Districts", subtitle: "Manage district data" },
  "/geographic/subdistricts": { title: "Subdistricts", subtitle: "Manage subdistrict data" },
  "/geographic/puskesmas": { title: "Puskesmas", subtitle: "Manage puskesmas data" },
  "/tools/upload": { title: "Upload Data", subtitle: "Import data from files" },
  "/tools/export": { title: "Export Data", subtitle: "Download data in various formats" },
  "/tools/not-reported": { title: "Not Reported", subtitle: "Puskesmas that have not submitted reports" },
  "/tools/codelist": { title: "Code Reference", subtitle: "Geographic code reference list" },
  "/tools/contact": { title: "Contact Us", subtitle: "Questions or feedback" },
};

export default function Header() {
  const pathname = usePathname();
  const info = pageTitles[pathname] || { title: "DMICS", subtitle: "" };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{info.title}</h1>
            {info.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{info.subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
