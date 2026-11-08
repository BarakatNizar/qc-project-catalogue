
import { aiService } from "@/modules/ai/services/ai-service";
import { ProjectDetails } from "@/components/project-details";
import { getProjectByIdAction } from "@/Interfaces/getters/project.getters";
import ErrorState from "@/components/ErrorState";

export default async function StudentProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const {projectId} = await params;
    const getProjectResult = await getProjectByIdAction(projectId);
    if ("error" in getProjectResult){
      return <ErrorState message={getProjectResult.error}/>
    }
    const { data, user } = getProjectResult;
  
    let enabled:boolean;
  const settings = await aiService.getPublicSettings();
  if("error" in settings){
    enabled=false;
  }else 
    enabled=settings.enabled

  return <div className="py-6">
    <ProjectDetails project={data} canRequestAi aiEnabled={enabled}  supervisorView={user.role==='SUPERVISOR' || user.role==='ADMIN'}/>
  </div>
}