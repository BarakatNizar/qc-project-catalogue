import type { ReactNode } from "react";
import { requireRole } from "@/core/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("ADMIN");

  return (
    <div className="page-shell py-10 sm:py-14 space-y-8 px-4 xl:px-5 2xl:px-7">
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Administration</p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Manage Supervisor accounts and QC AI availability.</p>
      </div>

        <div >{children}</div>
    </div>
  );
}