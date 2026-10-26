import { ProjectForm } from "@/components/project-form"; 
import { PageHeading } from "@/components/ui/page-heading";
import { getProjectByIdAction } from "@/Interfaces/getters/project.getters";
import ErrorState from "@/components/ErrorState";

export default async function EditProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const {projectId} = await params;
  const getProjectResult = await getProjectByIdAction(projectId);
  if ("error" in getProjectResult){
    return <ErrorState message={getProjectResult.error}/>
  }
  const { data, user } = getProjectResult;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Edit brief"
        title="Update project"
        description="Keep the project overview, scope boundaries, and technologies accurate and useful."
      />
      <ProjectForm project={data} />
    </div>
  );
}