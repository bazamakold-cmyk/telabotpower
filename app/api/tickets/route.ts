import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ticketCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ticketCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const d = parsed.data;
  const ticket = await db.ticket.create({
    data: {
      groupId: d.groupId || null,
      adminId: user.id, // แอดมินผู้รับเรื่อง = ผู้ที่ล็อกอิน
      tag: d.tag,
      detail: d.detail || null,
      urgency: d.urgency,
      status: d.status,
    },
  });
  return NextResponse.json({ id: ticket.id });
}
