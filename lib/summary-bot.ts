import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

// --- Token helper ---

async function getSummaryBotToken(): Promise<string | null> {
  const s = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
  if (s?.botToken) {
    try {
      return decrypt(s.botToken);
    } catch (e) {
      console.error("[summary-bot] decrypt failed:", e);
    }
  }
  return null;
}

type SummaryTgResponse<T = unknown> = { ok: boolean; result?: T; description?: string };

async function callSummaryTelegram<T = unknown>(
  token: string,
  method: string,
  params?: Record<string, unknown>
): Promise<SummaryTgResponse<T>> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params ?? {}),
    });
    return (await res.json()) as SummaryTgResponse<T>;
  } catch {
    return { ok: false, description: "เชื่อมต่อ Telegram ไม่สำเร็จ" };
  }
}

export async function sendSummaryMessage(chatId: string, text: string) {
  const token = await getSummaryBotToken();
  if (!token) return { ok: false, description: "ยังไม่ได้ตั้ง Summary Bot Token" };
  return callSummaryTelegram(token, "sendMessage", { chat_id: chatId, text });
}

export async function setSummaryWebhook(token: string, url: string, secret: string) {
  return callSummaryTelegram(token, "setWebhook", {
    url,
    secret_token: secret,
    drop_pending_updates: true,
  });
}

export function getSummaryBotInfo(token: string) {
  return callSummaryTelegram<{ id: number; username?: string; first_name?: string }>(token, "getMe");
}

// --- Formatting helpers (pure — exported for tests) ---

export type PendingGroup = { name: string; count: number; maxWaitMin: number };

export function formatPendingChatsMessage(groups: PendingGroup[], timeStr: string): string {
  if (groups.length === 0) {
    return `✅ ไม่มีแชทค้าง\n🕐 อัพเดท: ${timeStr} น.`;
  }
  const lines = groups.map(({ name, count, maxWaitMin }) => {
    const icon = maxWaitMin > 30 ? "🔴" : maxWaitMin >= 10 ? "🟡" : "🟢";
    return `${icon} ${name}: ${count} แชท (รอนานสุด ${maxWaitMin} นาที)`;
  });
  const total = groups.reduce((s, g) => s + g.count, 0);
  return [
    "📊 สรุปแชทค้าง",
    "━━━━━━━━━━━━━━━",
    ...lines,
    "━━━━━━━━━━━━━━━",
    `📌 รวม: ${total} แชทค้าง`,
    `🕐 อัพเดท: ${timeStr} น.`,
  ].join("\n");
}

// --- Keyword handlers ---

async function handlePendingChats(): Promise<string> {
  const groups = await db.telegramGroup.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const pending: PendingGroup[] = [];

  for (const g of groups) {
    const lastMsg = await db.chatMessage.findFirst({
      where: { groupId: g.id },
      orderBy: { sentAt: "desc" },
    });
    if (!lastMsg || lastMsg.role !== "CUSTOMER") continue;

    const lastReply = await db.chatMessage.findFirst({
      where: { groupId: g.id, role: { in: ["ADMIN", "BOT"] } },
      orderBy: { sentAt: "desc" },
    });

    const pendingCount = await db.chatMessage.count({
      where: {
        groupId: g.id,
        role: "CUSTOMER",
        sentAt: { gt: lastReply?.sentAt ?? new Date(0) },
      },
    });
    if (pendingCount === 0) continue;

    const firstPending = lastReply
      ? await db.chatMessage.findFirst({
          where: { groupId: g.id, role: "CUSTOMER", sentAt: { gt: lastReply.sentAt } },
          orderBy: { sentAt: "asc" },
        })
      : lastMsg;

    const waitMs = Date.now() - (firstPending?.sentAt ?? new Date()).getTime();
    pending.push({ name: g.name, count: pendingCount, maxWaitMin: Math.floor(waitMs / 60_000) });
  }

  const now = new Date().toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  return formatPendingChatsMessage(pending, now);
}

// --- Keyword map ---

const KEYWORD_HANDLERS: Record<string, () => Promise<string>> = {
  สรุปแชทค้าง: handlePendingChats,
  // เพิ่ม keyword ใหม่ที่นี่: 'สรุปงานค้าง': handlePendingTickets,
};

export function matchKeyword(text: string): string | null {
  const normalized = text.trim();
  for (const kw of Object.keys(KEYWORD_HANDLERS)) {
    if (normalized.includes(kw)) return kw;
  }
  return null;
}

export async function dispatchKeyword(text: string, chatId: string): Promise<void> {
  const kw = matchKeyword(text);
  if (!kw) return;
  const reply = await KEYWORD_HANDLERS[kw]();
  await sendSummaryMessage(chatId, reply);
}
