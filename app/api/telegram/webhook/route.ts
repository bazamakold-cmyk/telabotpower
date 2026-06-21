import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Telegram delivers updates here (authenticated by the secret token header, not a session cookie).
export async function POST(req: Request) {
  const bot = await db.botSetting.findUnique({ where: { id: "default" } });
  const secret = bot?.webhookSecret;
  if (secret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as {
    message?: {
      text?: string;
      date?: number;
      chat?: { id?: number | string };
      from?: { id?: number | string };
      reply_to_message?: { message_id?: number };
    };
  } | null;

  const msg = update?.message;
  if (msg?.text && msg.chat?.id != null) {
    const chatId = String(msg.chat.id);
    const tgUserId = msg.from?.id != null ? String(msg.from.id) : "";
    const group = await db.telegramGroup.findUnique({ where: { chatId } });
    if (group) {
      const admin = tgUserId
        ? await db.user.findUnique({ where: { telegramId: tgUserId } })
        : null;
      await db.chatMessage.create({
        data: {
          groupId: group.id,
          tgUserId,
          adminId: admin?.id ?? null,
          role: admin ? "ADMIN" : "CUSTOMER",
          text: msg.text,
          replyToTg: msg.reply_to_message?.message_id
            ? String(msg.reply_to_message.message_id)
            : null,
          sentAt: msg.date ? new Date(msg.date * 1000) : new Date(),
        },
      });
    }
  }

  // Always 200 so Telegram won't keep retrying.
  return NextResponse.json({ ok: true });
}
