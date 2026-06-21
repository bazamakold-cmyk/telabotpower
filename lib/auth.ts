import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secretKey = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me-in-production");

export type SessionPayload = {
  /** user id */
  sub: string;
  role: "SUPER_ADMIN" | "MANAGER" | "ADMIN";
  /** active session id (for single-session enforcement) */
  sid: string;
};

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifySecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(
  payload: SessionPayload,
  maxAgeSeconds = 60 * 60 * 8
): Promise<string> {
  return new SignJWT({ role: payload.role, sid: payload.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.role !== "string" || typeof payload.sid !== "string") {
      return null;
    }
    return { sub: payload.sub, role: payload.role as SessionPayload["role"], sid: payload.sid };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "tbp_session";
