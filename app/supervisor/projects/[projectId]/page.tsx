import { getProjectByIdAction } from "@/Interfaces/getters/project.getters";
import ErrorState from "@/components/ErrorState";
import { ProjectDetails } from "@/components/project-details";

export default async function SupervisorProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const {projectId} = await params;
  const getProjectResult = await getProjectByIdAction(projectId);
  if ("error" in getProjectResult){
    return <ErrorState message={getProjectResult.error}/>
  }
  const { data, user } = getProjectResult;
  return (
    <div className="space-y-2">
      <ProjectDetails project={data} supervisorView />
    </div>
  );
}