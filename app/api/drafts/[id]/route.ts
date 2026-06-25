import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

// PATCH: send or skip a draft
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) as { action: "send" | "skip"; text?: string } | null;
  if (!body?.action) return NextResponse.json({ error: "ระบุ action" }, { status: 400 });

  const draft = await db.aiDraft.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!draft) return NextResponse.json({ error: "ไม่พบ draft" }, { status: 404 });

  if (body.action === "skip") {
    await db.aiDraft.update({ where: { id }, data: { status: "SKIPPED", adminId: user.id } });
    return NextResponse.json({ ok: true });
  }

  // action === "send"
  const text = body.text?.trim() || draft.draftText;
  const sent = await sendMessage(draft.group.chatId, text);
  if (!sent.ok) return NextResponse.json({ error: "ส่งไม่สำเร็จ" }, { status: 502 });

  await db.aiDraft.update({
    where: { id },
    data: {
      status: body.text?.trim() ? "EDITED" : "SENT",
      draftText: text,
      adminId: user.id,
    },
  });
  await db.chatMessage.create({
    data: { groupId: draft.groupId, tgUserId: "bot", role: "BOT", text, sentAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
