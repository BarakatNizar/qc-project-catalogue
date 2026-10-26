import Link from "next/link";
import { Compass, LayoutDashboard, Search, Users, FolderKanban, ShieldCheck, UserRound, LogOut, Activity, BrainCircuit } from "lucide-react";
import { getServerUserFromAccess } from "@/core/auth/session";
import { logoutAction } from "@/Interfaces/actions/auth.actions";
import { PreferencesControls } from "@/components/providers/preferences-controls";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { Button } from "@/components/ui/button";

export async function SiteHeader({ locale }: { locale: Locale }) {

  const getResult = (await getServerUserFromAccess());
  const user = !("error" in getResult) ? getResult : undefined;

  const roleLinks =
    user?.role === "ADMIN"
      ? [
          { href: "/admin", label: t(locale, "overview"), icon: LayoutDashboard },
          { href: "/admin/supervisors", label: t(locale, "supervisors"), icon: Users },
          { href: "/admin/ai", label: t(locale, "aiService"), icon: ShieldCheck },
          { href: "/admin/ai/logs", label: "AI Logs", icon: Activity },
        ]
      : user?.role === "SUPERVISOR"
        ? [
            { href: "/supervisor", label: t(locale, "overview"), icon: LayoutDashboard },
            { href: "/supervisor/projects", label: t(locale, "projects"), icon: FolderKanban },
            { href: "/supervisor/students", label: t(locale, "students"), icon: Users },
            { href: "/supervisor/ai-logs/", label: "AI Logs", icon: Activity },
          ]
        : user?.role === "STUDENT"
          ? [
              { href: "/projects", label: t(locale, "exploreProjects"), icon: Search },
              { href: "/profile", label: t(locale, "myProfile"), icon: UserRound },
            ]
          : [];

  const homeHref =
    user?.role === "STUDENT"
      ? "/projects"
      : user?.role === "SUPERVISOR"
        ? "/supervisor"
        : user?.role === "ADMIN"
          ? "/admin"
          : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 border-b-primary/50 bg-card/75 backdrop-blur-sm transition-all shadow-lg shadow-primary/40 rounded-b-md">
      <div className="page-shell flex min-h-[86px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
        
        {/* SpeedyJob Branded Logo */}
        <Link href={homeHref} className="group flex shrink-0 items-center gap-3.5 transition-all">
          <div className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
            <Compass size={22} className="transition-transform duration-1000 group-hover:-rotate-[400deg]" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 inset-ring" />
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
              Qalamoon Compass
            </span>
            <span className="text-[11px] font-bold tracking-wide text-primary uppercase">
              {t(locale, "subtitle")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Main navigation">
          {roleLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
            >
              <Icon size={16} className="text-primary/90" />
              <span>{label}</span>
            </Link>
          ))}

          {!user && (
            <Link
              href="/projects"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
            >
              <Search size={16} className="text-primary/90" />
              <span>{t(locale, "explore")}</span>
            </Link>
          )}
        </nav>

        {/* User Actions & Preferences Control */}
        <div className="flex items-center gap-3">
          <PreferencesControls />

          {user ? (
            <div className="hidden items-center gap-3 border-l border-border/60 pl-3 sm:flex rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-3">
              <div className="hidden text-right leading-tight xl:block ltr:text-right rtl:text-left">
                <span className="block text-xs font-bold text-foreground">{user.name}</span>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {user.role.toLowerCase()}
                </span>
              </div>

              <Button
                
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl border border-border/80 bg-background/50 hover:border-primary/40"
              >
                <Link href="/profile" aria-label="Profile">
                  <UserRound size={17} className="text-muted-foreground" />
                </Link>
              </Button>

              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/80 font-semibold hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                  <LogOut size={14} />
                  <span>{t(locale, "signOut")}</span>
                </Button>
              </form>
            </div>
          ) : (
            <Button  size="sm" className="rounded-xl px-5 font-semibold shadow-md shadow-primary/20">
              <Link href="/login">{t(locale, "signIn")}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      {user && (
        <div className="border-t border-border/40 bg-card/40 lg:hidden">
          <nav className="page-shell flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none" aria-label="Mobile navigation">
            {roleLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon size={14} className="text-primary" />
                <span>{label}</span>
              </Link>
            ))}
            <form action={logoutAction} className="sm:hidden shrink-0 ml-auto rtl:ml-0 rtl:mr-auto">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                {t(locale, "signOut")}
              </Button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}