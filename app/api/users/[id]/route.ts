import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashSecret } from "@/lib/hash";
import { logActivity } from "@/lib/activity";
import { requireRole } from "@/lib/session";
import { isPinTaken } from "@/lib/user-helpers";
import { userCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

function isNotFound(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2025";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole(["SUPER_ADMIN"]);
  if (!actor) return NextResponse.json({ error: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = userCreateSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;

  if (d.pin && (await isPinTaken(d.pin, id))) {
    return NextResponse.json({ error: "PIN นี้มีผู้ใช้แล้ว" }, { status: 409 });
  }
  const pinHash = d.pin ? await hashSecret(d.pin) : undefined;

  try {
    const updated = await db.user.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.role !== undefined ? { role: d.role } : {}),
        ...(d.telegramId !== undefined ? { telegramId: d.telegramId || null } : {}),
        ...(d.username !== undefined ? { username: d.username || null } : {}),
        ...(pinHash ? { pinHash } : {}),
      },
    });
    await logActivity(actor.id, "UPDATE_USER", updated.name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isNotFound(e)) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ (ข้อมูลซ้ำ?)" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole(["SUPER_ADMIN"]);
  if (!actor) return NextResponse.json({ error: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });

  const { id } = await params;
  if (id === actor.id) {
    return NextResponse.json({ error: "ลบบัญชีตัวเองไม่ได้" }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  if (target.role === "SUPER_ADMIN") {
    const count = await db.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
    if (count <= 1) {
      return NextResponse.json({ error: "ต้องมี Super Admin อย่างน้อย 1 คน" }, { status: 400 });
    }
  }
  await db.user.delete({ where: { id } });
  await logActivity(actor.id, "DELETE_USER", target.name, `role: ${target.role}`);
  return NextResponse.json({ ok: true });
}
