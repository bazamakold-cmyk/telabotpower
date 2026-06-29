"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { decrypt, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getSummaryBotInfo, sendSummaryMessage, setSummaryWebhook } from "@/lib/summary-bot";

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
