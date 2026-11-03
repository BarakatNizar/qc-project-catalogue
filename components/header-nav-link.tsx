"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FolderKanban,
  Languages,
  LayoutDashboard,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

export type IconName =
  | "dashboard"
  | "supervisors"
  | "ai"
  | "translations"
  | "projects"
  | "students"
  | "activity"
  | "search"
  | "profile";

type HeaderNavLinkProps = {
  href: string;
  label: string;
  iconName: IconName;
  isMobile?: boolean;
};

function renderIcon(name: IconName, size: number, className?: string) {
  switch (name) {
    case "dashboard":
      return <LayoutDashboard size={size} className={className} aria-hidden="true" />;
    case "supervisors":
    case "students":
      return <Users size={size} className={className} aria-hidden="true" />;
    case "ai":
      return <ShieldCheck size={size} className={className} aria-hidden="true" />;
    case "translations":
      return <Languages size={size} className={className} aria-hidden="true" />;
    case "projects":
      return <FolderKanban size={size} className={className} aria-hidden="true" />;
    case "activity":
      return <Activity size={size} className={className} aria-hidden="true" />;
    case "search":
      return <Search size={size} className={className} aria-hidden="true" />;
    case "profile":
      return <UserRound size={size} className={className} aria-hidden="true" />;
    default:
      return null;
  }
}

export function HeaderNavLink({ href, label, iconName, isMobile = false }: HeaderNavLinkProps) {
  const pathname = usePathname();

  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || (pathname.startsWith(href) && href !== "/admin" && href !== "/supervisor");

  if (isMobile) {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`relative inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold transition-all duration-200 ${
          isActive
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
            : "border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
        }`}
      >
        {renderIcon(
          iconName,
          15,
          `shrink-0 transition-colors ${isActive ? "text-primary-foreground" : "text-primary"}`
        )}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-[16px] font-bold transition-all duration-200 2xl:px-4 ${
        isActive
          ? "bg-primary/15 text-primary shadow-xs ring-1 ring-primary/30"
          : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
      }`}
    >
      {renderIcon(
        iconName,
        22,
        `shrink-0 transition-transform duration-200 ${
          isActive ? "scale-110 text-primary" : "text-muted-foreground group-hover:text-primary"
        }`
      )}
      <span>{label}</span>

      {isActive && (
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary shadow-sm shadow-primary/50"
        />
      )}
    </Link>
  );
}