import { generateAnswer, getAiSettings } from "@/lib/ai";
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

export async function getSummaryWebhookInfo() {
  const token = await getSummaryBotToken();
  if (!token) return { ok: false as const, description: "ยังไม่ได้ตั้ง Bot Token" };
  return callSummaryTelegram<{
    url: string;
    pending_update_count: number;
    last_error_message?: string;
    last_error_date?: number;
  }>(token, "getWebhookInfo");
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

// --- AI acknowledgment filter ---

// A candidate is a group whose latest message is an unanswered customer message.
// We still need to decide whether those unanswered messages actually require a
// reply, or are just closing pleasantries ("ครับ", "ขอบคุณครับ", "โอเค").
type PendingCandidate = PendingGroup & {
  pendingTexts: string[];
  lastAdminReply: string | null;
};

/**
 * Parse Claude's classification reply into a boolean[] of the expected length.
 * The model is told to return a bare JSON array, but may wrap it in prose or
 * markdown — so we extract the first `[...]` block. Returns null if it can't be
 * parsed or the length doesn't match (caller then falls back to fail-safe).
 * Exported for tests.
 */
export function parseNeedsReplyArray(raw: string, expectedLen: number): boolean[] | null {
  const match = raw.match(/\[[^\]]*\]/);
  if (!match) return null;
  let arr: unknown;
  try {
    arr = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!Array.isArray(arr) || arr.length !== expectedLen) return null;
  return arr.map((v) => v === true);
}

/**
 * Ask Claude which candidate groups actually need an admin reply. Returns a
 * boolean[] aligned with `candidates`. Fails SAFE: on missing API key, AI error,
 * or unparseable output, every candidate is treated as still pending so a real
 * customer question is never hidden.
 */
export async function classifyNeedsReply(candidates: PendingCandidate[]): Promise<boolean[]> {
  if (candidates.length === 0) return [];

  const system = [
    "คุณเป็นผู้ช่วยของทีมแอดมิน หน้าที่คือดูข้อความล่าสุดจากลูกค้าในแต่ละแชท",
    "แล้วตัดสินว่าลูกค้ากำลังรอคำตอบ/ต้องการให้แอดมินตอบ หรือแค่ตอบรับ/ปิดบทสนทนา",
    'เช่น "ครับ" "ค่ะ" "ขอบคุณครับ" "โอเค" "👍" "🙏" = แค่ตอบรับ ไม่ต้องตอบ',
    "แต่ถ้ามีคำถามหรือคำขอที่ยังไม่ได้รับคำตอบ = ต้องให้แอดมินตอบ",
    `ตอบกลับเป็น JSON array ของ boolean เท่านั้น ความยาวเท่ากับจำนวนแชท (true = ต้องตอบ, false = แค่ตอบรับ)`,
    "ห้ามมีข้อความอื่นนอกจาก JSON array",
  ].join("\n");

  const convos = candidates
    .map((c, i) => {
      const reply = c.lastAdminReply ? `แอดมินตอบล่าสุด: "${c.lastAdminReply}"` : "(ยังไม่มีแอดมินตอบ)";
      const msgs = c.pendingTexts.map((t) => `- "${t}"`).join("\n");
      return `แชท #${i}\n${reply}\nข้อความลูกค้าที่ยังไม่ถูกตอบ:\n${msgs}`;
    })
    .join("\n\n");

  const prompt = `${convos}\n\nตอบเป็น JSON array ของ boolean ${candidates.length} ตัว เรียงตามแชท #0 ถึง #${candidates.length - 1}`;

  try {
    const { chatModel } = await getAiSettings();
    const raw = await generateAnswer({ system, prompt, model: chatModel, maxTokens: 500 });
    const parsed = parseNeedsReplyArray(raw, candidates.length);
    if (parsed) return parsed;
    console.error("[classifyNeedsReply] unparseable AI reply:", raw.slice(0, 200));
  } catch (e) {
    console.error("[classifyNeedsReply] AI error:", e);
  }
  // Fail-safe: keep every candidate as pending.
  return candidates.map(() => true);
}

// --- Keyword handlers ---

async function handlePendingChats(): Promise<string> {
  const groups = await db.telegramGroup.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const candidates: PendingCandidate[] = [];

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

    const pendingMsgs = await db.chatMessage.findMany({
      where: {
        groupId: g.id,
        role: "CUSTOMER",
        sentAt: { gt: lastReply?.sentAt ?? new Date(0) },
      },
      orderBy: { sentAt: "asc" },
    });
    if (pendingMsgs.length === 0) continue;

    const waitMs = Date.now() - pendingMsgs[0].sentAt.getTime();
    candidates.push({
      name: g.name,
      count: pendingMsgs.length,
      maxWaitMin: Math.floor(waitMs / 60_000),
      pendingTexts: pendingMsgs.map((m) => m.text),
      lastAdminReply: lastReply?.text ?? null,
    });
  }

  // Drop chats where the customer only acknowledged / closed the conversation.
  const needsReply = await classifyNeedsReply(candidates);
  const pending: PendingGroup[] = candidates
    .filter((_, i) => needsReply[i])
    .map(({ name, count, maxWaitMin }) => ({ name, count, maxWaitMin }));

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
  try {
    const reply = await KEYWORD_HANDLERS[kw]();
    await sendSummaryMessage(chatId, reply);
  } catch (err) {
    console.error("[dispatchKeyword] error:", err);
    await sendSummaryMessage(chatId, `❌ เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : "unknown"}`).catch(() => {});
  }
}
