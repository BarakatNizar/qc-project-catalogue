import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";

export const SESSION_COOKIE = "qc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
export type Role = "ADMIN" | "SUPERVISOR" | "STUDENT";
export type ServerUser = { id: string; role: Role; loginId: string; name: string; mustChangePassword: boolean };

function secretKey() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createSession(user: ServerUser) {
  const token = await new SignJWT({ role: user.role, loginId: user.loginId, name: user.name, mustChangePassword: user.mustChangePassword })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getServerUserFromAccess(): Promise<ServerUser | { error:string }> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { error:"Not Authenticated" };
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (typeof payload.sub !== "string" || !["ADMIN", "SUPERVISOR", "STUDENT"].includes(String(role))) return { error:"Invalid Session" };
    const account = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, loginId: true, name: true, mustChangePassword: true },
    });
    if (!account) return { error:"User is not exist" };
    return {
      id: account.id,
      role: account.role,
      loginId: account.loginId,
      name: account.name,
      mustChangePassword: account.mustChangePassword,
    };
  } catch(error) {
    return {error:"UnExpected Error"};
  }
}

export async function requireUser() {
  const user = await getServerUserFromAccess();
  if (!user || "error" in user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

// This used for pages routes
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(roleHome(user.role));
  return user;
}

export async function requireUserForService(): Promise<{ user:ServerUser }|{ error:string } | { redirect:string }> {
  const user = await getServerUserFromAccess();
  if (!user || "error" in user) return { error:user.error };
  if (user.mustChangePassword) return { redirect:"/change-password" } 
  return {user};
}

export function roleHome(role: Role) {
  switch (role) {
    case "ADMIN": return "/admin";
    case "SUPERVISOR": return "/supervisor";
    case "STUDENT": return "/projects";
  }
}
