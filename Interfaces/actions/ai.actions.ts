// // //actions/ai.ts
// // "use server";

// // import { revalidatePath } from "next/cache";
// // import { redirect } from "next/navigation";
// // import { requireUserForService } from "@/core/auth/session";
// // import { toSafeMessage } from "@/core/errors/app-error";
// // import { aiService } from "@/modules/ai/services/ai-service";
// // import { requestAiSuggestionsSchema } from "@/shared/validation/ai";
// // import { ExtractedProject } from "@/modules/project/types";
// // import { randomUUID } from "node:crypto";

// // export type AiActionResult = { 
// //   data: { 
// //     responseId: string; 
// //     suggestions: { 
// //       id: string; 
// //       projectId: string; 
// //       responseId: string; 
// //       content: string; 
// //       createdAt: Date 
// //     }[]; 
// //     provider: string; 
// //     mode: string; 
// //     model: string 
// //   } 
// // } | { error: string };

// // export async function requestAiSuggestionsAction(projectId: string): Promise<AiActionResult> {
// //   const actor = await requireUserForService();
// //   if ("redirect" in actor) {
// //     redirect(actor.redirect);
// //   } else if ("error" in actor) {
// //     return { error: actor.error };
// //   }
// //   const {user} = actor;

// //   const input = requestAiSuggestionsSchema.safeParse({ projectId });
// //   if (!input.success) return { error: "Invalid project identifier." };

// //   try {
// //     const traceId = randomUUID();
// //     const result = await aiService.requestSuggestions(user, input.data, traceId);
// //     return result;
// //   } catch (error) {
// //     return { error: toSafeMessage(error) };
// //   }
// // }

// // export type DeleteAiSuggestionPayload = {
// //   projectId: string;
// //   suggestionId: string;
// // };

// // export async function deleteAiSuggestionAction(payload: DeleteAiSuggestionPayload): Promise<{ ok: true } | { error: string }> {
// //   const actor = await requireUserForService();
// //   if ("redirect" in actor) {
// //     redirect(actor.redirect);
// //   } else if ("error" in actor) {
// //     return { error: actor.error };
// //   }
// //   const {user} = actor;

// //   const { projectId, suggestionId } = payload;

// //   try {
// //     await aiService.deleteSuggestion(user, suggestionId);
// //     revalidatePath(`/supervisor/projects/${projectId}`);
// //     revalidatePath(`/projects/${projectId}`);
// //     return { ok: true };
// //   } catch (error) {
// //     return { error: toSafeMessage(error) };
// //   }
// // }

// // export type SetAiEnabledPayload = {
// //   enabled: boolean;
// // };

// // export async function setAiEnabledAction(payload: SetAiEnabledPayload): Promise<{ ok: true } | { error: string }> {
// //   const actor = await requireUserForService();
// //   if ("redirect" in actor) {
// //     redirect(actor.redirect);
// //   } else if ("error" in actor) {
// //     return { error: actor.error };
// //   }
// //   const {user} = actor;

// //   const { enabled } = payload;

// //   try {
// //     await aiService.setEnabled(user, enabled);
// //     revalidatePath("/admin/ai");
// //     return { ok: true };
// //   } catch (error) {
// //     return { error: toSafeMessage(error) };
// //   }
// // }


// // export async function extractProjectFromFileAction(formData: FormData):Promise<{error:string}|{data:ExtractedProject}> {
// //   const actor = await requireUserForService();
// //   if ("redirect" in actor) {
// //     redirect(actor.redirect);
// //   } else if ("error" in actor) {
// //     return { error: actor.error };
// //   }
// //   const { user } = actor;

// //   const file = formData.get("file") as File;
// //   if (!file) return { error: "No file provided." };

// //   try {
    
// //     console.log("Calling Service:")
// //     const traceId = randomUUID();
// //     const data = await aiService.extractProjectFromFile(user, file,traceId);
// //     return { data };
// //   } catch (error) {
// //     return { error: toSafeMessage(error) };
// //   }
// // }

// "use server";

// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
// import { randomUUID } from "node:crypto";
// import { requireUserForService } from "@/core/auth/session";
// import { toSafeMessage } from "@/core/errors/app-error";
// import { aiService } from "@/modules/ai/services/ai-service";
// import {
//   requestAiSuggestionsActionPayloadSchema,
//   deleteAiSuggestionActionPayloadSchema,
//   setAiEnabledActionPayloadSchema,
//   extractProjectFromFileActionSchema,
//   type RequestAiSuggestionsActionPayload,
//   type DeleteAiSuggestionActionPayload,
//   type SetAiEnabledActionPayload,
//   type ExtractProjectFromFileActionPayload,
// } from "@/shared/validation/ai-action";
// import type { ExtractedProject } from "@/modules/project/types";

// export type AiActionResult =
//   | {
//       data: {
//         responseId: string;
//         suggestions: {
//           id: string;
//           projectId: string;
//           responseId: string;
//           title: string;
//           content: string;
//           createdAt: Date;
//         }[];
//         provider: string;
//         mode: string;
//         model: string;
//       };
//     }
//   | { error: string };

// export async function requestAiSuggestionsAction(
//   payload: RequestAiSuggestionsActionPayload,
// ): Promise<AiActionResult> {
//   const actor = await requireUserForService();
//   if ("redirect" in actor) redirect(actor.redirect);
//   if ("error" in actor) return { error: actor.error };
//   const { user } = actor;

