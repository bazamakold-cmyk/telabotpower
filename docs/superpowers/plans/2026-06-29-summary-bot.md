# Summary Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม Telegram Bot ตัวใหม่แยกสำหรับกลุ่ม Admin ทีมงาน ตอบ keyword ภาษาไทย (เริ่มจาก "สรุปแชทค้าง") โดยดึงข้อมูลจาก DB แล้วส่งกลับในกลุ่ม

**Architecture:** Bot ใหม่มี token/webhook แยกจาก Customer Bot ทั้งหมด Keyword map อยู่ใน code (`lib/summary-bot.ts`) สามารถเพิ่มได้ทีหลัง config (token + group chat ID) เก็บใน DB model `SummaryBotSetting` เข้ารหัสด้วย `ENCRYPTION_KEY` เดิม

**Tech Stack:** Next.js App Router, Prisma (PostgreSQL/Neon), `lib/crypto.ts` (AES-256-GCM), Telegram Bot API, Vitest

---

## File Map

| ไฟล์ | สถานะ | หน้าที่ |
|------|--------|---------|
| `prisma/schema.prisma` | แก้ไข | เพิ่ม model `SummaryBotSetting` |
| `lib/summary-bot.ts` | สร้างใหม่ | token helper, keyword map, handlers, `dispatchKeyword()` |
| `lib/actions/summary-bot.ts` | สร้างใหม่ | server actions: save token, save chatId, configure webhook, test ping |
| `app/api/telegram/summary-webhook/route.ts` | สร้างใหม่ | webhook handler — validate secret, dispatch keyword |
| `components/settings-summary-bot-tab.tsx` | สร้างใหม่ | UI: token input, chat ID input, webhook button, test ping |
| `app/(dashboard)/settings/page.tsx` | แก้ไข | เพิ่ม Tab "Summary Bot" |

---

## Task 1: DB Schema — เพิ่ม SummaryBotSetting

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: เพิ่ม model ต่อท้าย schema.prisma (หลัง BotSetting)**

เปิด `prisma/schema.prisma` แล้วเพิ่มหลัง `model BotSetting { ... }`:

```prisma
model SummaryBotSetting {
  id                String   @id @default("default")
  botToken          String?  // encrypted AES-256-GCM with ENCRYPTION_KEY
  webhookUrl        String?
  webhookSecret     String?
  targetGroupChatId String?  // Telegram chat ID of admin team group
  updatedAt         DateTime @updatedAt
}
```

- [ ] **Step 2: สร้าง migration file (create-only — ไม่ apply ทันที)**

```bash
npm run db:migrate -- --name add-summary-bot-setting
```

Expected output: `✔  Your database migration file has been generated ... /migrations/.../migration.sql`

- [ ] **Step 3: ตรวจ SQL ที่สร้างมา**

```bash
cat prisma/migrations/*add-summary-bot-setting*/migration.sql
```

Expected: เห็น `CREATE TABLE "SummaryBotSetting" (...)` ไม่มี DROP

- [ ] **Step 4: Apply migration**

```bash
npm run db:deploy
```

Expected output: สำเร็จ ไม่มี error

- [ ] **Step 5: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add SummaryBotSetting model"
```

---

## Task 2: Core Library — `lib/summary-bot.ts`

**Files:**
- Create: `lib/summary-bot.ts`
- Test: `tests/summary-bot.test.ts`

- [ ] **Step 1: เขียน test ก่อน (failing)**

สร้างไฟล์ `tests/summary-bot.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatPendingChatsMessage, matchKeyword } from "@/lib/summary-bot";

describe("matchKeyword", () => {
  it("จับ keyword ตรง", () => {
    expect(matchKeyword("สรุปแชทค้าง")).toBe("สรุปแชทค้าง");
  });

  it("จับ keyword ที่อยู่กลางประโยค", () => {
    expect(matchKeyword("ช่วยสรุปแชทค้างด้วยนะ")).toBe("สรุปแชทค้าง");
  });

  it("return null ถ้าไม่ match", () => {
    expect(matchKeyword("สวัสดี")).toBeNull();
  });

  it("case-insensitive", () => {
    expect(matchKeyword("สรุปแชทค้าง")).not.toBeNull();
  });
});

