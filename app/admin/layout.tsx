import type { ReactNode } from "react";
import { requireRole } from "@/core/auth/session";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("ADMIN");

  return (
    <div className="page-shell py-10 sm:py-14 space-y-8 px-4 md:px-6 lg:px-8 xl:px-12">
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Administration</p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Manage Supervisor accounts and QC AI availability.</p>
      </div>

      <div className=" ">
      {/* <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]"> */}
        {/* <DashboardNav section="admin" /> */}

        <div className="min-w-0 space-y-6 ">{children}</div>
      </div>
    </div>
  );
}