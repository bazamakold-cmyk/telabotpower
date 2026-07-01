import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchKeyword } from "@/lib/summary-bot";
import { groupIdsMatch } from "@/lib/telegram-ids";

export const runtime = "nodejs";

// Summary Bot webhook — receives messages from admin team group only.
// Authenticated by secret token header (not a session cookie).
export async function POST(req: Request) {
  const setting = await db.summaryBotSetting.findUnique({ where: { id: "default" } });

  const update = (await req.json().catch(() => null)) as {
    message?: {
      text?: string;
      chat?: { id?: number | string };
      from?: { id?: number | string; is_bot?: boolean };
    };
  } | null;

  const msg = update?.message;
  if (msg?.text && msg.chat?.id != null && !msg.from?.is_bot) {
    const chatId = String(msg.chat.id);
    // Reject messages from groups other than the configured admin group.
    // groupIdsMatch handles the -100 supergroup upgrade transparently.
    if (setting?.targetGroupChatId && !groupIdsMatch(chatId, setting.targetGroupChatId)) {
      return NextResponse.json({ ok: true });
    }
    // Sync stored chatId when the group was promoted to supergroup (IDs match but differ in format).
    if (setting?.targetGroupChatId && chatId !== setting.targetGroupChatId) {
      await db.summaryBotSetting.update({
        where: { id: "default" },
        data: { targetGroupChatId: chatId },
      }).catch(() => {});
    }

    // DEBUG: echo back to confirm webhook is reached and show exact text received
    const { sendSummaryMessage } = await import("@/lib/summary-bot");
    await sendSummaryMessage(chatId, `[DEBUG] webhook reached\nchatId=${chatId}\ntext="${msg.text}"\nkw=${JSON.stringify(msg.text)}`).catch(() => {});

    await dispatchKeyword(msg.text, chatId);
  }

  // Always 200 so Telegram won't keep retrying.
  return NextResponse.json({ ok: true });
}

