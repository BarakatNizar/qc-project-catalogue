//Interfaces/getters/user.getters.ts
"use server";

import { redirect } from "next/navigation";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { userService } from "@/modules/user/services/user-service";

export async function listSupervisorsAction(page?: number, pageSize?: number) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;
  try {
    return await userService.listSupervisors(user, page, pageSize);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function listStudentsAction(page?: number, pageSize?: number) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    return await userService.listStudents(user, page, pageSize);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function searchSupervisorsAction(query: string, page?: number, pageSize?: number) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    return await userService.searchSupervisors(user, query, page, pageSize);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function searchStudentsAction(query: string, page?: number, pageSize?: number) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    return await userService.searchStudents(user, query, page, pageSize);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function getProfileAction() {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    return await userService.getProfile(user);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function getCountsAction() {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    const data = await userService.getCounts(user);
    return {user, data};
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function getSupervisorAction(supervisorId: string) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    return await userService.getSupervisor(user, supervisorId);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function getStudentAction(studentId: string) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    return await userService.getStudent(user, studentId);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}