// app/supervisor/projects/page.tsx (or your respective path)
"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Loader2 } from "lucide-react";
import { ProjectCard } from "@/components/ui/project-card";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/ErrorState";
import { notify } from "@/components/notificationToaster";
import { ProjectDto } from "@/modules/project/types";
import { PaginationMeta } from "@/shared/utils/pagincation-utils";
import { ProjectSearchPayload } from "@/shared/validation/project";
import { listProjectAction } from "@/Interfaces/getters/project.getters";

export default function ManageProjectsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Filter states
  const [queryInput, setQueryInput] = useState("");
  const [supervisorInput, setSupervisorInput] = useState("");
  const [typeInput, setTypeInput] = useState<"GRADUATION" | "PRE_GRADUATION" | "ALL">("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Fetch projects helper
  const fetchProjects = (page: number, searchPayload: ProjectSearchPayload) => {
    startTransition(async () => {
      const res = await listProjectAction(searchPayload, page, 10);
      if ("error" in res) {
        notify.error("Failed to load projects", res.error);
      } else {
        setProjects(res.data);
        setPagination(res.pagination);
      }
    });
  };

  // Initial load on mount
  useEffect(() => {
    async function loadInitial() {
      setInitialLoading(true);
      const res = await listProjectAction({}, 1, 10);
      if ("error" in res) {
        setInitialError(res.error);
      } else {
        setProjects(res.data);
        setPagination(res.pagination);
      }
      setInitialLoading(false);
    }
    loadInitial();
  }, []);

  // Handle Filter Form Submit
  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    const searchPayload: ProjectSearchPayload = {
      query: queryInput.trim() || undefined,
      supervisorName: supervisorInput.trim() || undefined,
      projectType: typeInput === "ALL" ? undefined : typeInput,
    };
    fetchProjects(1, searchPayload);
  };

  // Handle Page Change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const searchPayload: ProjectSearchPayload = {
      query: queryInput.trim() || undefined,
      supervisorName: supervisorInput.trim() || undefined,
      projectType: typeInput === "ALL" ? undefined : typeInput,
    };
    fetchProjects(page, searchPayload);
  };

  if (initialLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (initialError) {
    return <ErrorState message={initialError} />;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Project management"
        title="Project catalogue"
        description="Create and maintain structured briefs. Hidden projects remain available to Supervisors but do not appear in student search."
        action={
          <Button className="rounded-xl font-semibold shadow-lg shadow-primary/20" >
            <Link href="/supervisor/projects/new" className="flex gap-2 items-center">
              <Plus size={18} /> New project
            </Link>
          </Button>
        }
      />

      {/* Filter Panel */}
      <form
        onSubmit={handleFilterSubmit}
        className="rounded-[2rem] border border-white/10 bg-card/80 p-5 backdrop-blur-xl shadow-xl grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(170px,.5fr)_180px_auto] md:items-end"
      >
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground" htmlFor="q">
            Search title or description
          </label>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-muted-foreground/70" />
            <input
              id="q"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search catalogue"
              className="w-full rounded-xl border border-border/70 bg-background/50 py-2 pl-9 pr-4 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="supervisor" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Project supervisor
          </label>
          <input
            id="supervisor"
            value={supervisorInput}
            onChange={(e) => setSupervisorInput(e.target.value)}
            placeholder="Name"
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="type" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Project type
          </label>
          <select
            id="type"
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value as any)}
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL" className="bg-card text-foreground">All types</option>
            <option value="GRADUATION" className="bg-card text-foreground">Graduation</option>
            <option value="PRE_GRADUATION" className="bg-card text-foreground">Pre-graduation</option>
          </select>
        </div>

        <Button type="submit" variant="outline" className="rounded-xl border-border/80 font-semibold">
          Filter
        </Button>
      </form>

      {isPending && (
        <div className="flex items-center justify-center p-4 bg-primary/5 rounded-xl">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">Filtering catalogue...</span>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} management />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No project briefs found"
          description="Start by creating a structured brief or widen your search filters."
          action={
            <Button className="rounded-xl font-semibold shadow-lg shadow-primary/20" >
              <Link href="/supervisor/projects/new">Create project</Link>
            </Button>
          }
        />
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 p-4 bg-muted/20 rounded-2xl">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            className="rounded-xl"
          >
            Previous
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}