describe("formatPendingChatsMessage", () => {
  it("ไม่มีค้าง → ข้อความ ✅", () => {
    const msg = formatPendingChatsMessage([], "10:00");
    expect(msg).toContain("✅ ไม่มีแชทค้าง");
    expect(msg).toContain("10:00");
  });

  it("มีค้าง > 30 นาที → 🔴", () => {
    const msg = formatPendingChatsMessage(
      [{ name: "กลุ่ม VIP", count: 3, maxWaitMin: 45 }],
      "10:00"
    );
    expect(msg).toContain("🔴 กลุ่ม VIP: 3 แชท");
    expect(msg).toContain("45 นาที");
    expect(msg).toContain("📌 รวม: 3 แชทค้าง");
  });

  it("มีค้าง 10–30 นาที → 🟡", () => {
    const msg = formatPendingChatsMessage(
      [{ name: "กลุ่ม A", count: 1, maxWaitMin: 15 }],
      "10:00"
    );
    expect(msg).toContain("🟡 กลุ่ม A");
  });

  it("มีค้าง < 10 นาที → 🟢", () => {
    const msg = formatPendingChatsMessage(
      [{ name: "กลุ่ม B", count: 2, maxWaitMin: 5 }],
      "10:00"
    );
    expect(msg).toContain("🟢 กลุ่ม B");
  });

  it("หลายกลุ่ม รวม count ถูกต้อง", () => {
    const msg = formatPendingChatsMessage(
      [
        { name: "A", count: 2, maxWaitMin: 40 },
        { name: "B", count: 1, maxWaitMin: 5 },
      ],
      "14:32"
    );
    expect(msg).toContain("📌 รวม: 3 แชทค้าง");
  });
});
```

- [ ] **Step 2: Run test — ต้อง fail**

```bash
npx vitest run tests/summary-bot.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/summary-bot'`

- [ ] **Step 3: สร้าง `lib/summary-bot.ts`**

```ts
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

// --- Token helper ---

async function getSummaryBotToken(): Promise<string | null> {
  const s = await db.summaryBotSetting.findUnique({ where: { id: "default" } });
  if (s?.botToken) {
    try {
      return decrypt(s.botToken);
    } catch {
      // ENCRYPTION_KEY mismatch
    }
  }
  return null;
}

async function callSummaryTelegram(
  token: string,
  method: string,
  params?: Record<string, unknown>
): Promise<{ ok: boolean; description?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params ?? {}),
    });
    return (await res.json()) as { ok: boolean; description?: string };
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

export async function getSummaryBotInfo(token: string) {
  return callSummaryTelegram(token, "getMe");
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
```

- [ ] **Step 4: Run test — ต้อง pass**

```bash
npx vitest run tests/summary-bot.test.ts
```

Expected: PASS — 8 tests passed

- [ ] **Step 5: Commit**

```bash
git add lib/summary-bot.ts tests/summary-bot.test.ts
git commit -m "feat(summary-bot): add core library with keyword dispatch and message formatting"
```

---

## Task 3: Server Actions — `lib/actions/summary-bot.ts`

**Files:**
- Create: `lib/actions/summary-bot.ts`

- [ ] **Step 1: สร้าง `lib/actions/summary-bot.ts`**

```ts
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
    const raw = (r as { description?: string }).description ?? "เชื่อมต่อไม่สำเร็จ";
    const msg =
      raw === "Not Found" || raw === "Unauthorized"
        ? "Token ไม่ถูกต้อง"
        : raw;
    return { ok: false as const, error: msg };
  }
  const result = (r as { result?: { username?: string; first_name?: string } }).result;
  return { ok: true as const, username: result?.username ?? null, name: result?.first_name ?? null };
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
      error: (r as { description?: string }).description ?? "ตั้ง webhook ไม่สำเร็จ (ต้องเป็น URL สาธารณะ https)",
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
  if (!r.ok) return { ok: false as const, error: (r as { description?: string }).description ?? "ส่งไม่สำเร็จ" };
  return { ok: true as const };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: ไม่มี error

- [ ] **Step 3: Commit**

```bash
git add lib/actions/summary-bot.ts
git commit -m "feat(summary-bot): add server actions for token, chat ID, webhook, ping"
```

---

## Task 4: Webhook Handler — `app/api/telegram/summary-webhook/route.ts`

**Files:**
- Create: `app/api/telegram/summary-webhook/route.ts`

- [ ] **Step 1: สร้าง directory**

```bash
mkdir -p app/api/telegram/summary-webhook
```

- [ ] **Step 2: สร้าง route handler**

สร้าง `app/api/telegram/summary-webhook/route.ts`:

```ts
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
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: ไม่มี error

