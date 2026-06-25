import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { requireRole } from "@/lib/session";
import { groupCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const actor = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  if (!actor) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = groupCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;
  try {
    const group = await db.telegramGroup.create({
      data: {
        name: d.name,
        chatId: d.chatId,
        purpose: d.purpose || null,
        botMode: d.botMode,
        collections: { connect: d.collectionIds.map((id) => ({ id })) },
      },
    });
    await logActivity(actor.id, "CREATE_GROUP", d.name, `chatId: ${d.chatId}`);
    return NextResponse.json({ id: group.id });
  } catch {
    return NextResponse.json({ error: "Chat ID ซ้ำ" }, { status: 409 });
  }
}
