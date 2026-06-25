import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) as {
    action: "send" | "skip" | "rate";
    text?: string;
    rating?: 1 | -1;
  } | null;
  if (!body?.action) return NextResponse.json({ error: "ระบุ action" }, { status: 400 });

  const draft = await db.aiDraft.findUnique({
    where: { id },
    include: { group: { include: { collections: { select: { id: true, name: true } } } } },
  });
  if (!draft) return NextResponse.json({ error: "ไม่พบ draft" }, { status: 404 });

  // --- rate ---
  if (body.action === "rate") {
    const rating = body.rating;
    if (rating !== 1 && rating !== -1) {
      return NextResponse.json({ error: "rating ต้องเป็น 1 หรือ -1" }, { status: 400 });
    }
    const col = draft.group.collections[0];
    await db.answerLog.create({
      data: {
        collectionId: col?.id ?? "unknown",
        collectionName: col?.name ?? draft.group.name,
        question: draft.sourceMsg,
        answer: draft.draftText,
        confidence: 0,
        rating,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // --- skip ---
  if (body.action === "skip") {
    await db.aiDraft.update({ where: { id }, data: { status: "SKIPPED", adminId: user.id } });
    await logActivity(user.id, "SKIP_DRAFT", draft.group.name, draft.sourceMsg.slice(0, 80));
    return NextResponse.json({ ok: true });
  }

  // --- send ---
  const text = body.text?.trim() || draft.draftText;
  const sent = await sendMessage(draft.group.chatId, text);
  if (!sent.ok) {
    const reason = (sent as { description?: string }).description ?? "ไม่ทราบสาเหตุ";
    return NextResponse.json({ error: `ส่งไม่สำเร็จ: ${reason}` }, { status: 502 });
  }

  const status = body.text?.trim() ? "EDITED" : "SENT";
  await db.aiDraft.update({ where: { id }, data: { status, draftText: text, adminId: user.id } });
  await db.chatMessage.create({
    data: { groupId: draft.groupId, tgUserId: "bot", role: "BOT", text, sentAt: new Date() },
  });
  await logActivity(user.id, "SEND_DRAFT", draft.group.name, draft.sourceMsg.slice(0, 80));

  return NextResponse.json({ ok: true });
}
