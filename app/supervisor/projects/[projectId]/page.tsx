import { aiService } from "@/modules/ai/services/ai-service";
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
  const suggestions = await aiService.listSuggestions(user, projectId);

  return (
    <div className="space-y-2">
      <ProjectDetails project={data} suggestions={suggestions} supervisorView />
    </div>
  );
}