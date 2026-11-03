
"use client";

import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
} from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/ui/project-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ProjectDto } from "@/modules/project/types";
import type { ProjectSearchPayload } from "@/shared/validation/project";
import { listProjectAction } from "@/Interfaces/getters/project.getters";
import { notify } from "../notificationToaster";

import { t, type Locale } from "@/shared/i18n/dictionary";

const PAGE_SIZE = 10;

export default function ProjectCatalogPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);

  const [queryInput, setQueryInput] = useState("");
  const [supervisorInput, setSupervisorInput] = useState("");
  const [typeInput, setTypeInput] = useState<
    "ALL" | "GRADUATION" | "PRE_GRADUATION"
  >("ALL");

  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const languageCookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith("qc_locale"));

    const language = languageCookie?.split("=")[1];

    setLocale(language === "ar" ? "ar" : "en");
  }, []);

  const buildSearchPayload = useCallback(
    (
      query: string,
      supervisorName: string,
      projectType: string
    ): ProjectSearchPayload => ({
      query: query.trim() || undefined,
      supervisorName: supervisorName.trim() || undefined,
      projectType:
        projectType === "ALL"
          ? undefined
          : (projectType as "GRADUATION" | "PRE_GRADUATION"),
    }),
    []
  );

  const loadProjects = useCallback(
    async (filters: ProjectSearchPayload = {}) => {
      setIsPending(true);
      setError(null);

      try {
        const result = await listProjectAction(filters, 1, PAGE_SIZE);

        if ("error" in result) {
          const errorMessage =
            result.error || t(locale, "projectCatalogLoadError");

          setError(errorMessage);
          notify.error(t(locale, "projectCatalogErrorTitle"), errorMessage);
          setProjects([]);
          return;
        }

        setProjects(result.data);
      } catch {
        setError(t(locale, "projectCatalogLoadError"));
        setProjects([]);
      } finally {
        setIsPending(false);
      }
    },
    [locale]
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleFilterSubmit = () => {
    const filters = buildSearchPayload(
      queryInput,
      supervisorInput,
      typeInput
    );

    void loadProjects(filters);
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleFilterSubmit();
    }
  };

  const handleResetFilters = () => {
    setQueryInput("");
    setSupervisorInput("");
    setTypeInput("ALL");

    void loadProjects({});
  };

  return (
    <div className="page-shell space-y-8 py-10 sm:py-14">
      <PageHeading
        eyebrow={t(locale, "projectCatalogue")}
        title={t(locale, "exploreProjectIdeas")}
        description={t(locale, "projectCatalogDesc")}
        action={
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-[16px] font-bold text-primary backdrop-blur-md"
          >
            {projects.length}{" "}
            {projects.length === 1
              ? t(locale, "projectResultSingular")
              : t(locale, "projectResultPlural")}
          </Badge>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      {/* Filter Panel */}
      <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-card/80 p-5 shadow-xl backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_minmax(180px,.5fr)_190px_auto] md:items-end">
        <div className="space-y-1.5">
          <label
            htmlFor="q"
            className="text-[16px] py-1 font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t(locale, "searchProjects")}
          </label>

          <div className="relative flex items-center">
            <Search
              size={17}
              className="absolute left-3.5 text-muted-foreground/70"
            />

            <input
              id="q"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t(locale, "searchPlaceholder")}
              className="mt-2 w-full rounded-xl border border-border/70 bg-background/50 py-2.5 pl-10 pr-4 text-lg font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="supervisor"
            className="text-[16px] py-1 font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t(locale, "projectSupervisor")}
          </label>

          <input
            id="supervisor"
            value={supervisorInput}
            onChange={(event) => setSupervisorInput(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t(locale, "namePlaceholder")}
            className="mt-2 w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-lg font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="type"
            className="text-[16px] py-1 font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t(locale, "projectTypeLabel")}
          </label>

          <select
            id="type"
            value={typeInput}
            onChange={(event) =>
              setTypeInput(
                event.target.value as
                  | "ALL"
                  | "GRADUATION"
                  | "PRE_GRADUATION"
              )
            }
            className="mt-2 w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-lg font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL" className="bg-card text-foreground">
              {t(locale, "allTypes")}
            </option>

            <option value="GRADUATION" className="bg-card text-foreground">
              {t(locale, "graduationProject")}
            </option>

            <option
              value="PRE_GRADUATION"
              className="bg-card text-foreground"
            >
              {t(locale, "preGraduation")}
            </option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleFilterSubmit}
            disabled={isPending}
            className="btn-lg flex-1 gap-2 text-lg rounded-xl font-semibold shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SlidersHorizontal size={18} />
            )}
            {t(locale, "filterButton")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleResetFilters}
            disabled={isPending}
            className="rounded-xl font-semibold"
            aria-label={t(locale, "resetFilters")}
            title={t(locale, "resetFilters")}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>

      {/* Catalogue Grid */}
      {isPending ? (
        <div className="flex min-h-56 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard locale={locale} key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t(locale, "noMatchingProjects")}
          description={t(locale, "noMatchingProjectsDesc")}
        />
      )}
    </div>
  );
}
