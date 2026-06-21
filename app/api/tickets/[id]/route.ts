import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ticketCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = ticketCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const d = parsed.data;
  await db.ticket.update({
    where: { id },
    data: {
      ...(d.tag !== undefined ? { tag: d.tag } : {}),
      ...(d.detail !== undefined ? { detail: d.detail || null } : {}),
      ...(d.urgency !== undefined ? { urgency: d.urgency } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.groupId !== undefined ? { groupId: d.groupId || null } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
