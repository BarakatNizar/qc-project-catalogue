import { Compass } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-12 text-center backdrop-blur-xl shadow-xl flex flex-col items-center justify-center min-h-60">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
        <Compass size={26} />
      </div>
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}