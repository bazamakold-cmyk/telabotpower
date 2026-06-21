import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifySecret } from "@/lib/hash";
import { pinLoginSchema } from "@/lib/validators";

export const runtime = "nodejs";

const MAX_AGE = 60 * 60 * 8;

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = pinLoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const candidates = await db.user.findMany({
    where: { isActive: true, role: { in: ["MANAGER", "ADMIN"] }, pinHash: { not: null } },
  });
  for (const u of candidates) {
    if (u.pinHash && (await verifySecret(parsed.data.pin, u.pinHash))) {
      const sid = randomUUID();
      await db.session.deleteMany({ where: { userId: u.id } }); // single active session
      await db.session.create({
        data: { id: sid, userId: u.id, expiresAt: new Date(Date.now() + MAX_AGE * 1000) },
      });
      const token = await signSession({ sub: u.id, role: u.role, sid });
      (await cookies()).set(SESSION_COOKIE, token, cookieOpts());
      return NextResponse.json({ ok: true, name: u.name });
    }
  }
  return NextResponse.json({ error: "PIN ไม่ถูกต้อง" }, { status: 401 });
}
