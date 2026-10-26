"use client";
import { Trash2 } from "lucide-react";
import { deleteAiSuggestionAction } from "@/Interfaces/actions/ai.actions";
import { formatDate } from "@/shared/utils/format";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { notify } from "./notificationToaster";
import { DeleteAiSuggestionActionPayload } from "@/shared/validation/ai-action";

type Suggestion = { id: string; title: string; content: string; createdAt: Date };

export function SuggestionAdminList({ projectId, suggestions }: { projectId: string; suggestions: Suggestion[] }) {
  const handleDelete = async (id: string) => {
    try {
      const toastId = notify.loading("Deleting suggestion...")
      const payload: DeleteAiSuggestionActionPayload = {
        projectId,
        suggestionId: id
      }
      const res = await deleteAiSuggestionAction(payload);
      notify.dismiss(toastId);
      if ("error" in res) {
        notify.error("Error", res.error);
        return;
      } else {
        notify.success("Suggestion Deleted!");
      }

    } catch (error) {
      console.error(error);
      notify.error("Network Error");
    }
  }

  if (!suggestions.length)
    return <div className="rounded-xl border border-dashed border-base-300 p-5 text-sm text-base-content/55">No AI suggestions have been generated for this project yet.</div>;

  return <div className="space-y-3">{suggestions.map((suggestion, index) => <div key={suggestion.id} className="flex items-start justify-between gap-4 rounded-xl border border-base-300 p-4">
    <div className="flex min-w-0 gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-base-300 text-sm font-bold text-primary">{index + 1}</span>
      <div>
        <p className="font-bold text-[15px]">{suggestion.title}</p>
        <p className="text-sm leading-6">{suggestion.content}</p>
        <p className="mt-2 text-xs text-base-content/45">Added {formatDate(suggestion.createdAt)}</p>
      </div>
    </div>
    <div >
      <ConfirmSubmitButton onClick={() => handleDelete(suggestion.id)} className="btn btn-ghost btn-sm btn-square text-error" confirmMessage="Permanently remove this shared suggestion? It will no longer be included in future AI context." aria-label="Permanently remove suggestion" title="Permanently remove">
        <Trash2 size={16} />
      </ConfirmSubmitButton>
    </div>
  </div>)}</div>;
}
