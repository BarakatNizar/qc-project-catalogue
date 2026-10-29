import type { ReactNode } from "react";
import { requireRole } from "@/core/auth/session";

export default async function SupervisorLayout({ children }: { children: ReactNode }) {
  await requireRole("SUPERVISOR");

  return (
    <div className="page-shell py-10 sm:py-14 space-y-8 lg:px-8 xl:px-12 ">
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
          Supervisor workspace
        </p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Manage the shared project catalogue and student accounts.
        </p>
      </div>

      <div>
        <div>{children}</div>
      </div>
    </div>
  );
}