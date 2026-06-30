"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getMe, getWebhookInfo, sendMessage, setWebhook } from "@/lib/telegram";

async function su() {
  return (await requireRole(["SUPER_ADMIN"])) !== null;
}
async function mgr() {
  return (await requireRole(["SUPER_ADMIN", "MANAGER"])) !== null;
}

export async function saveBotToken(token: string) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  if (!token.trim()) return { ok: false as const, error: "กรุณากรอก token" };
  let enc: string;
  try {
    enc = encrypt(token.trim());
  } catch {
    return { ok: false as const, error: "ไม่พบ ENCRYPTION_KEY — กรุณาตั้งค่าใน Vercel → Settings → Environment Variables แล้ว Redeploy" };
  }
  await db.botSetting.upsert({
    where: { id: "default" },
    update: { botToken: enc },
    create: { id: "default", botToken: enc },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function testGetMe() {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const r = await getMe();
  if (!r.ok || !r.result) {
    const raw = r.description ?? "เชื่อมต่อไม่สำเร็จ";
    const msg = raw === "Not Found" || raw === "Unauthorized"
      ? "Token ไม่ถูกต้อง — กรุณากรอก Bot Token ใหม่แล้วกด 'บันทึก' ก่อนทดสอบ"
      : raw;
    return { ok: false as const, error: msg };
  }
  return { ok: true as const, username: r.result.username ?? null, name: r.result.first_name ?? null };
}

export async function fetchWebhookInfo() {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const r = await getWebhookInfo();
  if (!r.ok || !r.result) return { ok: false as const, error: r.description ?? "อ่านไม่สำเร็จ" };
  return {
    ok: true,
    url: r.result.url || null,
    pending: r.result.pending_update_count ?? 0,
    lastError: r.result.last_error_message || null,
  };
}

export async function configureWebhook(baseUrl: string) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const existing = await db.botSetting.findUnique({ where: { id: "default" } });
  const secret = existing?.webhookSecret ?? randomUUID().replace(/-/g, "");
  const url = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  const r = await setWebhook(url, secret);
  if (!r.ok) {
    return { ok: false as const, error: r.description ?? "ตั้ง webhook ไม่สำเร็จ (ต้องเป็น URL สาธารณะ https)" };
  }
  await db.botSetting.upsert({
    where: { id: "default" },
    update: { webhookUrl: url, webhookSecret: secret },
    create: { id: "default", webhookUrl: url, webhookSecret: secret },
  });
  revalidatePath("/settings");
  return { ok: true as const, url };
}

export async function setAiAutoReply(enabled: boolean) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  await db.botSetting.upsert({
    where: { id: "default" },
    update: { aiAutoReply: enabled },
    create: { id: "default", aiAutoReply: enabled },
  });
  return { ok: true as const };
}

export async function pingGroup(chatId: string) {
  if (!(await mgr())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const r = await sendMessage(chatId, "🔔 ทดสอบการเชื่อมต่อจาก Telabotpower");
  if (!r.ok) return { ok: false as const, error: r.description ?? "ส่งไม่สำเร็จ" };
  return { ok: true as const };
}

export async function clearPendingChat(groupId: string) {
  if (!(await su())) return { ok: false as const, error: "ไม่มีสิทธิ์" };
  const group = await db.telegramGroup.findUnique({ where: { id: groupId } });
  if (!group) return { ok: false as const, error: "ไม่พบกลุ่มนี้" };
  await db.chatMessage.create({
    data: {
      groupId,
      tgUserId: "system",
      role: "BOT",
      text: "[เคลียร์โดยแอดมิน]",
      sentAt: new Date(),
    },
  });
  revalidatePath("/pending");
  return { ok: true as const };
}
