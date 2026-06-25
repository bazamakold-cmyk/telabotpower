import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/types";

/** Server-only: resolve the logged-in user, validating the session against the DB
 * (single active session — older sessions are invalidated on new login). */
export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;

  const session = await db.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.expiresAt < new Date()) return null;

  const user = await db.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

/** Returns the user only if their role is allowed, else null (caller returns 403). */
export async function requireRole(roles: Role[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

/** Redirect non-SUPER_ADMIN users to /assistant (their landing page). */
export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/assistant");
  return user;
}
