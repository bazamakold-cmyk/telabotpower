import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchKeyword } from "@/lib/summary-bot";

export const runtime = "nodejs";

// Summary Bot webhook — receives messages from admin team group only.
// Authenticated by secret token header (not a session cookie).
export async function POST(req: Request) {
  const setting = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
  const secret = setting?.webhookSecret;
  if (!secret) return NextResponse.json({ ok: false }, { status: 401 });
  const got = req.headers.get("x-telegram-bot-api-secret-token");
  if (got !== secret) return NextResponse.json({ ok: false }, { status: 401 });

  const update = (await req.json().catch(() => null)) as {
    message?: {
      text?: string;
      chat?: { id?: number | string };
    };
  } | null;

  const msg = update?.message;
  if (msg?.text && msg.chat?.id != null) {
    const chatId = String(msg.chat.id);
    // Reject messages from groups other than the configured admin group.
    // Normalize supergroup upgrade: basic -XXXXX may become -100XXXXX after promotion.
    if (setting?.targetGroupChatId && !groupIdsMatch(chatId, setting.targetGroupChatId)) {
      // Auto-update stored chatId if the group was promoted to supergroup
      if (isSuperGroupOf(chatId, setting.targetGroupChatId)) {
        await db.summaryBotSetting.update({
          where: { id: "default" },
          data: { targetGroupChatId: chatId },
        });
      } else {
        return NextResponse.json({ ok: true });
      }
    }
    await dispatchKeyword(msg.text, chatId).catch(() => {});
  }

  // Always 200 so Telegram won't keep retrying.
  return NextResponse.json({ ok: true });
}

// Strip the -100 supergroup prefix to get the bare group digits for comparison.
function bareId(chatId: string): string {
  return chatId.replace(/^-100/, "-");
}

function groupIdsMatch(a: string, b: string): boolean {
  return a === b || bareId(a) === bareId(b);
}

// Returns true if `incoming` is the supergroup upgrade of `stored` basic group.
function isSuperGroupOf(incoming: string, stored: string): boolean {
  return incoming.startsWith("-100") && bareId(incoming) === stored;
}
