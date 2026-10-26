//actions/users.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { userService } from "@/modules/user/services/user-service";
import type {
  CreateSupervisorPayload,
  UpdateSupervisorPayload,
  ResetSupervisorPasswordPayload,
  CreateStudentPayload,
  ResetStudentPasswordPayload
} from "@/shared/validation/user";


export async function createSupervisorAction(payload: CreateSupervisorPayload): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect)
  } else if ("error" in actor) {
    return { error: actor.error }
  }
  const { user } = actor;

  try {
    await userService.createSupervisor(user, payload);
    revalidatePath("/admin");
    revalidatePath("/admin/supervisors");
    return { ok: true }
  }
  catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function updateSupervisorAction(payload: UpdateSupervisorPayload): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect)
  } else if ("error" in actor) {
    return { error: actor.error }
  }
  const { user } = actor;

  const supervisorId = payload.supervisorId;

  try {
    await userService.updateSupervisor(user, payload);
    revalidatePath("/admin/supervisors");
    revalidatePath(`/admin/supervisors/${supervisorId}`);
    return { ok: true }
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function passwordResetSupervisorAction(payload: ResetSupervisorPasswordPayload): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect)
  } else if ("error" in actor) {
    return { error: actor.error }
  }
  const { user } = actor;
  const supervisorId = payload.supervisorId;

  try {
    await userService.resetSupervisorPassword(user, payload);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }

  revalidatePath("/admin/supervisors");
  revalidatePath(`/admin/supervisors/${supervisorId}`);
  redirect(`/admin/supervisors/${supervisorId}?saved=1`);
}

export async function deleteSupervisorAction(supervisorId: string): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect)
  } else if ("error" in actor) {
    return { error: actor.error }
  }
  const { user } = actor;

  try {
    await userService.deleteSupervisor(user, supervisorId);
    revalidatePath("/admin/supervisors");
    return { ok: true }
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

// For Student
export async function createStudentAction(payload: CreateStudentPayload): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect)
  } else if ("error" in actor) {
    return { error: actor.error }
  }
  const { user } = actor

  try {
    await userService.createStudent(user, payload);
    revalidatePath("/supervisor/students");
    revalidatePath("/supervisor");
    revalidatePath("/admin");
    return { ok: true }
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function passwordResetStudentAction(payload: ResetStudentPasswordPayload): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect)
  } else if ("error" in actor) {
    return { error: actor.error }
  }
  const { user } = actor;
  const studentId = payload.studentId;

  try {
    await userService.resetStudentPassword(user, payload);
    revalidatePath("/supervisor/");
    revalidatePath(`/supervisor/students/${studentId}`);
    return { ok: true }
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function deleteStudentAction(studentId: string): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect)
  } else if ("error" in actor) {
    return { error: actor.error }
  }
  const { user } = actor;

  try {
    await userService.deleteStudent(user, studentId);

    revalidatePath("/supervisor/students");
    revalidatePath("/supervisor");
    revalidatePath("/admin");
    return { ok: true }
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}