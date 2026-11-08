"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  FolderKanban,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";

import { ProjectCard } from "@/components/ui/project-card";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/ErrorState";
import { notify } from "@/components/notificationToaster";
import type { ProjectData, ProjectListItem } from "@/modules/project/types";
import type { PaginationMeta } from "@/shared/utils/pagincation-utils";
import type { ProjectSearchPayload } from "@/shared/validation/project";
import { listProjectAction } from "@/Interfaces/getters/project.getters";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { Badge } from "../ui/badge";

type ProjectTypeFilter = "GRADUATION" | "PRE_GRADUATION" | "ALL";

const PAGE_SIZE = 10;

function buildSearchPayload(
  query: string,
  supervisorName: string,
  projectType: ProjectTypeFilter,
): ProjectSearchPayload {
  return {
    query: query.trim() || undefined,
    supervisorName: supervisorName.trim() || undefined,
    projectType: projectType === "ALL" ? undefined : projectType,
  };
}

function LoadingSkeleton({ locale }: { locale: Locale }) {
  return (
    <main
      className="w-full min-w-0 space-y-6 px-3 pb-8 pt-3 sm:px-5 lg:px-8 2xl:px-10"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{t(locale, "loadingProjectCatalogue")}</span>

      <div className="animate-pulse rounded-2xl border border-border/70 bg-card p-5 sm:p-8">
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="mt-4 h-8 w-72 max-w-full rounded-lg bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-muted" />
        <div className="mt-2 h-4 w-3/4 max-w-xl rounded bg-muted" />
        <div className="mt-6 h-11 w-36 rounded-xl bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-border/70 bg-card"
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card"
          >
            <div className="h-40 animate-pulse bg-muted/70" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function ProjectCatalogPage({locale, isSupervisor}:{locale:Locale, isSupervisor?:boolean}) {

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [queryInput, setQueryInput] = useState("");
  const [supervisorInput, setSupervisorInput] = useState("");
  const [typeInput, setTypeInput] = useState<ProjectTypeFilter>("ALL");

  const [appliedFilters, setAppliedFilters] =
    useState<ProjectSearchPayload>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Prevent older requests from overwriting newer results.
  const requestIdRef = useRef(0);

  const loadProjects = useCallback(
    async (
      page: number,
      searchPayload: ProjectSearchPayload,
      isInitialRequest = false,
    ) => {
      const requestId = ++requestIdRef.current;

      if (isInitialRequest) {
        setInitialLoading(true);
        setInitialError(null);
      } else {
        setIsPending(true);
      }

      try {
        const result = await listProjectAction(
          searchPayload,
          page,
          PAGE_SIZE,
        );

        if (requestId !== requestIdRef.current) return;

        if ("error" in result) {
          if (isInitialRequest) {
            setInitialError(result.error ?? null);
          } else {
            notify.error(
              t(locale, "failedToLoadProjectsTitle"),
              result.error,
            );
          }
          return;
        }

        setProjects(result.data);
        setPagination(result.pagination);
        setInitialError(null);
      } catch {
        if (requestId !== requestIdRef.current) return;

        const message = t(locale, "unexpectedProjectLoadingError");

        if (isInitialRequest) {
          setInitialError(message);
        } else {
          notify.error(t(locale, "failedToLoadProjectsTitle"), message);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setInitialLoading(false);
          setIsPending(false);
        }
      }
    },
    [locale],
  );

  useEffect(() => {
    void loadProjects(1, {}, true);

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadProjects]);

  const handleFilterSubmit = () => {
    const filters = buildSearchPayload(
      queryInput,
      supervisorInput,
      typeInput,
    );

    setAppliedFilters(filters);
    setCurrentPage(1);
    void loadProjects(1, filters);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleFilterSubmit();
    }
  };

  const handleClearFilters = () => {
    setQueryInput("");
    setSupervisorInput("");
    setTypeInput("ALL");

    const filters: ProjectSearchPayload = {};
    setAppliedFilters(filters);
    setCurrentPage(1);
    void loadProjects(1, filters);
  };

  const handlePageChange = (page: number) => {
    if (
      isPending ||
      !pagination ||
      page < 1 ||
      page > pagination.totalPages ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);
    void loadProjects(page, appliedFilters);
  };

  const activeFilterCount = [
    appliedFilters.query,
    appliedFilters.supervisorName,
    appliedFilters.projectType,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;
  const totalCount = pagination?.totalCount ?? projects.length;

  const pageStart =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  const appliedFilterLabels = [
    appliedFilters.query
      ? {
          label: `${t(locale, "searchFilterPrefix")}: ${appliedFilters.query}`,
          key: "query",
        }
      : null,
    appliedFilters.supervisorName
      ? {
          label: `${t(locale, "supervisorFilterPrefix")}: ${appliedFilters.supervisorName}`,
          key: "supervisor",
        }
      : null,
    appliedFilters.projectType
      ? {
          label:
            appliedFilters.projectType === "GRADUATION"
              ? t(locale, "graduationProjectType")
              : t(locale, "preGraduationProjectType"),
          key: "type",
        }
      : null,
  ].filter((item) => item !== null);

  if (initialLoading) {
    return <LoadingSkeleton locale={locale} />;
  }

  if (initialError) {
    return <ErrorState message={initialError} />;
  }

  return (
    <main className="w-full min-w-0 space-y-6 px-3 pb-10 pt-3 sm:space-y-7 sm:px-5 lg:px-8 2xl:px-10">
      {/* Page header */}
      <header className="relative isolate overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.12] via-card to-card">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-9">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[15px] font-bold uppercase tracking-wide text-primary">
              <FolderKanban size={16} />
              {isSupervisor ? t(locale, "supervisorWorkspaceLabel") : t(locale, "projectCatalogue")}
            </div>

            <h1 className="break-words text-2xl font-black sm:text-3xl lg:text-4xl">
              {isSupervisor ? t(locale, "projectCatalogueTitle") : t(locale, "exploreProjectIdeas")}
            </h1>

            <p className="mt-3 max-w-4xl text-lg leading-8 text-muted-foreground font-semibold">
              {isSupervisor ? t(locale, "projectCataloguePageDesc") : t(locale, "projectCatalogDesc")}
            </p>
          </div>

          {isSupervisor? <Link
            href="/supervisor/projects/new"
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            <Plus size={17} />
            {t(locale, "createProjectButton")}
          </Link>: 
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
        </div>

        <div className="grid grid-cols-2 border-t border-border/60 bg-background/20 sm:grid-cols-4">
          <div className="border-r border-border/60 p-4 sm:px-5 sm:py-4">
            <p className="text-[16px] text-muted-foreground font-semibold">
              {t(locale, "matchingProjectsMetric")}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums">
              {totalCount.toLocaleString(locale === "ar" ? "ar" : "en")}
            </p>
          </div>

          <div className="p-4 sm:border-r sm:border-border/60 sm:px-5 sm:py-4">
            <p className="text-[16px] text-muted-foreground font-semibold">
              {t(locale, "currentPageMetric")}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums">
              {(pagination?.currentPage ?? 1).toLocaleString(
                locale === "ar" ? "ar" : "en",
              )}
            </p>
          </div>

          <div className="border-r border-t border-border/60 p-4 sm:border-t-0 sm:px-5 sm:py-4">
            <p className="text-[16px] text-muted-foreground font-semibold">
              {t(locale, "pageSizeMetric")}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums">
              {PAGE_SIZE.toLocaleString(locale === "ar" ? "ar" : "en")}
            </p>
          </div>

          <div className="border-t border-border/60 p-4 sm:border-t-0 sm:px-5 sm:py-4">
            <p className="text-[16px] text-muted-foreground font-semibold">
              {t(locale, "activeFiltersMetric")}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums">
              {activeFilterCount.toLocaleString(locale === "ar" ? "ar" : "en")}
            </p>
          </div>
        </div>
      </header>

      {/* Search and filters */}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex min-w-0 items-start gap-3 border-b border-border/60 p-4 sm:p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/70 bg-background text-primary">
            <SlidersHorizontal size={18} />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="font-bold">
              {t(locale, "findProjectHeading")}
            </h2>
            <p className="mt-1 text-lg leading-6 text-muted-foreground font-semibold">
              {t(locale, "findProjectDescription")}
            </p>
          </div>

          {hasActiveFilters && <BadgeFallback count={activeFilterCount} locale={locale} />}
        </div>

        <section className="p-4 sm:p-5">
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(200px,0.7fr)]">
            {/* Project search */}
            <div className="min-w-0 space-y-2">
              <label
                htmlFor="project-query"
                className="text-lg font-semibold"
              >
                {t(locale, "searchProjectsLabel")}
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold"
                />
                <input
                  id="project-query"
                  name="query"
                  type="search"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t(locale, "projectSearchPlaceholder")}
                  className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-border bg-background pl-10 pr-3.5 text-lg outline-none transition-shadow placeholder:text-muted-foreground font-semibold 70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
              </div>
            </div>

            {/* Supervisor name */}
            <div className="min-w-0 space-y-2">
              <label
                htmlFor="project-supervisor"
                className="text-lg font-semibold"
              >
                {t(locale, "projectSupervisorLabel")}
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold"
                />
                <input
                  id="project-supervisor"
                  name="supervisor"
                  type="text"
                  value={supervisorInput}
                  onChange={(event) =>
                    setSupervisorInput(event.target.value)
                  }
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t(locale, "supervisorNamePlaceholder")}
                  className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-border bg-background pl-10 pr-3.5 text-lg outline-none transition-shadow placeholder:text-muted-foreground font-semibold 70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
              </div>
            </div>

            {/* Project type */}
            <div className="min-w-0 space-y-2">
              <label
                htmlFor="project-type"
                className="text-lg font-semibold"
              >
                {t(locale, "projectTypeLabel")}
              </label>

              <select
                id="project-type"
                name="projectType"
                value={typeInput}
                onChange={(event) =>
                  setTypeInput(event.target.value as ProjectTypeFilter)
                }
                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3.5 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <option value="ALL">
                  {t(locale, "allProjectTypesOption")}
                </option>
                <option value="GRADUATION">
                  {t(locale, "graduationProjectType")}
                </option>
                <option value="PRE_GRADUATION">
                  {t(locale, "preGraduationProjectType")}
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {hasActiveFilters ? (
                <>
                  <span className="text-[16px] text-muted-foreground font-semibold">
                    {t(locale, "appliedFiltersLabel")}
                  </span>
                  {appliedFilterLabels.map((item) =>
                    item ? (
                      <span
                        key={item.key}
                        className="inline-flex max-w-full items-center rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-[16px] font-medium text-foreground"
                      >
                        <span className="break-words">{item.label}</span>
                      </span>
                    ) : null,
                  )}
                </>
              ) : (
                <p className="text-[16px] text-muted-foreground font-semibold">
                  {t(locale, "noFiltersAppliedMessage")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearFilters}
                  disabled={isPending}
                  className="min-h-10 gap-2 rounded-xl"
                >
                  <RotateCcw size={14} />
                  {t(locale, "resetFiltersButton")}
                </Button>
              )}

              <Button
                type="button"
                onClick={handleFilterSubmit}
                disabled={isPending}
                className="min-h-11 w-full gap-2 rounded-xl px-5 sm:w-auto"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Filter size={16} />
                )}
                {isPending
                  ? t(locale, "updatingCatalogueButton")
                  : t(locale, "applyFiltersButton")}
              </Button>
            </div>
          </div>
        </section>
      </section>

      {/* Results */}
      <section
        aria-labelledby="project-results-heading"
        className="min-w-0 space-y-5"
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="project-results-heading"
                className="text-xl font-black sm:text-2xl"
              >
                {t(locale, "projectBriefsHeading")}
              </h2>

              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[16px] font-semibold text-primary">
                  <Check size={12} />
                  {t(locale, "filteredResultsLabel")}
                </span>
              )}
            </div>

            <p className="mt-1 text-lg leading-6 text-muted-foreground font-semibold">
              {totalCount === 0
                ? t(locale, "noMatchingProjectsFound")
                : t(locale, "showingProjectsRange")
                    .replace("{start}", pageStart.toLocaleString(locale === "ar" ? "ar" : "en"))
                    .replace("{end}", pageEnd.toLocaleString(locale === "ar" ? "ar" : "en"))
                    .replace("{total}", totalCount.toLocaleString(locale === "ar" ? "ar" : "en"))}
            </p>
          </div>

          <p className="shrink-0 text-[16px] text-muted-foreground font-semibold">
            {pagination && pagination.totalPages > 0
              ? t(locale, "pageOfPages")
                  .replace(
                    "{current}",
                    pagination.currentPage.toLocaleString(locale === "ar" ? "ar" : "en"),
                  )
                  .replace(
                    "{total}",
                    pagination.totalPages.toLocaleString(locale === "ar" ? "ar" : "en"),
                  )
              : t(locale, "catalogueOverviewLabel")}
          </p>
        </div>

        {isPending && (
          <div
            className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-lg text-muted-foreground font-semibold"
            role="status"
            aria-live="polite"
          >
            <Loader2
              size={16}
              className="shrink-0 animate-spin text-primary"
            />
            {t(locale, "updatingCatalogueMessage")}
          </div>
        )}

        {projects.length > 0 ? (
          <div
            className={`grid min-w-0 grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 sm:gap-5 xl:grid-cols-3  ${
              isPending ? "opacity-60" : "opacity-100"
            }`}
            aria-busy={isPending}
          >
            {projects.map((project) => (
              <ProjectCard
              locale={locale}
                key={project.id}
                project={project}
                management={isSupervisor}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-5 py-12 text-center sm:py-16">
            <span className="grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <FolderKanban size={25} />
            </span>

            <h3 className="mt-5 text-lg font-bold">
              {hasActiveFilters
                ? t(locale, "noMatchingProjectBriefsTitle")
                : t(locale, "emptyProjectCatalogueTitle")}
            </h3>

            <p className="mt-2 max-w-md text-lg leading-6 text-muted-foreground font-semibold">
              {hasActiveFilters
                ? t(locale, "noMatchingProjectBriefsDesc")
                : t(locale, "emptyProjectCatalogueDesc")}
            </p>

            <div className="mt-5 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="min-h-10 gap-2 rounded-xl"
                >
                  <X size={15} />
                  {t(locale, "clearFiltersButton")}
                </Button>
              ) : null}

              {!hasActiveFilters && (
                <Button className="min-h-10 gap-2 rounded-xl">
                  <Link href="/supervisor/projects/new">
                    <Plus size={16} />
                    {t(locale, "createProjectButton")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <nav
            aria-label={t(locale, "projectCataloguePaginationAria")}
            className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <p className="text-lg text-muted-foreground font-semibold">
              {t(locale, "pageLabel")}{" "}
              <span className="font-bold text-foreground">
                {pagination.currentPage.toLocaleString(locale === "ar" ? "ar" : "en")}
              </span>{" "}
              {t(locale, "ofLabel")}{" "}
              <span className="font-bold text-foreground">
                {pagination.totalPages.toLocaleString(locale === "ar" ? "ar" : "en")}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button
                type="button"
                variant="outline"
                disabled={!pagination.hasPreviousPage || isPending}
                onClick={() => handlePageChange(currentPage - 1)}
                className="min-h-10 gap-2 rounded-xl px-4"
              >
                <ChevronLeft size={16} />
                {t(locale, "previousPageButton")}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!pagination.hasNextPage || isPending}
                onClick={() => handlePageChange(currentPage + 1)}
                className="min-h-10 gap-2 rounded-xl px-4"
              >
                {t(locale, "nextPageButton")}
                <ChevronRight size={16} />
              </Button>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}

function BadgeFallback({
  count,
  locale,
}: {
  count: number;
  locale: Locale;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[16px] font-semibold text-primary">
      <Filter size={12} />
      {count.toLocaleString(locale === "ar" ? "ar" : "en")}
    </span>
  );
}
