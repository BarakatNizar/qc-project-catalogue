import Link from "next/link";
import {
  Activity,
  Compass,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  LucideBriefcase,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { getServerUserFromAccess } from "@/core/auth/session";
import { logoutAction } from "@/Interfaces/actions/auth.actions";
import { PreferencesControls } from "@/components/providers/preferences-controls";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { ProjectBriefingTools } from "./project-briefing-tools";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const getResult = await getServerUserFromAccess();
  const user = !("error" in getResult) ? getResult : undefined;

  const roleLinks =
    user?.role === "ADMIN"
      ? [
        {
          href: "/admin",
          label: t(locale, "overview"),
          icon: LayoutDashboard,
        },
        {
          href: "/admin/supervisors",
          label: t(locale, "supervisors"),
          icon: Users,
        },
        {
          href: "/admin/ai",
          label: t(locale, "aiService"),
          icon: ShieldCheck,
        },
        {
          href: "/admin/ai/logs",
          label: "AI Logs",
          icon: Activity,
        },
      ]
      : user?.role === "SUPERVISOR"
        ? [
          {
            href: "/supervisor",
            label: t(locale, "overview"),
            icon: LayoutDashboard,
          },
          {
            href: "/supervisor/projects",
            label: t(locale, "projects"),
            icon: FolderKanban,
          },
          {
            href: "/supervisor/students",
            label: t(locale, "students"),
            icon: Users,
          },
          {
            href: "/supervisor/ai-logs/",
            label: "AI Logs",
            icon: Activity,
          },
        ]
        : user?.role === "STUDENT"
          ? [
            {
              href: "/projects",
              label: t(locale, "exploreProjects"),
              icon: Search,
            },
            {
              href: "/profile",
              label: t(locale, "myProfile"),
              icon: UserRound,
            },
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

  const mobileLinks = user
    ? roleLinks
    : [
      {
        href: "/projects",
        label: t(locale, "explore"),
        icon: Search,
      },
    ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 shadow-sm shadow-foreground/[0.03] backdrop-blur-xl">
      <div className="page-shell flex min-h-[72px] items-center justify-between gap-3 px-4 md:min-h-[78px] md:gap-5 md:px-6 lg:px-8 xl:px-12">
        {/* Brand */}
        <Link
          href={homeHref}
          className="group flex min-w-0 shrink items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:gap-3"
          aria-label="Qalamoon Compass home"
        >
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-300 group-hover:-rotate-6 sm:size-11">
            <Compass size={22} strokeWidth={2.2} aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/10"
            />
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[16px] font-black tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-[18px]">
              Qalamoon Compass
            </span>
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">
              {t(locale, "subtitle")}
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 xl:flex"
          aria-label="Main navigation"
        >
          {roleLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground 2xl:px-3.5"
            >
              <Icon
                size={16}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          ))}
          {user && <Dialog>
            <DialogTrigger className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground 2xl:px-3.5">
              <LucideBriefcase
                size={16}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              <span> Tools </span>
            </DialogTrigger>
            <DialogContent className={"sm:max-w-4xl  flex"}>
              <ProjectBriefingTools />
            </DialogContent>
          </Dialog>}
          {!user && (
            <Link
              href="/projects"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search
                size={16}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>{t(locale, "explore")}</span>
            </Link>
          )}
        </nav>

        {/* Preferences and account actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <PreferencesControls />

          {user ? (
            <div className="hidden items-center gap-2 border-s border-border/80 ps-3 sm:flex md:gap-3 md:ps-4">
              <div className="hidden max-w-36 min-w-0 xl:block">
                <span className="block truncate text-xs font-bold text-foreground">
                  {user.name}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {user.role.toLowerCase()}
                </span>
              </div>

              <Link
                href="/profile"
                aria-label="Profile"
                title="Profile"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserRound size={17} aria-hidden="true" />
              </Link>

              <form action={logoutAction} className="hidden sm:block">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl border-border bg-card/50 text-xs font-semibold transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span>{t(locale, "signOut")}</span>
                </Button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5"
            >
              {t(locale, "signIn")}
            </Link>
          )}
        </div>
      </div>

      {/* Compact, horizontally scrollable navigation for smaller screens */}
      <div className="border-t border-border/60 bg-card/40 xl:hidden">
        <nav
          className="page-shell flex min-h-11 items-center gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-6 lg:px-8 xl:px-12"
          aria-label="Mobile navigation"
        >
          {mobileLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
            >
              <Icon
                size={14}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          ))}
          {user && <Dialog>
            <DialogTrigger className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground 2xl:px-3.5">
              <LucideBriefcase
                size={16}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              <span> Tools </span>
            </DialogTrigger>
            <DialogContent className={"sm:max-w-4xl  flex"}>
              <ProjectBriefingTools />
            </DialogContent>
          </Dialog>}
          {user && (
            <form
              action={logoutAction}
              className="ms-auto shrink-0 sm:hidden"
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="min-h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:text-destructive"
              >
                <LogOut size={14} aria-hidden="true" />
                <span>{t(locale, "signOut")}</span>
              </Button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}