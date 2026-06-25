import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashSecret } from "@/lib/hash";
import { requireRole } from "@/lib/session";
import { isPinTaken } from "@/lib/user-helpers";
import { userCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const actor = await requireRole(["SUPER_ADMIN"]);
  if (!actor) return NextResponse.json({ error: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;

  if (d.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "ไม่สามารถสร้าง Super Admin ผ่าน UI ได้" }, { status: 403 });
  }

  if (d.pin && (await isPinTaken(d.pin))) {
    return NextResponse.json({ error: "PIN นี้มีผู้ใช้แล้ว" }, { status: 409 });
  }

  try {
    const user = await db.user.create({
      data: {
        name: d.name,
        role: d.role,
        username: d.username || null,
        telegramId: d.telegramId || null,
        pinHash: d.pin ? await hashSecret(d.pin) : null,
      },
    });
    return NextResponse.json({ id: user.id });
  } catch {
    return NextResponse.json({ error: "Telegram ID หรือ username ซ้ำ" }, { status: 409 });
  }
}
