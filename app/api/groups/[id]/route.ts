import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { groupCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

function isNotFound(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2025";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  if (!actor) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = groupCreateSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;
  try {
    await db.telegramGroup.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.chatId !== undefined ? { chatId: d.chatId } : {}),
        ...(d.purpose !== undefined ? { purpose: d.purpose || null } : {}),
        ...(d.botMode !== undefined ? { botMode: d.botMode } : {}),
        ...(d.collectionIds !== undefined
          ? { collections: { set: d.collectionIds.map((cid) => ({ id: cid })) } }
          : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isNotFound(e)) return NextResponse.json({ error: "ไม่พบกลุ่ม" }, { status: 404 });
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ (Chat ID ซ้ำ?)" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  if (!actor) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  const { id } = await params;
  try {
    await db.telegramGroup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isNotFound(e)) return NextResponse.json({ error: "ไม่พบกลุ่ม" }, { status: 404 });
    throw e;
  }
}
