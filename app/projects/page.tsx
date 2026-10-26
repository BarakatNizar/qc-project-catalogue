import Link from "next/link";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { requireRole } from "@/core/auth/session";
import { projectService } from "@/modules/project/services/project-service";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/ui/project-card"; 
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ProjectCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireRole("STUDENT");
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const supervisorName = typeof params.supervisor === "string" ? params.supervisor : "";
  const projectType = params.type === "GRADUATION" || params.type === "PRE_GRADUATION" ? params.type : undefined ;

  const projects =( await projectService.listProject(actor, { query, supervisorName, projectType })).data;

  return (
    <div className="page-shell py-10 sm:py-14 space-y-8">
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

      {params.error && <Alert type="error">{String(params.error)}</Alert>}

      {/* Filter Panel */}
      <form
        method="get"
        className="rounded-[2rem] border border-white/10 bg-card/80 p-5 backdrop-blur-xl shadow-xl grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,.5fr)_190px_auto] md:items-end"
      >
        <div className="space-y-1.5">
          <label htmlFor="q" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Search projects
          </label>
          <div className="relative flex items-center">
            <Search size={17} className="absolute left-3.5 text-muted-foreground/70" />
            <input
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Title, summary, or description"
              className="w-full rounded-xl border border-border/70 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="supervisor" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Project supervisor
          </label>
          <input
            id="supervisor"
            name="supervisor"
            defaultValue={supervisorName}
            placeholder="Name"
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="type" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Project type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={projectType}
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL" className="bg-card text-foreground">All types</option>
            <option value="GRADUATION" className="bg-card text-foreground">Graduation</option>
            <option value="PRE_GRADUATION" className="bg-card text-foreground">Pre-graduation</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1 rounded-xl font-semibold shadow-lg shadow-primary/20 gap-2">
            <SlidersHorizontal size={16} /> Filter
          </Button>
          <Button variant="ghost" className="rounded-xl font-semibold">
            <Link href="/projects" aria-label="Reset filters">
              <RotateCcw size={16} />
            </Link>
          </Button>
        </div>
      </form>

      {/* Catalogue Grid */}
      {projects.length ? (
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