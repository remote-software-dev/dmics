"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  PenTool,
  BarChart3,
  MapPin,
  Wrench,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Reports",
    icon: FileText,
    children: [
      { label: "Province", href: "/reports/province" },
      { label: "District", href: "/reports/district" },
      { label: "Puskesmas", href: "/reports/puskesmas" },
      { label: "Daily", href: "/reports/daily" },
    ],
  },
  {
    label: "Data Entry",
    icon: PenTool,
    children: [
      { label: "Submit Report", href: "/data-entry/submit" },
      { label: "Revision", href: "/data-entry/revision" },
    ],
  },
  {
    label: "RCA",
    icon: BarChart3,
    children: [{ label: "RCA Reports", href: "/rca" }],
  },
  {
    label: "Geographic",
    icon: MapPin,
    children: [
      { label: "Provinces", href: "/geographic/provinces" },
      { label: "Districts", href: "/geographic/districts" },
      { label: "Subdistricts", href: "/geographic/subdistricts" },
      { label: "Puskesmas", href: "/geographic/puskesmas" },
    ],
  },
  {
    label: "Tools",
    icon: Wrench,
    children: [
      { label: "Upload", href: "/tools/upload" },
      { label: "Export", href: "/tools/export" },
      { label: "Not Reported", href: "/tools/not-reported" },
      { label: "Codelist", href: "/tools/codelist" },
      { label: "Contact", href: "/tools/contact" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children?.some((c) => pathname.startsWith(c.href.split("/").slice(0, 2).join("/")))) {
        initial[item.label] = true;
      }
    });
    if (!initial["Reports"] && !initial["Data Entry"] && !initial["RCA"] && !initial["Geographic"] && !initial["Tools"]) {
      // Keep all open by default on first load
      navItems.forEach((item) => {
        if (item.children) initial[item.label] = true;
      });
    }
    return initial;
  });

  function toggleMenu(label: string) {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200/80 transform -translate-x-full lg:translate-x-0 transition-all duration-300 ease-in-out flex flex-col">
      {/* Brand */}
      <div className="flex items-center h-16 px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/25">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">
              DMICS
            </span>
            <span className="block text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wide uppercase">
              Immunization Monitoring
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isChildActive = item.children?.some((c) => pathname.startsWith(c.href));
          const isActive = item.href ? pathname === item.href : isChildActive;
          const isOpen = openMenus[item.label] ?? false;

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="ml-4 mt-0.5 pl-6 border-l-2 border-slate-100 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                          pathname === child.href
                            ? "bg-indigo-50/80 text-indigo-600 font-semibold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                pathname === item.href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  pathname === item.href
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-slate-100 p-3 shrink-0">
        <div className="flex items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-slate-50 transition-colors duration-150">
          <div className="flex items-center min-w-0 gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[13px] font-semibold text-white shrink-0 shadow-sm shadow-indigo-500/20">
              A
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">
                Admin DMICS
              </p>
              <p className="text-[11px] text-slate-400 truncate capitalize">
                admin
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
