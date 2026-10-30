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
          setError(result.error);
          setProjects([]);
          return;
        }

        setProjects(result.data);
      } catch {
        setError("Something went wrong while loading projects.");
        setProjects([]);
      } finally {
        setIsPending(false);
      }
    },
    []
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
        eyebrow="Project catalogue"
        title="Explore project ideas"
        description="Browse structured graduation and pre-graduation briefs. Compare goals, scope boundaries, and technologies before choosing a direction for your own work."
        action={
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs font-bold text-primary backdrop-blur-md"
          >
            {projects.length} result{projects.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      {/* Filter Panel */}
      <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-card/80 p-5 shadow-xl backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_minmax(180px,.5fr)_190px_auto] md:items-end">
        <div className="space-y-1.5">
          <label
            htmlFor="q"
            className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Search projects
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
              placeholder="Title, summary, or description"
              className="w-full rounded-xl border border-border/70 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="supervisor"
            className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Project supervisor
          </label>

          <input
            id="supervisor"
            value={supervisorInput}
            onChange={(event) => setSupervisorInput(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Name"
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="type"
            className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Project type
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
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL" className="bg-card text-foreground">
              All types
            </option>
            <option value="GRADUATION" className="bg-card text-foreground">
              Graduation
            </option>
            <option
              value="PRE_GRADUATION"
              className="bg-card text-foreground"
            >
              Pre-graduation
            </option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleFilterSubmit}
            disabled={isPending}
            className="flex-1 gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <SlidersHorizontal size={16} />
            )}
            Filter
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleResetFilters}
            disabled={isPending}
            className="rounded-xl font-semibold"
            aria-label="Reset filters"
            title="Reset filters"
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
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching projects"
          description="Try a broader search or remove one of the filters. Only projects made visible by Supervisors appear here."
        />
      )}
    </div>
  );
}