//   const input = requestAiSuggestionsActionPayloadSchema.safeParse(payload);
//   if (!input.success) return { error: "Invalid project identifier." };

//   try {
//     const traceId = randomUUID();
//     return await aiService.requestSuggestions(user, input.data, traceId);
//   } catch (error) {
//     return { error: toSafeMessage(error) };
//   }
// }

// export async function deleteAiSuggestionAction(
//   payload: DeleteAiSuggestionActionPayload,
// ): Promise<{ ok: true } | { error: string }> {
//   const actor = await requireUserForService();
//   if ("redirect" in actor) redirect(actor.redirect);
//   if ("error" in actor) return { error: actor.error };
//   const { user } = actor;

//   const input = deleteAiSuggestionActionPayloadSchema.safeParse(payload);
//   if (!input.success) return { error: "Invalid suggestion request." };

//   try {
//     const deleted = await aiService.deleteSuggestion(user, input.data.suggestionId);
//     // Revalidate using the project ID returned by the server, not an untrusted path.
//     revalidatePath(`/supervisor/projects/${deleted.projectId}`);
//     revalidatePath(`/projects/${deleted.projectId}`);
//     return { ok: true };
//   } catch (error) {
//     return { error: toSafeMessage(error) };
//   }
// }

// export async function setAiEnabledAction(
//   payload: SetAiEnabledActionPayload,
// ): Promise<{ ok: true } | { error: string }> {
//   const actor = await requireUserForService();
//   if ("redirect" in actor) redirect(actor.redirect);
//   if ("error" in actor) return { error: actor.error };
//   const { user } = actor;

//   const input = setAiEnabledActionPayloadSchema.safeParse(payload);
//   if (!input.success) return { error: "Invalid AI settings." };

//   try {
//     await aiService.setEnabled(user, input.data.enabled);
//     revalidatePath("/admin/ai");
//     return { ok: true };
//   } catch (error) {
//     return { error: toSafeMessage(error) };
//   }
// }

// /**
//  * Pass an ArrayBuffer in a typed payload instead of FormData. In the client,
//  * call this with { fileName, mimeType, data: await file.arrayBuffer() }.
//  */
// export async function extractProjectFromFileAction( payload: ExtractProjectFromFileActionPayload, ): Promise<{ error: string } | { data: ExtractedProject }> {
//   const actor = await requireUserForService();
//   if ("redirect" in actor) redirect(actor.redirect);
//   if ("error" in actor) return { error: actor.error };
//   const { user } = actor;

//   const input = extractProjectFromFileActionSchema.safeParse(payload);
//   if (!input.success) {
//     return { error: input.error.issues[0]?.message ?? "Invalid document upload." };
//   }

//   try {
//     const file = new File([input.data.data], input.data.fileName, {
//       type: input.data.mimeType,
//     });
//     const traceId = randomUUID();
//     const data = await aiService.extractProjectFromFile(user, file, traceId);
//     return { data };
//   } catch (error) {
//     return { error: toSafeMessage(error) };
//   }
// }
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { aiService } from "@/modules/ai/services/ai-service";
import {
  deleteAiSuggestionActionSchema,
  extractProjectFromFileActionSchema,
  requestAiSuggestionsActionSchema,
  setAiEnabledActionSchema,
  type DeleteAiSuggestionActionPayload,
  type ExtractProjectFromFileActionPayload,
  type RequestAiSuggestionsActionPayload,
  type SetAiEnabledActionPayload,
} from "@/shared/validation/ai-action";
import type { ExtractedProject } from "@/modules/project/types";

export type AiActionResult =
  | {
      data: {
        responseId: string;
        suggestions: {
          id: string;
          projectId: string;
          responseId: string;
          title: string;
          content: string;
          createdAt: Date;
        }[];
        provider: string;
        providerName: string;
        model: string;
      };
    }
  | { error: string };

export async function requestAiSuggestionsAction(
  payload: RequestAiSuggestionsActionPayload,
): Promise<AiActionResult> {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = requestAiSuggestionsActionSchema.safeParse(payload);
  if (!input.success) return { error: "Invalid project identifier." };

  try {
    return await aiService.requestSuggestions(actor.user, input.data, randomUUID());
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function deleteAiSuggestionAction(
  payload: DeleteAiSuggestionActionPayload,
): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = deleteAiSuggestionActionSchema.safeParse(payload);
  if (!input.success) return { error: "Invalid suggestion or project identifier." };

  try {
    await aiService.deleteSuggestion(actor.user, input.data.suggestionId);
    revalidatePath(`/supervisor/projects/${input.data.projectId}`);
    revalidatePath(`/projects/${input.data.projectId}`);
    return { ok: true };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function setAiEnabledAction(
  payload: SetAiEnabledActionPayload,
): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = setAiEnabledActionSchema.safeParse(payload);
  if (!input.success) return { error: "Invalid AI service setting." };

  try {
    await aiService.setEnabled(actor.user, input.data.enabled);
    revalidatePath("/admin/ai");
    revalidatePath("/admin/ai/providers");
    return { ok: true };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function extractProjectFromFileAction(
  payload: ExtractProjectFromFileActionPayload,
): Promise<{ error: string } | { data: ExtractedProject }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = extractProjectFromFileActionSchema.safeParse(payload);
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Invalid document upload." };

  try {
    const file = new File([input.data.data], input.data.fileName, { type: input.data.mimeType });
    const data = await aiService.extractProjectFromFile(actor.user, file, randomUUID());
    return { data };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}
