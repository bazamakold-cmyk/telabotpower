"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { decrypt, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getSummaryBotInfo, getSummaryWebhookInfo, sendSummaryMessage, setSummaryWebhook } from "@/lib/summary-bot";

async function su() {
  return (await requireRole(["SUPER_ADMIN"])) !== null;
}

export async function saveSummaryBotToken(token: string) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  if (!token.trim()) return { ok: false as const, error: "กรุณากรอก token" };
  let enc: string;
  try {
    enc = encrypt(token.trim());
  } catch {
    return {
      ok: false as const,
      error: "ไม่พบ ENCRYPTION_KEY — กรุณาตั้งค่าใน Vercel → Settings → Environment Variables แล้ว Redeploy",
    };
  }
  await db.summaryBotSetting.upsert({
    where: { id: "default" },
    update: { botToken: enc },
    create: { id: "default", botToken: enc },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function testSummaryBotToken(token: string) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  if (!token.trim()) return { ok: false as const, error: "กรุณากรอก token" };
  const r = await getSummaryBotInfo(token.trim());
  if (!r.ok) {
    const raw = r.description ?? "เชื่อมต่อไม่สำเร็จ";
    const msg =
      raw === "Not Found" || raw === "Unauthorized"
        ? "Token ไม่ถูกต้อง"
        : raw;
    return { ok: false as const, error: msg };
  }
  return { ok: true as const, username: r.result?.username ?? null, name: r.result?.first_name ?? null };
}

export async function testSavedSummaryBotToken() {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const s = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
  if (!s?.botToken) return { ok: false as const, error: "ยังไม่ได้ตั้ง Bot Token" };
  let token: string;
  try {
    token = decrypt(s.botToken);
  } catch {
    return { ok: false as const, error: "ถอดรหัส Bot Token ไม่สำเร็จ" };
  }
  const r = await getSummaryBotInfo(token);
  if (!r.ok) {
    const raw = r.description ?? "เชื่อมต่อไม่สำเร็จ";
    return { ok: false as const, error: raw === "Not Found" || raw === "Unauthorized" ? "Token ไม่ถูกต้อง" : raw };
  }
  return { ok: true as const, username: r.result?.username ?? null, name: r.result?.first_name ?? null };
}

export async function saveSummaryGroupChatId(chatId: string) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  if (!chatId.trim()) return { ok: false as const, error: "กรุณากรอก Chat ID" };
  await db.summaryBotSetting.upsert({
    where: { id: "default" },
    update: { targetGroupChatId: chatId.trim() },
    create: { id: "default", targetGroupChatId: chatId.trim() },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function configureSummaryWebhook(baseUrl: string) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const existing = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
  if (!existing?.botToken) return { ok: false as const, error: "ยังไม่ได้ตั้ง Bot Token" };
  let token: string;
  try {
    token = decrypt(existing.botToken);
  } catch {
    return { ok: false as const, error: "ถอดรหัส Bot Token ไม่สำเร็จ" };
  }
  const secret = existing.webhookSecret ?? randomUUID().replace(/-/g, "");
  const url = `${baseUrl.replace(/\/$/, "")}/api/telegram/summary-webhook`;
  const r = await setSummaryWebhook(token, url, secret);
  if (!r.ok) {
    return {
      ok: false as const,
      error: r.description ?? "ตั้ง webhook ไม่สำเร็จ (ต้องเป็น URL สาธารณะ https)",
    };
  }
  await db.summaryBotSetting.upsert({
    where: { id: "default" },
    update: { webhookUrl: url, webhookSecret: secret },
    create: { id: "default", webhookUrl: url, webhookSecret: secret },
  });
  revalidatePath("/settings");
  return { ok: true as const, url };
}

export async function checkWebhookStatus() {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const r = await getSummaryWebhookInfo();
  if (!r.ok) return { ok: false as const, error: r.description ?? "อ่านไม่สำเร็จ" };
  return {
    ok: true as const,
    url: r.result?.url ?? null,
    pending: r.result?.pending_update_count ?? 0,
    lastError: r.result?.last_error_message ?? null,
    lastErrorDate: r.result?.last_error_date ? new Date(r.result.last_error_date * 1000).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : null,
  };
}

export async function testHandlePendingChats() {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  try {
    const { db: db2 } = await import("@/lib/db");
    const groups = await db2.telegramGroup.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const results: { name: string; lastRole: string | null; pendingCount: number; waitMin: number }[] = [];
    for (const g of groups) {
      const lastMsg = await db2.chatMessage.findFirst({
        where: { groupId: g.id },
        orderBy: { sentAt: "desc" },
      });
      if (!lastMsg) { results.push({ name: g.name, lastRole: null, pendingCount: 0, waitMin: 0 }); continue; }
      const lastReply = await db2.chatMessage.findFirst({
        where: { groupId: g.id, role: { in: ["ADMIN", "BOT"] } },
        orderBy: { sentAt: "desc" },
      });
      const pendingCount = await db2.chatMessage.count({
        where: { groupId: g.id, role: "CUSTOMER", sentAt: { gt: lastReply?.sentAt ?? new Date(0) } },
      });
      const firstPending = lastReply
        ? await db2.chatMessage.findFirst({ where: { groupId: g.id, role: "CUSTOMER", sentAt: { gt: lastReply.sentAt } }, orderBy: { sentAt: "asc" } })
        : await db2.chatMessage.findFirst({ where: { groupId: g.id, role: "CUSTOMER" }, orderBy: { sentAt: "asc" } });
      const waitMin = firstPending ? Math.floor((Date.now() - firstPending.sentAt.getTime()) / 60_000) : 0;
      results.push({ name: g.name, lastRole: lastMsg.role, pendingCount, waitMin });
    }
    const setting = await db2.summaryBotSetting.findUnique({ where: { id: "default" } });
    return {
      ok: true as const,
      groupCount: groups.length,
      results,
      targetGroupChatId: setting?.targetGroupChatId ?? null,
      hasToken: !!setting?.botToken,
      hasSecret: !!setting?.webhookSecret,
    };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "unknown error" };
  }
}

export async function testSummaryBotPing() {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const setting = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
  if (!setting?.targetGroupChatId) {
    return { ok: false as const, error: "ยังไม่ได้ตั้ง Group Chat ID" };
  }
  const r = await sendSummaryMessage(
    setting.targetGroupChatId,
    "🔔 ทดสอบ Summary Bot จาก Telabotpower"
  );
  if (!r.ok) return { ok: false as const, error: r.description ?? "ส่งไม่สำเร็จ" };
  return { ok: true as const };
}
