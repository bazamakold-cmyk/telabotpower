import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";
import { ticketCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = ticketCreateSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;
  try {
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
  } catch (e) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "ไม่พบงาน" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const ticket = await db.ticket.findUnique({ where: { id } });
    await db.ticket.delete({ where: { id } });
    await logActivity(user.id, "DELETE_TICKET", ticket?.tag ?? id, `#${ticket?.seq}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "ไม่พบงาน" }, { status: 404 });
    }
    throw e;
  }
}
