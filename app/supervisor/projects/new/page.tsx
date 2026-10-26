import { requireRole } from "@/core/auth/session";
import { ProjectForm } from "@/components/project-form";
import { PageHeading } from "@/components/ui/page-heading";

export default async function NewProjectPage() {
  await requireRole("SUPERVISOR");

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="New brief"
        title="Create a project"
        description="Capture the core idea, scope, and technology stack so students can understand the project without needing a complete report."
      />
      <ProjectForm />
    </div>
  );
}