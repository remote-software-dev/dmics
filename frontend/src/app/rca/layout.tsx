"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function SectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        id="sidebar-overlay"
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm hidden lg:hidden"
      />
      <div className="flex-1 lg:ml-[260px] min-h-screen">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
