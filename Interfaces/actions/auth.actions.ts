//actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, toSafeMessage } from "@/core/errors/app-error";
import { createSession, destroySession, getServerUserFromAccess, roleHome } from "@/core/auth/session";
import { verifyPassword } from "@/core/auth/password";
import { userRepository } from "@/modules/user/repositories/user-repository";
import { userService } from "@/modules/user/services/user-service";
import type { ChangePasswordPayload, LoginPayload, UpdateProfilePayload } from "@/shared/validation/user";
import { checkLogin_Schema } from "@/shared/validation/user";

export type LoginState = { error?: string };

export async function loginAction( payload: LoginPayload): Promise<{error:string}|{redirect:string}> {
  const validePayload = checkLogin_Schema(payload);
  if (!validePayload.ok && payload.loginId !== 'admin')
    return { error: validePayload.reason };

  const user = await userRepository.findByLoginId(payload.loginId);
  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    return { error: "The login ID or password is incorrect." };
  }
  await createSession({ id: user.id, role: user.role, loginId: user.loginId, name: user.name, mustChangePassword: user.mustChangePassword });
  if (user.mustChangePassword) return {redirect:"/change-password"};
  return {redirect:roleHome(user.role)}
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export type PasswordState = { error?: string };

export async function changePasswordAction( payload: ChangePasswordPayload): Promise<PasswordState> {
  const user = await getServerUserFromAccess();
  if (!user||"error" in user ) redirect("/login");
  try {
    const updated = await userService.changePassword(user, payload);
    await createSession({ id: updated.id, role: updated.role, loginId: updated.loginId, name: updated.name, mustChangePassword: false });
  } catch (error) {
    return { error: error instanceof AppError && error.code === "VALIDATION" ? error.message : toSafeMessage(error) };
  }
  revalidatePath("/");
  redirect(roleHome(user.role));
}

export async function updateProfileAction(payload: UpdateProfilePayload): Promise<{ ok: true } | { error: string }> {
  const user = await getServerUserFromAccess();
  if (!user||"error" in user ) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  try {
    const updated = await userService.updateProfile(user, payload);
    await createSession({ id: updated.id, role: updated.role, loginId: updated.loginId, name: updated.name, mustChangePassword: updated.mustChangePassword });
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
  revalidatePath("/profile");
  return { ok: true };
}