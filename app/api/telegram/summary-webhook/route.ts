import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchKeyword } from "@/lib/summary-bot";

export const runtime = "nodejs";

// Summary Bot webhook — receives messages from admin team group only.
// Authenticated by secret token header (not a session cookie).
export async function POST(req: Request) {
  const setting = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
  const secret = setting?.webhookSecret;
  if (secret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as {
    message?: {
      text?: string;
      chat?: { id?: number | string };
    };
  } | null;

  const msg = update?.message;
  if (msg?.text && msg.chat?.id != null) {
    const chatId = String(msg.chat.id);
    // Reject messages from groups other than the configured admin group
    if (setting?.targetGroupChatId && chatId !== setting.targetGroupChatId) {
      return NextResponse.json({ ok: true });
    }
    await dispatchKeyword(msg.text, chatId).catch(() => {});
  }

  // Always 200 so Telegram won't keep retrying.
  return NextResponse.json({ ok: true });
}
