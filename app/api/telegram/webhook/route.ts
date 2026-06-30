import { NextResponse } from "next/server";
import { getAiSettings } from "@/lib/ai";
import { db } from "@/lib/db";
import { decideBotAction, ragAnswer } from "@/lib/rag";
import { dispatchKeyword } from "@/lib/summary-bot";
import { groupIdsMatch } from "@/lib/telegram-ids";
import { sendMessage } from "@/lib/telegram";

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

    // Admin summary group: dispatch keyword, skip customer flow
    const summaryBotSetting = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
    if (summaryBotSetting?.targetGroupChatId && groupIdsMatch(chatId, summaryBotSetting.targetGroupChatId)) {
      await dispatchKeyword(msg.text, chatId).catch(() => {});
      return NextResponse.json({ ok: true });
    }

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

      // A customer asked something → let the bot answer / draft from the group's knowledge.
      if (!admin && group.botMode !== "OFF") {
        await maybeAutoReply(group, msg.text, bot?.aiAutoReply ?? true);
      }
    }
  }

  // Always 200 so Telegram won't keep retrying.
  return NextResponse.json({ ok: true });
}

type GroupForReply = {
  id: string;
  chatId: string;
  purpose: string | null;
  botMode: "AUTO_REPLY" | "DRAFT" | "OFF";
};

/** RAG-answer a customer message, then auto-send (AUTO_REPLY) or queue a draft (DRAFT). */
async function maybeAutoReply(group: GroupForReply, question: string, globalAutoReply: boolean) {
  try {
    const collections = await db.knowledgeCollection.findMany({
      where: { groups: { some: { id: group.id } } },
      select: { id: true },
    });
    const collectionIds = collections.map((c) => c.id);
    if (collectionIds.length === 0) return;

    const settings = await getAiSettings();
    const r = await ragAnswer({
      collectionIds,
      question,
      extraSystem: group.purpose ?? undefined,
      settings,
    });

    const action = decideBotAction({
      globalAutoReply,
      botMode: group.botMode,
      hadContext: r.hadContext,
      confidence: r.confidence,
      autoReplyMinConfidence: settings.autoReplyMinConfidence,
    });
    if (action === "none" || !r.answer) return;

    if (action === "send") {
      const sent = await sendMessage(group.chatId, r.answer);
      if (sent.ok) {
        await db.chatMessage.create({
          data: { groupId: group.id, tgUserId: "bot", role: "BOT", text: r.answer, sentAt: new Date() },
        });
        return;
      }
      // Delivery failed → fall back to a draft so an admin can follow up.
    }

    await db.aiDraft.create({
      data: { groupId: group.id, sourceMsg: question, draftText: r.answer, status: "PENDING" },
    });
  } catch {
    // Swallow — auto-reply must never make Telegram retry the webhook.
  }
}