- [ ] **Step 4: Commit**

```bash
git add app/api/telegram/summary-webhook/route.ts
git commit -m "feat(summary-bot): add webhook handler at /api/telegram/summary-webhook"
```

---

## Task 5: Settings UI — `components/settings-summary-bot-tab.tsx`

**Files:**
- Create: `components/settings-summary-bot-tab.tsx`

- [ ] **Step 1: สร้าง component**

สร้าง `components/settings-summary-bot-tab.tsx`:

```tsx
"use client";

import { Eye, EyeOff, Send, Webhook } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  configureSummaryWebhook,
  saveSummaryBotToken,
  saveSummaryGroupChatId,
  testSummaryBotPing,
  testSummaryBotToken,
} from "@/lib/actions/summary-bot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsSummaryBotTab({
  hasToken,
  hasChatId,
  webhookUrl,
}: {
  hasToken: boolean;
  hasChatId: boolean;
  webhookUrl: string | null;
}) {
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [chatId, setChatId] = useState("");
  const [hookUrl, setHookUrl] = useState<string | null>(webhookUrl);
  const [pending, start] = useTransition();

  function saveToken() {
    if (!token.trim()) { toast.error("กรุณากรอก token"); return; }
    start(async () => {
      const r = await saveSummaryBotToken(token);
      if (r.ok) { toast.success("บันทึก token แล้ว"); setToken(""); }
      else toast.error(r.error);
    });
  }

  function testToken() {
    if (!token.trim()) { toast.error("กรอก token ก่อนทดสอบ"); return; }
    start(async () => {
      const r = await testSummaryBotToken(token);
      if (r.ok) toast.success(`เชื่อมต่อสำเร็จ: @${r.username ?? r.name ?? "bot"}`);
      else toast.error(r.error);
    });
  }

  function saveChatId() {
    if (!chatId.trim()) { toast.error("กรุณากรอก Chat ID"); return; }
    start(async () => {
      const r = await saveSummaryGroupChatId(chatId);
      if (r.ok) { toast.success("บันทึก Chat ID แล้ว"); setChatId(""); }
      else toast.error(r.error);
    });
  }

  function setupWebhook() {
    start(async () => {
      const r = await configureSummaryWebhook(window.location.origin);
      if (r.ok) { toast.success("ตั้ง webhook แล้ว"); setHookUrl(r.url); }
      else toast.error(r.error);
    });
  }

  function ping() {
    start(async () => {
      const r = await testSummaryBotPing();
      if (r.ok) toast.success("ส่งข้อความทดสอบสำเร็จ");
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Token */}
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          Bot Token
          <span
            className={
              hasToken
                ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success"
                : "rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-xs text-warn"
            }
          >
            {hasToken ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้ง"}
          </span>
        </h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={hasToken ? "•••••• (กรอกใหม่เพื่อเปลี่ยน)" : "วาง Bot Token จาก BotFather"}
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "ซ่อน" : "แสดง"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button onClick={saveToken} disabled={pending}>บันทึก</Button>
        </div>
        <p className="text-xs text-muted-foreground">เก็บแบบเข้ารหัส (AES-256-GCM) ไม่แสดงค่าเต็ม</p>
        <Button variant="outline" disabled={pending} onClick={testToken}>
          ทดสอบเชื่อมต่อ
        </Button>
      </section>

      {/* Group Chat ID */}
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          Group Chat ID (กลุ่ม Admin ทีม)
          <span
            className={
              hasChatId
                ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success"
                : "rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-xs text-warn"
            }
          >
            {hasChatId ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้ง"}
          </span>
        </h3>
        <div className="flex gap-2">
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="-1001234567890"
            className="font-mono"
          />
          <Button onClick={saveChatId} disabled={pending}>บันทึก</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          วิธีหา Chat ID: เพิ่ม @userinfobot ในกลุ่ม แล้วพิมพ์ /start
        </p>
      </section>

      {/* Webhook */}
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <Webhook className="size-4 text-primary" aria-hidden /> Webhook
        </h3>
        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">URL</dt>
            <dd className="truncate font-mono">{hookUrl ?? "—"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={setupWebhook}>
            ตั้ง / รีเซ็ต Webhook
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ Webhook ต้องเป็น URL สาธารณะ (https) — ใช้ได้หลัง deploy ขึ้น Vercel
        </p>
      </section>

      {/* Test ping */}
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="font-display font-semibold">ทดสอบส่งข้อความ</h3>
        <p className="text-sm text-muted-foreground">
          ส่งข้อความ ping ไปยังกลุ่ม Admin เพื่อยืนยันว่า Bot ทำงานได้
        </p>
        <Button disabled={pending} onClick={ping}>
          <Send className="mr-2 size-4" />
          ทดสอบส่งข้อความ
        </Button>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: ไม่มี error

- [ ] **Step 3: Commit**

```bash
git add components/settings-summary-bot-tab.tsx
git commit -m "feat(summary-bot): add SettingsSummaryBotTab component"
```

---

## Task 6: Wire Settings Page

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: แก้ไข `app/(dashboard)/settings/page.tsx`**

แทนที่เนื้อหาทั้งหมดด้วย:

```tsx
import { SettingsAiTab } from "@/components/settings-ai-tab";
import { SettingsBotTab } from "@/components/settings-bot-tab";
import { SettingsSummaryBotTab } from "@/components/settings-summary-bot-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireSuperAdmin();

  const [bot, aiSetting, summaryBot] = await Promise.all([
    db.botSetting.findUnique({ where: { id: "default" } }),
    db.aiSetting.findUnique({ where: { id: "default" } }),
    db.summaryBotSetting.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">ตั้งค่า Bot &amp; AI</h1>
      <Tabs defaultValue="bot">
        <TabsList>
          <TabsTrigger value="bot">Bot (Telegram)</TabsTrigger>
          <TabsTrigger value="summary-bot">Summary Bot</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>
        <TabsContent value="bot" className="mt-4">
          <SettingsBotTab
            hasToken={!!bot?.botToken}
            aiAutoReply={bot?.aiAutoReply ?? true}
            webhookUrl={bot?.webhookUrl ?? null}
          />
        </TabsContent>
        <TabsContent value="summary-bot" className="mt-4">
          <SettingsSummaryBotTab
            hasToken={!!summaryBot?.botToken}
            hasChatId={!!summaryBot?.targetGroupChatId}
            webhookUrl={summaryBot?.webhookUrl ?? null}
          />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <SettingsAiTab
            initialChatModel={aiSetting?.chatModel ?? "claude-sonnet-4-6"}
            initialSystemPrompt={aiSetting?.systemPrompt ?? ""}
            initialThreshold={aiSetting?.autoReplyMinConfidence ?? 0.7}
            initialTopK={aiSetting?.ragTopK ?? 5}
            initialScoring={aiSetting?.scoringEnabled ?? true}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
```

- [ ] **Step 2: Type-check และ lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: ไม่มี error

- [ ] **Step 3: Run ทดสอบทั้งหมด**

```bash
npx vitest run
```

Expected: ผ่านทั้งหมด รวมถึง `summary-bot.test.ts`

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/settings/page.tsx
git commit -m "feat(summary-bot): wire Summary Bot tab into settings page"
```

---

## Checklist ตรวจสอบหลัง implement เสร็จ

- [ ] Deploy ขึ้น Vercel
- [ ] ไปที่หน้า `/settings` → Tab "Summary Bot"
- [ ] ใส่ Bot Token → กด "บันทึก" → กด "ทดสอบเชื่อมต่อ" → เห็น username bot
- [ ] ใส่ Group Chat ID → กด "บันทึก"
- [ ] กด "ตั้ง / รีเซ็ต Webhook" → เห็น URL แสดง
- [ ] กด "ทดสอบส่งข้อความ" → เห็นข้อความใน Telegram กลุ่ม Admin
- [ ] พิมพ์ "สรุปแชทค้าง" ในกลุ่ม → Bot ตอบกลับด้วยรายการแชทค้าง

---

## วิธีเพิ่ม Keyword ในอนาคต

บอก Claude ให้เพิ่ม entry ใน `KEYWORD_HANDLERS` ใน `lib/summary-bot.ts`:

```ts
const KEYWORD_HANDLERS: Record<string, () => Promise<string>> = {
  สรุปแชทค้าง: handlePendingChats,
  สรุปงานค้าง: handlePendingTickets,   // ← เพิ่มตรงนี้
};
```

แล้ว implement function `handlePendingTickets()` ก่อน map แล้ว redeploy
