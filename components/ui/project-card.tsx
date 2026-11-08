
import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Images,
  Layers3,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { ProjectListItem } from "@/modules/project/types";

export function ProjectCard({
  project,
  management = false,
  locale
}: {
  project: ProjectListItem;
  management?: boolean;
  locale: Locale;
}) {
  const isGraduationProject = project.projectType === "GRADUATION";
  const isVisible = project.visibility === "VISIBLE";

  const supervisorName =
    project.projectSupervisorName?.trim() ||
    t(locale, "supervisorNotAssigned");

  const projectHref = management
    ? `/supervisor/projects/${project.id}`
    : `/projects/${project.id}`;

  const image = project.images[0];

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-muted/60 to-secondary/20 sm:h-44">
        {image ? (
          <img
            src={`/projects/${project.id}/images/${image.id}`}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="relative grid size-16 place-items-center rounded-2xl border border-primary/20 bg-background/75 text-primary shadow-sm">
            <Layers3 size={27} aria-hidden="true" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/[0.03]"
        />

        <div className="absolute inset-x-3 top-3 flex min-w-0 items-start justify-between gap-2">
          <Badge
            variant="outline"
            className={`max-w-[75%] rounded-full border-border/70 px-3 py-4 text-[15px] font-semibold text-foreground shadow-sm backdrop-blur-sm 
              ${isGraduationProject? "bg-primary/20" : "bg-neutral/20"}`}
          >
            {isGraduationProject
              ? t(locale, "graduationProject")
              : t(locale, "preGraduationProject")}
          </Badge>

          {management ? (
            <Badge
              variant="outline"
              className={`shrink-0 gap-1 rounded-full border px-2.5 py-3 text-[14px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm ${
                isVisible
                  ? "border-success  bg-success-content text-success"
                  : "border-error bg-error-content text-error"
              }`}
            >
              {isVisible ? (
                <Eye size={12} aria-hidden="true" />
              ) : (
                <EyeOff size={12} aria-hidden="true" />
              )}
              {isVisible
                ? t(locale, "visible")
                : t(locale, "hidden")}
            </Badge>
          ) : null}
        </div>

        {management && !isVisible ? (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/95 px-2.5 py-1.5 text-[16px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            <EyeOff size={13} aria-hidden="true" />
            <span>{t(locale, "notShownInStudentSearch")}</span>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex min-w-0 items-start gap-2 text-[16px] text-muted-foreground">
          <UserRound
            size={14}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <p className="min-w-0 break-words leading-5 [overflow-wrap:anywhere]">
            <span className="font-medium text-muted-foreground">
              {t(locale, "projectSupervisor")}
            </span>
            <span aria-hidden="true"> · </span>
            <span className="font-semibold text-foreground/80">
              {supervisorName}
            </span>
          </p>
        </div>

        <h2 className="break-words text-base font-bold leading-snug tracking-tight text-foreground sm:text-lg [overflow-wrap:anywhere]">
          <Link
            href={projectHref}
            className="no-underline outline-none after:absolute after:inset-0 after:z-0 focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {project.title}
          </Link>
        </h2>

        <p className="mt-2.5 line-clamp-3 min-w-0 flex-1 break-words text-lg leading-6 text-muted-foreground [overflow-wrap:anywhere]">
          {project.summary}
        </p>

        {project.technologies.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-[14px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t(locale, "technologiesLabel")}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {project.technologies.slice(0, 3).map((technology) => (
                <Badge
                  key={technology.name}
                  variant="secondary"
                  className="max-w-full rounded-lg border border-border/60 bg-muted/50 px-2.5 py-1 text-[16px] font-medium text-muted-foreground"
                >
                  <span className="break-words [overflow-wrap:anywhere]">
                    {technology.name}
                  </span>
                </Badge>
              ))}

              {project.technologies.length > 3 ? (
                <Badge
                  variant="secondary"
                  className="rounded-lg border border-border/60 bg-muted/50 px-2.5 py-1 text-[16px] font-semibold text-muted-foreground"
                  aria-label={t(locale, "additionalTechnologiesAria").replace(
                    "{count}",
                    String(project.technologies.length - 3)
                  )}
                >
                  +{project.technologies.length - 3}
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
          <div className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/35 px-2.5 py-2">
            <Images
              size={15}
              className="shrink-0 text-primary"
              aria-hidden="true"
            />

            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-foreground">
                {project.counts.images}
              </p>
              <p className="text-[15px] leading-4 text-muted-foreground">
                {t(locale, "projectImages")}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/35 px-2.5 py-2">
            <Sparkles
              size={15}
              className="shrink-0 text-primary"
              aria-hidden="true"
            />

            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-foreground">
                {project.counts.suggestions}
              </p>
              <p className="text-[15px] leading-4 text-muted-foreground">
                {t(locale, "aiSuggestions")}
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-[16px] font-medium text-muted-foreground">
            {t(locale, "viewProjectDetails")}
          </span>

          <span className="grid size-8 place-items-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-colors group-hover:border-primary/25 group-hover:bg-primary/5 group-hover:text-primary">
            <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
