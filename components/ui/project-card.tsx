import Link from "next/link";
import { ArrowUpRight, Image as ImageIcon, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjectType, ProjectVisibility } from "@prisma/client";

type CardProject = {
  id: string;
  title: string;
  summary: string;
  projectSupervisorName: string;
  projectType: ProjectType;
  visibility: ProjectVisibility;
  technologies: { name: string }[];
  images: { id: string; mimeType: string }[];
  counts: { images: number; suggestions: number };
};

export function ProjectCard({ project, management = false }: { project: CardProject; management?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
      {/* Thumbnail Header */}
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/40 via-muted/30 to-card">
        {project.images[0] ? (
          <img
            src={`/projects/${project.id}/images/${project.images[0].id}`}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid size-14 place-items-center rounded-2xl border border-primary/20 bg-background/60 text-primary shadow-inner">
            <Layers3 size={24} />
          </div>
        )}
        <Badge variant="outline" className="absolute left-3.5 top-3.5 rounded-full border-border/60 bg-background/85 px-3 py-1 font-mono text-[12px] font-semibold backdrop-blur-md">
          {project.projectType === "GRADUATION" ? "Graduation project" : "Pre-graduation"}
        </Badge>
        {management && (
          <Badge className={`absolute right-3.5 top-3.5 rounded-full font-mono text-[12px] font-semibold uppercase tracking-wider ${project.visibility === "VISIBLE" ? "bg-primary-content/70 text-primary border border-primary/30" : "bg-muted text-muted-foreground"}`}>
            {project.visibility.toLowerCase()}
          </Badge>
        )}
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-6">
        <p className="font-mono text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
          Supervisor · {project.projectSupervisorName}
        </p>
        <h2 className="text-lg font-bold leading-snug tracking-tight">
          <Link className="no-underline after:absolute after:inset-0 text-foreground transition-colors group-hover:text-primary" href={`${management ? "/supervisor/projects" : "/projects"}/${project.id}`}>
            {project.title}
          </Link>
        </h2>
        <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {project.summary}
        </p>

        {project.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 3).map((technology) => (
              <Badge key={technology.name} variant="secondary" className="rounded-lg bg-background/60 border border-border/50 text-[12px] font-medium">
                {technology.name}
              </Badge>
            ))}
            {project.technologies.length > 3 && (
              <Badge variant="secondary" className="rounded-lg bg-background/60 border border-border/50 text-[12px] font-medium">
                +{project.technologies.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <ImageIcon size={14} className="text-primary/70" /> {project.counts.images} images
          </span>
          <span className="flex items-center gap-1.5">
            {project.counts.suggestions} suggestions
          </span>
          <ArrowUpRight size={16} className="text-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </article>
  );
}