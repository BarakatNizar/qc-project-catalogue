"use client";
import { Button } from './ui/button';
import { setAiEnabledAction } from '@/Interfaces/actions/ai.actions';
import { notify } from './notificationToaster';

type Props = {currentEnabled:boolean}

const ToggleAIServiceButton = ({currentEnabled}: Props) => {
  const handleToggleService=async()=>{
    try {
        const toastId=notify.loading(!currentEnabled ? "Enabling AI Service...":"Disabling AI Service");
        const res = await setAiEnabledAction({enabled:!currentEnabled});
        notify.dismiss(toastId);
        if("error" in res){
            notify.error("Error" , res.error);
        }else {
            notify.success("Success",!currentEnabled ? "AI Service Enabled":"AI Service Disabled")
        }
    } catch (error) {
        console.error(error);
        notify.error("Network Error")
    }
  }
    return (
    <Button
    onClick={()=>handleToggleService()}
                variant={currentEnabled ? "outline" : "default"}
                className={`rounded-xl px-6 font-semibold shadow-md ${!currentEnabled ? "shadow-primary/20" : ""}`}
              >
                {currentEnabled ? "Disable AI generation" : "Enable AI generation"}
              </Button>
  )
}

export default ToggleAIServiceButton