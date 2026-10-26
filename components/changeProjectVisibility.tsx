"use client";
import { Button } from './ui/button'
import { notify } from './notificationToaster'
import { setProjectVisibilityAction } from '@/Interfaces/actions/projects.actions'
import { useRouter } from 'next/navigation'
import { ProjectVisibility } from '@prisma/client';

type Props = {
    projectId: string,
    currentVisibility: ProjectVisibility
}

const ChangeProjectVisibility = ({ projectId, currentVisibility }: Props) => {
    const router = useRouter()
    const handleToggleVisibility=async()=>{
        try {
            if(!projectId){
                notify.error("Invalid Project Id!");
                return;
            }
            const visibility:ProjectVisibility = currentVisibility==='HIDDEN' ? 'VISIBLE' :"HIDDEN";
            const toastId= notify.loading(`Toggle Project to ${visibility} ...`)
            const result = await setProjectVisibilityAction({projectId, visibility});
            notify.dismiss(toastId);
            if ("error" in result){
                notify.error("Error" , result.error)
            }else {
                notify.success("Toggled");
                setTimeout(() => {
                    router.refresh()
                }, 800);
            }
        } catch (error) {
            console.error(error);
            notify.error("Network Error");
        }
    }

    return (
        <div >
            <Button variant="outline" size="sm"  className="rounded-xl border-border/80 font-semibold" onClick={()=>handleToggleVisibility()}>
                {currentVisibility === "VISIBLE" ? "Hide from students" : "Show to students"}
            </Button>
        </div>
    )
}

export default ChangeProjectVisibility