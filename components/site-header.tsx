import Link from "next/link";
import {
  Compass,
  LogOut,
  LucideBriefcase,
  UserRound,
} from "lucide-react";

import { getServerUserFromAccess } from "@/core/auth/session";
import { logoutAction } from "@/Interfaces/actions/auth.actions";
import { PreferencesControls } from "@/components/providers/preferences-controls";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { ProjectBriefingTools } from "./project-briefing-tools";
import { HeaderNavLink, type IconName } from "./header-nav-link";

export async function SiteHeader({ locale, theme }: { locale: Locale; theme?: "qc-dark" | "qc-light" }) {
  const getResult = await getServerUserFromAccess();
  const user = !("error" in getResult) ? getResult : undefined;

  const roleLinks: Array<{ href: string; label: string; iconName: IconName }> =
    user?.role === "ADMIN"
      ? [
          {
            href: "/admin",
            label: t(locale, "overview"),
            iconName: "dashboard",
          },
          {
            href: "/admin/supervisors",
            label: t(locale, "supervisors"),
            iconName: "supervisors",
          },
          {
            href: "/admin/ai",
            label: t(locale, "aiService"),
            iconName: "ai",
          },
          {
            href: "/admin/translations",
            label: locale === "en" ? "Translation Service" : "خدمة الترجمة",
            iconName: "translations",
          },
        ]
      : user?.role === "SUPERVISOR"
        ? [
            {
              href: "/supervisor",
              label: t(locale, "overview"),
              iconName: "dashboard",
            },
            {
              href: "/supervisor/projects",
              label: t(locale, "projects"),
              iconName: "projects",
            },
            {
              href: "/supervisor/students",
              label: t(locale, "students"),
              iconName: "students",
            },
            {
              href: "/supervisor/ai-logs",
              label: "AI Logs",
              iconName: "activity",
            },
          ]
        : user?.role === "STUDENT"
          ? [
              {
                href: "/projects",
                label: t(locale, "exploreProjects"),
                iconName: "search",
              },
              {
                href: "/profile",
                label: t(locale, "myProfile"),
                iconName: "profile",
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
          iconName: "search" as IconName,
        },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-primary/20 bg-card/80 shadow-sm backdrop-blur-xl">
      <div className="page-shell flex min-h-[92px] items-center justify-between gap-3 px-4 md:min-h-[106px] md:gap-5 md:px-6 lg:px-8 xl:px-12">
        {/* Brand */}
        <Link
          href={homeHref}
          className="group flex min-w-0 shrink items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:gap-3"
          aria-label="Qalamoon Compass home"
        >
          {theme ? (
            <img
              src={
                theme === "qc-dark"
                  ? "/branding/qc-logo-dark.svg"
                  : "/branding/qc-logo-light.svg"
              }
              alt="Qalamoon Compass"
              className="h-14 w-auto"
            />
          ) : (
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-300 group-hover:-rotate-[400deg] sm:size-13">
              <Compass size={30} strokeWidth={2} aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/10"
              />
            </span>
          )}

          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[18px] font-black tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-[20px]">
              Qalamoon Compass
            </span>
            <span className="truncate text-[12px] font-bold uppercase tracking-wide text-muted-foreground sm:text-[14px]">
              {t(locale, "subtitle")}
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1.5 2xl:flex"
          aria-label="Main navigation"
        >
          {roleLinks.map((link) => (
            <HeaderNavLink key={link.href} {...link} />
          ))}

          {user && (
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground 2xl:px-4">
                <LucideBriefcase
                  size={18}
                  className="shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{locale === "en" ? "Tools" : "أدوات"}</span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-6xl flex">
                <ProjectBriefingTools locale={locale} />
              </DialogContent>
            </Dialog>
          )}

          {!user && <HeaderNavLink href="/projects" label={t(locale, "explore")} iconName="search" />}
        </nav>

        {/* Preferences and account actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <PreferencesControls />

          {user ? (
            <div className="hidden items-center gap-2 border-s border-border/80 ps-3 sm:flex md:gap-3 md:ps-4">
              <div className="hidden max-w-36 min-w-0 xl:block">
                <span className="block truncate text-[15px] font-bold text-foreground">
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
                  className="gap-1.5 py-4 rounded-xl border-border bg-card/50 text-[15px] font-semibold transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span>{t(locale, "signOut")}</span>
                </Button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-primary px-3.5 text-[15px] font-bold text-primary-foreground shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5"
            >
              {t(locale, "signIn")}
            </Link>
          )}
        </div>
      </div>

      {/* Compact, horizontally scrollable navigation for smaller screens */}
      <div className="border-t border-border/60 bg-card/40 2xl:hidden">
        <nav
          className="page-shell flex min-h-11 items-center gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-6 lg:px-8 xl:px-12"
          aria-label="Mobile navigation"
        >
          {mobileLinks.map((link) => (
            <HeaderNavLink key={link.href} {...link} isMobile />
          ))}

          {user && (
            <Dialog>
              <DialogTrigger className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
                <LucideBriefcase
                  size={15}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>Tools</span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-6xl flex">
                <ProjectBriefingTools locale={locale} />
              </DialogContent>
            </Dialog>
          )}

          {user && (
            <form
              action={logoutAction}
              className="ms-auto shrink-0 sm:hidden"
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="min-h-8 gap-1.5 rounded-lg px-3 text-[15px] font-semibold text-muted-foreground hover:text-destructive"
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