import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashSecret } from "@/lib/hash";
import { userCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = userCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const d = parsed.data;
  const pinHash = d.pin ? await hashSecret(d.pin) : undefined;
  try {
    await db.user.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.role !== undefined ? { role: d.role } : {}),
        ...(d.telegramId !== undefined ? { telegramId: d.telegramId || null } : {}),
        ...(d.username !== undefined ? { username: d.username || null } : {}),
        ...(pinHash ? { pinHash } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ (ข้อมูลซ้ำ?)" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
