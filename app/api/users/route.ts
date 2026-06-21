import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashSecret } from "@/lib/hash";
import { userCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const d = parsed.data;
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
