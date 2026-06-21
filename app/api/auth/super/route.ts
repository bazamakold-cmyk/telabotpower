import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifySecret } from "@/lib/hash";
import { superLoginSchema } from "@/lib/validators";

export const runtime = "nodejs";

const MAX_AGE = 60 * 60 * 8;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = superLoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { username, password } = parsed.data;
  const u = await db.user.findUnique({ where: { username } });
  if (!u || u.role !== "SUPER_ADMIN" || !u.isActive || !u.passwordHash) {
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  if (!(await verifySecret(password, u.passwordHash))) {
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const sid = randomUUID();
  await db.session.deleteMany({ where: { userId: u.id } }); // single active session
  await db.session.create({
    data: { id: sid, userId: u.id, expiresAt: new Date(Date.now() + MAX_AGE * 1000) },
  });
  const token = await signSession({ sub: u.id, role: u.role, sid });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return NextResponse.json({ ok: true, name: u.name });
}
