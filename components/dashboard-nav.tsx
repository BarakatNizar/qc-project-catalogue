import Link from "next/link";
import { Activity, FolderKanban, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav({ section }: { section: "admin" | "supervisor" }) {
  const links =
    section === "admin"
      ? [
          { href: "/admin", title: "Overview", icon: LayoutDashboard },
          { href: "/admin/supervisors", title: "Supervisors", icon: Users },
          { href: "/admin/ai", title: "AI service", icon: ShieldCheck },
          { href: "/admin/ai-logs", title: "AI Logs", icon: Activity },
        ]
      : [
          { href: "/supervisor", title: "Overview", icon: LayoutDashboard },
          { href: "/supervisor/projects", title: "Projects", icon: FolderKanban },
          { href: "/supervisor/students", title: "Students", icon: Users },
          { href: "/supervisor/ai-logs", title: "AI Logs", icon: Activity },
        ];

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-card/80 p-4 backdrop-blur-xl shadow-lg h-fit">
      <p className="px-3 pb-3 pt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Workspace
      </p>
      <nav className="flex gap-1.5 overflow-x-auto md:flex-col scrollbar-none">
        {links.map(({ href, title, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary whitespace-nowrap"
            )}
          >
            <Icon size={16} className="text-primary/80" />
            <span>{title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}