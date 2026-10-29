
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setAiEnabledAction } from "@/Interfaces/actions/ai.actions";
import { notify } from "@/components/notificationToaster";

type Props = {
  currentEnabled: boolean;
};

const ToggleAIServiceButton = ({ currentEnabled }: Props) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleToggleService = async () => {
    if (isPending) return;

    setIsPending(true);

    let toastId: ReturnType<typeof notify.loading> | undefined;

    try {
      const nextEnabled = !currentEnabled;

      toastId = notify.loading(
        nextEnabled ? "Enabling AI Service..." : "Disabling AI Service...",
      );

      const res = await setAiEnabledAction({ enabled: nextEnabled });

      if (toastId !== undefined) {
        notify.dismiss(toastId);
        toastId = undefined;
      }

      if ("error" in res) {
        notify.error("Error", res.error);
        return;
      }

      notify.success(
        "Success",
        nextEnabled ? "AI Service Enabled" : "AI Service Disabled",
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      if (toastId !== undefined) {
        notify.dismiss(toastId);
      }

      notify.error("Network Error");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      onClick={handleToggleService}
      disabled={isPending}
      variant={currentEnabled ? "outline" : "default"}
      className={`w-full rounded-xl px-4 font-semibold sm:w-auto ${
        !currentEnabled ? "shadow-md shadow-primary/20" : ""
      }`}
    >
      {isPending ? (
        <LoaderCircle size={16} className="mr-2 animate-spin" aria-hidden="true" />
      ) : (
        <Power size={16} className="mr-2" aria-hidden="true" />
      )}

      {isPending
        ? currentEnabled
          ? "Disabling AI generation..."
          : "Enabling AI generation..."
        : currentEnabled
          ? "Disable AI generation"
          : "Enable AI generation"}
    </Button>
  );
};

export default ToggleAIServiceButton;
