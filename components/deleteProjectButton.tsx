"use client";
import { notify } from './notificationToaster'
import { deleteProjectAction,  } from '@/Interfaces/actions/projects.actions'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from './confirm-dialog';

type Props = {
    projectId: string,
}

const DeleteProjectButton = ({ projectId }: Props) => {
    const router = useRouter()

    const handleDeleteProject=async()=>{
        try {
            if(!projectId){
                notify.error("Invalid Project Id!");
                return;
            }
            const toastId= notify.loading(`Deleting Projec ...`)
            const result = await deleteProjectAction({projectId});
            notify.dismiss(toastId);
            if ("error" in result){
                notify.error("Error" , result.error)
            }else {
                notify.success("Project Deleted");
                router.back()
            }
        } catch (error) {
            console.error(error);
            notify.error("Network Error");
        }
    }

    return (
        <div>
            <ConfirmDialog 
            onCertain={()=>handleDeleteProject()}
            title="Permanently delete this project and all its features, images, AI responses, and suggestions?"
style='danger'
triggerChildren={
    <div className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors" >
        Delete project

    </div>
}
/>
          </div>
    )
}

export default DeleteProjectButton