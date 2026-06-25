import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

/** Bot token: prefer the encrypted value in BotSetting, fall back to env. */
export async function getBotToken(): Promise<string | null> {
  const s = await db.botSetting.findUnique({ where: { id: "default" } });
  if (s?.botToken) {
    try {
      return decrypt(s.botToken);
    } catch {
      // ENCRYPTION_KEY mismatch — fall through to env fallback
    }
  }
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

type TgResponse<T> = { ok: boolean; result?: T; description?: string };

export async function callTelegram<T = unknown>(
  method: string,
  params?: Record<string, unknown>
): Promise<TgResponse<T>> {
  const token = await getBotToken();
  if (!token) return { ok: false, description: "ยังไม่ได้ตั้ง Bot Token" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params ?? {}),
    });
    return (await res.json()) as TgResponse<T>;
  } catch {
    return { ok: false, description: "เชื่อมต่อ Telegram ไม่สำเร็จ" };
  }
}

export const getMe = () => callTelegram<{ id: number; username?: string; first_name?: string }>("getMe");
export const sendMessage = (chatId: string, text: string) =>
  callTelegram("sendMessage", { chat_id: chatId, text });
export const getWebhookInfo = () =>
  callTelegram<{ url?: string; pending_update_count?: number; last_error_message?: string }>(
    "getWebhookInfo"
  );
export const setWebhook = (url: string, secretToken: string) =>
  callTelegram("setWebhook", { url, secret_token: secretToken, drop_pending_updates: true });
export const deleteWebhook = () => callTelegram("deleteWebhook");
