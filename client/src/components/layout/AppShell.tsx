"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

const BARE_ROUTES = ["/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare =
    BARE_ROUTES.includes(pathname) || pathname.startsWith("/meeting/");

  if (isBare) {
    return <div className="min-h-screen bg-app-bg">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-app-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-4">
          <div className="h-full rounded-2xl bg-white shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
