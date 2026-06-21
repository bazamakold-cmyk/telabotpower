import { SignJWT, jwtVerify } from "jose";

const secretKey = () => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-secret-change-me-in-production");
  }
  return new TextEncoder().encode(s);
};

export const SESSION_COOKIE = "tbp_session";

export type SessionPayload = {
  /** user id */
  sub: string;
  role: "SUPER_ADMIN" | "MANAGER" | "ADMIN";
  /** active session id (for single-session enforcement, Phase 7) */
  sid: string;
};

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
