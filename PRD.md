# PRD & แผนพัฒนา — Telabotpower

> **ระบบติดตามการทำงานและผู้ช่วยอัจฉริยะด้วย Telegram Bot** (หลังบ้านคุมข้อมูลและรายงานผล)
>
> เอกสารนี้เป็นทั้ง **ข้อกำหนด (Specification)** และ **แผนพัฒนาแบบ step-by-step** สำหรับนักพัฒนาและนักออกแบบ UI
>
> สถานะ: ฉบับร่างเพื่อเริ่มพัฒนา · ภาษาเอกสาร: ไทย · อัปเดตล่าสุด: 2026-06-20

---

## สารบัญ

1. [ภาพรวมโครงการ](#1-ภาพรวมโครงการ)
2. [Tech Stack & Infra (รันบน Vercel)](#2-tech-stack--infra-รันบน-vercel)
3. [ระบบดีไซน์ (Design System)](#3-ระบบดีไซน์-design-system)
4. [สถาปัตยกรรมระบบ & โครงไฟล์](#4-สถาปัตยกรรมระบบ--โครงไฟล์)
5. [Data Model](#5-data-model)
6. [บทบาทผู้ใช้ & สิทธิ์](#6-บทบาทผู้ใช้--สิทธิ์)
7. [แผนพัฒนาแบบเฟส (Roadmap)](#7-แผนพัฒนาแบบเฟส-roadmap)
8. [รายละเอียด 7 หน้าหลัก](#8-รายละเอียด-7-หน้าหลัก)
9. [ตรรกะความปลอดภัยบน UI](#9-ตรรกะความปลอดภัยบน-ui)
10. [Vercel Deployment Checklist](#10-vercel-deployment-checklist)
11. [Definition of Done ต่อเฟส](#11-definition-of-done-ต่อเฟส)
12. [การอ่านแชท, Auto-reply & ความเป็นส่วนตัว](#12-การอ่านแชท-auto-reply--ความเป็นส่วนตัว)

---

## 1. ภาพรวมโครงการ

ระบบหลังบ้าน (Admin Dashboard) สำหรับทีมที่ทำงานผ่าน **Telegram** โดยมี Bot คอยช่วยรับเรื่อง/ตอบลูกค้า ตัวเว็บนี้ **ไม่ใช่แชท** (แชทจริงอยู่บน Telegram) แต่ทำหน้าที่:

- **คุมข้อมูล** — พนักงาน/PIN, กลุ่ม Telegram, คลังความรู้ของ AI
- **รายงานผล** — สถิติ KPI, แนวโน้มเวลาตอบกลับ, ตารางงาน/ปัญหา (ticket)
- **ความปลอดภัย** — ล็อกอินตามบทบาท, กันเข้าซ้อน, ล็อกเมื่อกดรหัสผิด

**เป้าหมายคุณภาพ:** ใช้งานง่ายทั้งคอมและมือถือ, โทนล้ำสมัย (Cyberpunk-minimal), เข้าถึงได้ (a11y), และ **deploy บน Vercel ได้ครบทุกฟีเจอร์**

---

## 2. Tech Stack & Infra (รันบน Vercel)

โค้ดเบสเดียว (monorepo เดียว) ไม่แยก frontend/backend — ใช้ Next.js App Router ครอบทั้งหมด

| ชั้น | เทคโนโลยี | หมายเหตุ Vercel |
| --- | --- | --- |
| Framework | **Next.js (App Router) + TypeScript** | เนทีฟ Vercel, deploy ทันที |
| UI | **Tailwind CSS + shadcn/ui** | restyle เป็นธีมนีออน-กลาส |
| ฟอนต์ | `next/font` (Chakra Petch, IBM Plex Sans Thai, JetBrains Mono) | self-host ผ่าน next/font |
| ฐานข้อมูล | **Vercel Postgres (Neon) + Prisma** | serverless + connection pooling |
| Vector store | **pgvector** (บน Postgres ตัวเดียวกัน) | สำหรับ RAG คลังความรู้ |
| ไฟล์อัปโหลด | **Vercel Blob** | client อัปโหลดตรงผ่าน presigned URL |
| Redis / state | **Upstash Redis** | rate-limit, lockout, session, online status |
| งานตามเวลา | **Vercel Cron** | cleanup session, ingest ไฟล์ |
| AI generate | **Anthropic Claude** ผ่าน **Vercel AI SDK** (pluggable) | `claude-opus-4-8`/`claude-sonnet-4-6` เป็นหลัก · สลับเป็น OpenAI-compatible / Hermes / Typhoon ได้ |
| AI embeddings | **Voyage AI** | สร้าง embedding เก็บลง pgvector |
| Telegram | **Bot API ผ่าน Webhook** | `grammY` หรือ `node-telegram-bot-api` (โหมด webhook) |
| QR login | **qrcode (เรนเดอร์ฝั่ง client)** | Telegram QR + bot deep-link = วิธีล็อกอินหลักของ Manager/Admin |
| Auth | **JWT (jose) ใน httpOnly cookie** | stateless + บันทึก active session ใน Redis |
| Validation | **Zod** | ตรวจ input ที่ edge ของ API |
| State (client) | **TanStack Query** + Zustand (เท่าที่จำเป็น) | cache/fetch + UI state เล็กๆ |
| กราฟ | **Recharts** | response-time trend |
| Test | **Vitest** (unit) + **Playwright** (e2e) | รันใน CI |

> **กฎ serverless ที่ทุกฟีเจอร์ต้องเคารพ:** ไม่มีโปรเซสค้าง, ไม่มี memory ถาวรข้าม request, ไม่มี WebSocket server ของตัวเอง, body upload จำกัด ~4.5MB, route ที่ใช้ Prisma/parse ไฟล์ต้องตั้ง `export const runtime = 'nodejs'`

---

## 3. ระบบดีไซน์ (Design System)

### 3.1 ภาษาของดีไซน์
**Cyberpunk-Minimal + Glassmorphism** — พื้นมืดลึก, ขอบ/เงาเรืองแสงนีออนเขียว, การ์ดกึ่งโปร่งแสง, ใช้ accent อย่างมีวินัย (1 จุดเด่นต่อหน้าจอ), พื้นที่ว่างเยอะ, อ่านง่าย

### 3.2 ระบบสี (Semantic Tokens)
ประกาศเป็น **CSS variables** ใน `globals.css` แล้ว map เข้า Tailwind theme — **ห้ามฮาร์ดโค้ด hex ในคอมโพเนนต์** สลับธีมด้วย `class="dark"` บน `<html>` (ค่าเริ่มต้น = dark)

| Token | Dark (ค่าเริ่มต้น) | Light |
| --- | --- | --- |
| `--bg` | `#000000` / `#0a0f0d` | `#f5f7f6` / `#ffffff` |
| `--surface` (การ์ด glass) | `rgba(255,255,255,.04)` + blur | `rgba(255,255,255,.70)` + blur |
| `--border` | `rgba(0,255,102,.18)` | `rgba(0,170,68,.22)` |
| `--accent` | `#00ff66` | `#00aa44` |
| `--text` (หัวข้อ) | `#ffffff` | `#121c17` |
| `--text-muted` (เนื้อหา) | `#a3b8ae` | slate-600 |
| `--danger` | `#ff3b4e` | `#d11d2c` |
| `--warn` | `#ff9f1c` | `#c46a00` |
| `--info` | `#3b82f6` | `#1d4ed8` |
| `--success` | `#00e658` | `#00aa44` |
| `--working` | `#facc15` | `#b8890b` |

> ตรวจ contrast **แยกกันทั้ง 2 ธีม** ให้ผ่าน 4.5:1 (ตัวอักษรปกติ) — สีนีออนบนพื้นสว่างต้องเข้มขึ้นเป็นโทน emerald

### 3.3 Typography (รองรับภาษาไทย)
- **Display / หัวข้อ / ตัวเลข KPI / Login title:** `Chakra Petch` (ทรงเหลี่ยมไซเบอร์ รองรับไทย+อังกฤษ)
- **Body / UI:** `IBM Plex Sans Thai` (หรือ `Noto Sans Thai`)
- **Mono / ตาราง / Chat ID / PIN / นาฬิกานับถอยหลัง:** `JetBrains Mono` + `font-variant-numeric: tabular-nums` (กันเลขขยับ)
- Type scale: 12 · 14 · 16(base) · 18 · 24 · 32 · 48 — line-height body 1.5–1.6

### 3.4 Layout & Responsive
- **Desktop (≥1024px):** `Sidebar` ซ้าย (เมนูหน้าหลัก + ลิงก์ Settings + ThemeToggle + การ์ดผู้ใช้/สถานะ) → เนื้อหาเป็น **Data Table**
- **Tablet (768–1023px):** sidebar ยุบเป็นไอคอน (rail)
- **Mobile (<768px):** **Bottom Navigation** (≤5 ไอเท่ม + เมนู "More") → ตารางแปลงเป็น **Card View อัตโนมัติ** (1 record / การ์ดแนวตั้ง) ตัด scroll แนวนอน
- breakpoints: 375 / 768 / 1024 / 1440 · container max-w-7xl · spacing scale 4/8px

### 3.5 Motion
- Login background: particle plexus บน `<canvas>` เคลื่อนช้าๆ (จำกัดจำนวนจุด/ปิดเมื่อแบตประหยัด)
- ปุ่ม PIN: glow overlay + scale 0.95 ตอนกด (150–250ms ease-out)
- เปลี่ยน role (รหัสผ่าน ↔ PIN keypad): slide/crossfade
- **ทุก animation เคารพ `prefers-reduced-motion`** (ปิด particle/ลดการเคลื่อนไหว)

### 3.6 รายการคอมโพเนนต์ที่ต้องสร้าง
จาก shadcn (restyle): `Button` `Dialog` `Table` `Input` `Toast` `Tabs` `Card` `Badge` `Tooltip` `DropdownMenu`
สร้างเอง: `AppShell` (sidebar/bottom-nav) · `ThemeToggle` · `ParticlePlexus` · `PinKeypad` · `OtpInput` · `KpiCard` · `ResponsiveTable` (table↔card) · `StatusTag` · `UrgencyTag` · `FileDropzone` · `OnlineDot` · `SessionExpiredModal` · `LockdownOverlay` · `LoginQrCode`

### 3.7 UX Guardrails (บังคับใช้)
- Touch target ≥44px · ปุ่ม PIN ใหญ่กดง่ายบนมือถือ
- ตาราง: sortable + `aria-sort`, empty state, มี text alternative
- ฟอร์ม: label มองเห็นเสมอ (ไม่ใช่ placeholder), error ใต้ช่อง, validate ตอน blur, แสดง required
- Modal มีปุ่มปิด/กด Esc ได้, scrim เข้ม 40–60%
- กราฟ: legend + tooltip + empty/loading/error state + respect reduced-motion
- ทุกสีที่บอกสถานะ **ต้องมี icon/ข้อความกำกับ** (ไม่พึ่งสีอย่างเดียว — เผื่อ color-blind)
- ไอคอนใช้ **Lucide** (SVG) ทั้งระบบ — ห้ามใช้ emoji เป็นไอคอน

---

## 4. สถาปัตยกรรมระบบ & โครงไฟล์

```
telabotpower/
├─ app/
│  ├─ (auth)/login/page.tsx          # หน้า 1A — Admin/Manager (PIN keypad)
│  ├─ (auth)/login/super/page.tsx    # หน้า 1B — Super Admin (รหัสผ่าน + OTP 2FA)
│  ├─ (dashboard)/
│  │  ├─ layout.tsx                  # AppShell (sidebar/bottom-nav, guard)
│  │  ├─ page.tsx                    # หน้า 2 — Dashboard Overview
│  │  ├─ users/page.tsx              # หน้า 3 — User & PIN Management
│  │  ├─ groups/page.tsx             # หน้า 4 — Group Registry
│  │  ├─ knowledge/page.tsx          # หน้า 5 — Knowledge Base
│  │  ├─ tickets/page.tsx            # หน้า 6 — Task & Ticket Reports
│  │  └─ settings/page.tsx           # หน้า 7 — Bot & AI Settings (Super Admin)
│  ├─ api/
│  │  ├─ auth/{login,otp,pin,logout,session}/route.ts
│  │  ├─ auth/telegram/{start,poll}/route.ts  # QR login: สร้าง token + poll สถานะ
│  │  ├─ users/route.ts  · users/[id]/route.ts
│  │  ├─ groups/route.ts · groups/[id]/route.ts · groups/[id]/ping/route.ts  # [id]=แก้ purpose/botMode/collections
│  │  ├─ knowledge/{upload-url,faq,ingest,collections}/route.ts  # collections=จัดชุดความรู้
│  │  ├─ tickets/route.ts
│  │  ├─ drafts/route.ts · drafts/[id]/{approve,skip}/route.ts  # อนุมัติ/ข้ามคำตอบ AI (botMode=DRAFT)
│  │  ├─ stats/route.ts
│  │  ├─ telegram/webhook/route.ts   # Bot webhook (Node runtime)
│  │  ├─ telegram/config/route.ts    # อ่าน/บันทึกตั้งค่า bot (token / AI auto-reply)
│  │  ├─ telegram/set-webhook/route.ts # ตั้ง/รีเซ็ต webhook + getWebhookInfo + getMe
│  │  ├─ ai/{config,playground}/route.ts  # ตั้งค่า AI กลาง (AiSetting) + ทดลองถาม (debug RAG)
│  │  └─ cron/{cleanup,ingest,score,retention}/route.ts  # score=คะแนนคุณภาพ, retention=ลบแชท>30วัน
│  ├─ layout.tsx · globals.css
├─ components/  (ui/ จาก shadcn + คอมโพเนนต์ของเรา)
├─ lib/
│  ├─ mock/        # ข้อมูลจำลองเฟสแรก
│  ├─ services/    # service layer: สลับ mock ↔ API จริงด้วย flag เดียว
│  ├─ db.ts        # Prisma client (singleton)
│  ├─ redis.ts     # Upstash client
│  ├─ auth.ts      # JWT, session, role guard
│  ├─ telegram.ts  # ส่ง/รับ Telegram
│  ├─ ai.ts        # provider abstraction (Vercel AI SDK): Claude หลัก/สลับได้ + Voyage embeddings + RAG
│  └─ validators/  # Zod schemas
├─ hooks/  · prisma/schema.prisma
├─ tests/  (vitest + playwright)
└─ .env.local · vercel.json
```

**กลยุทธ์ mock-first:** ทุกหน้าเรียกข้อมูลผ่าน `lib/services/*` ที่อ่าน flag `NEXT_PUBLIC_USE_MOCK` — เฟสแรกคืน mock, เฟสหลังสลับเป็น fetch API จริงโดย **ไม่ต้องแก้ไฟล์หน้า UI**

---

## 5. Data Model

โครง Prisma (สรุป — รายละเอียด field เพิ่มเติมตอน implement):

```prisma
model User {           // พนักงาน/ผู้ใช้ระบบ
  id          String   @id @default(cuid())
  name        String
  role        Role     // SUPER_ADMIN | MANAGER | ADMIN
  username    String?  @unique          // เฉพาะ SUPER_ADMIN
  passwordHash String?                  // เฉพาะ SUPER_ADMIN (argon2/bcrypt)
  pinHash     String?                   // MANAGER/ADMIN — เก็บ hash ของ PIN 6 หลัก
  telegramId  String?  @unique          // ผูกกับแอดมินบน Telegram
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Session {        // บังคับ 1 active session ต่อผู้ใช้ (กันเข้าซ้อน)
  id         String   @id @default(cuid())
  userId     String
  deviceInfo String?
  createdAt  DateTime @default(now())
  expiresAt  DateTime
  // primary store จริงอยู่ใน Redis; ตารางนี้สำหรับ audit/historical
}

model LoginAttempt {   // ใช้คุม brute-force (มิเรอร์จาก Redis เพื่อ audit)
  id        String   @id @default(cuid())
  identifier String  // userId หรือ ip
  success   Boolean
  createdAt DateTime @default(now())
}

model TelegramGroup {  // กลุ่มที่ลงทะเบียน — แต่ละกลุ่มมีวัตถุประสงค์/พฤติกรรมของตัวเอง
  id          String   @id @default(cuid())
  name        String
  chatId      String   @unique
  purpose     String?  // วัตถุประสงค์ของกลุ่ม — ใช้เป็น context/persona ให้ AI ตอบ
  botMode     BotMode  @default(DRAFT)  // AUTO_REPLY | DRAFT | OFF (ตั้งต่อกลุ่ม)
  collections KnowledgeCollection[]     // คลังความรู้ที่กลุ่มนี้ใช้ตอบ (many-to-many)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model KnowledgeDoc {   // ไฟล์/FAQ ในคลังความรู้
  id           String   @id @default(cuid())
  collectionId String   // อยู่ในคลังความรู้ชุดใด (ผูกกับกลุ่มผ่าน collection)
  type         DocType  // FILE | FAQ
  title        String
  blobUrl      String?  // ไฟล์บน Vercel Blob
  question     String?  // FAQ
  answer       String?  // FAQ
  status       IngestStatus // PENDING | PROCESSING | READY | FAILED
  createdAt    DateTime @default(now())
}

model KnowledgeChunk { // chunk + embedding สำหรับ RAG
  id        String                @id @default(cuid())
  docId     String
  content   String
  embedding Unsupported("vector") // pgvector
}

model Ticket {         // งาน/ปัญหาที่แอดมินรับจาก Telegram
  id        String   @id @default(cuid())
  groupId   String
  adminId   String?
  tag       String   // แท็กเรื่องที่แจ้ง
  urgency   Urgency  // HIGH | MEDIUM | NORMAL
  status    TicketStatus // WORKING | DONE
  respondedAt DateTime?
  createdAt DateTime @default(now())
}

model BotSetting {     // ตั้งค่า Telegram Bot (singleton แถวเดียว) — Super Admin เท่านั้น
  id             String   @id @default("default")
  botToken       String?  // เก็บแบบเข้ารหัส ไม่โชว์ค่าเต็มบน UI
  webhookUrl     String?
  webhookSecret  String?
  aiAutoReply    Boolean  @default(true)  // ค่าเริ่มต้นทั้งระบบ — แต่ละกลุ่ม override ได้ที่ botMode
  defaultGroupId String?
  updatedAt      DateTime @updatedAt
}

model AiSetting {     // ตั้งค่า AI กลาง (singleton) — Super Admin
  id                     String   @id @default("default")
  provider               String   @default("anthropic")  // pluggable: anthropic | openai-compatible
  chatModel              String   @default("claude-sonnet-4-6")
  embedModel             String   @default("voyage-3")
  systemPrompt           String?  // persona/น้ำเสียงกลาง (กลุ่ม override ด้วย purpose)
  autoReplyMinConfidence Float    @default(0.7)  // เกณฑ์ตอบเองสำหรับ botMode=AUTO_REPLY
  ragTopK                Int      @default(5)
  ragMinScore            Float    @default(0.75)
  scoringEnabled         Boolean  @default(true)
  scoringRubric          String?  // เกณฑ์ให้คะแนนคุณภาพ
  updatedAt              DateTime @updatedAt
}

model KnowledgeCollection { // ชุดคลังความรู้ (1 ชุด = หลายไฟล์/FAQ) ผูกกับกลุ่มได้
  id          String          @id @default(cuid())
  name        String
  description String?
  docs        KnowledgeDoc[]
  groups      TelegramGroup[] // กลุ่มที่ใช้คลังชุดนี้ตอบ
}

model ChatMessage {   // log ข้อความในกลุ่ม (privacy mode off) — เก็บ 30 วันแล้วลบด้วย cron
  id        String   @id @default(cuid())
  groupId   String
  tgUserId  String   // ผู้ส่งบน Telegram
  adminId   String?  // ถ้าผู้ส่งเป็นแอดมินที่ลงทะเบียน
  role      MsgRole  // CUSTOMER | ADMIN | BOT
  text      String
  replyToTg String?  // อ้างถึงข้อความที่ตอบ (ใช้คำนวณ response time)
  sentAt    DateTime
  createdAt DateTime @default(now())
}

model AiDraft {       // คำตอบที่ AI ร่างไว้ (botMode=DRAFT) รออนุมัติ
  id        String      @id @default(cuid())
  groupId   String
  sourceMsg String      // ChatMessage ของลูกค้าที่ตอบ
  draftText String
  status    DraftStatus @default(PENDING) // PENDING | SENT | EDITED | SKIPPED
  adminId   String?     // ใครอนุมัติ/แก้
  createdAt DateTime    @default(now())
}
```

Enums: `Role`, `DocType`, `IngestStatus`, `Urgency`, `TicketStatus`, `BotMode` (AUTO_REPLY·DRAFT·OFF), `MsgRole` (CUSTOMER·ADMIN·BOT), `DraftStatus` (PENDING·SENT·EDITED·SKIPPED)

---

## 6. บทบาทผู้ใช้ & สิทธิ์

| บทบาท | ล็อกอินด้วย | สิทธิ์โดยสรุป |
| --- | --- | --- |
| **Super Admin** | Username/Password + **OTP 2FA** | ทุกอย่าง: จัดการผู้ใช้/PIN, กลุ่ม, คลังความรู้, ดูรายงานทั้งหมด, ตั้งค่าระบบ |
| **Manager** | **Telegram QR** (หลัก) / **PIN** (fallback) | จัดการกลุ่ม/คลังความรู้, ดูรายงานทีม, จัดการ ticket |
| **Admin** | **Telegram QR** (หลัก) / **PIN** (fallback) | ดู dashboard ของตน, จัดการ ticket ที่รับผิดชอบ |

Role guard ทำ 2 ชั้น: (1) middleware เช็ก JWT + role ก่อนเข้า route, (2) ตรวจซ้ำใน API handler ทุกตัว

**ลิงก์ล็อกอินแยกกันตามบทบาท:**
- **Super Admin** → `/login/super` (Username/Password + OTP 2FA)
- **Manager / Admin** → `/login` (**Telegram QR เป็นวิธีหลัก** + ลิงก์ "ใช้ PIN แทน" เป็น fallback)

แต่ละหน้าโชว์เฉพาะกลไกของบทบาทนั้น ไม่ปะปนกัน และมีลิงก์เล็กๆ สลับไปอีกหน้าได้

---

## 7. แผนพัฒนาแบบเฟส (Roadmap)

> เฟส 0–3 = **Frontend + mock data** (ขึ้น Vercel ได้เลย) · เฟส 4–8 = **ต่อ backend จริง**
> ทำตามลำดับ แต่ละ task เล็กพอจะ commit เดี่ยวๆ ได้ และมี Definition of Done (ดูหัวข้อ 11)

### เฟส 0 — Setup โครงการ
1. `create-next-app` (TS, App Router, Tailwind, ESLint) ที่รากโปรเจกต์
2. ติดตั้ง shadcn/ui + Lucide + เพิ่มฟอนต์ผ่าน `next/font` (Chakra Petch, IBM Plex Sans Thai, JetBrains Mono)
3. ตั้ง path alias, Prettier, Vitest, Playwright, โครงโฟลเดอร์ตามหัวข้อ 4
4. ตั้ง CI ขั้นต่ำ (lint + typecheck + test) และเชื่อม repo กับ Vercel (preview deploy ต่อ PR)

### เฟส 1 — Design System + Shell
1. ประกาศ CSS variables ทั้ง 2 ธีม + map เข้า Tailwind theme (หัวข้อ 3.2)
2. สร้าง `ThemeToggle` + เก็บค่าธีมใน localStorage + เคารพ `prefers-color-scheme` ครั้งแรก
3. restyle primitives ของ shadcn ให้เป็นธีมนีออน-กลาส (Button/Card/Input/Dialog/Table/Badge/Toast)
4. สร้าง `AppShell`: Sidebar (desktop) ↔ Bottom Nav (mobile) + active state + safe-area
5. สร้าง `ResponsiveTable` (สลับ table↔card อัตโนมัติตาม breakpoint) + `StatusTag` + `UrgencyTag` + `OnlineDot`
6. หน้า error/empty/loading (skeleton) แบบ reusable

### เฟส 2 — 7 หน้า UI ด้วย mock data
สร้างทีละหน้าให้ครบ (รายละเอียดสเปกในหัวข้อ 8): Dashboard → Users → Groups → Knowledge → Tickets → Bot & AI Settings → Login (แยก 2 หน้า: `/login` PIN + `/login/super`)
- แต่ละหน้าดึงข้อมูลผ่าน `lib/services/*` (โหมด mock)
- ครบทั้ง desktop + mobile (card view) + dark + light

### เฟส 3 — Auth UI + Security UI (ยัง mock logic)
1. `ParticlePlexus` background + Login container แบบ glassmorphism (ใช้ร่วมกันทั้ง 2 หน้า)
2. **แยกหน้าตามลิงก์:** `/login` = **`LoginQrCode` (Telegram QR เป็นหลัก)** + ลิงก์ "ใช้ PIN แทน" เผย `PinKeypad` (Manager/Admin) · `/login/super` = Username/Password → สไลด์เผย OTP 2FA (Super Admin) + ลิงก์สลับระหว่างกัน
3. `SessionExpiredModal` (สีแดง) + `LockdownOverlay` (นับถอยหลัง 15 นาที) — ขับด้วย mock state ก่อน
4. ทดสอบ flow บนมือถือจริง (กด PIN, OTP, toggle ธีม)

### เฟส 4 — Backend จริง (DB + API + Auth)
1. ตั้ง Vercel Postgres + Prisma schema (หัวข้อ 5) + migration + เปิด extension `pgvector`
2. ตั้ง Upstash Redis client
3. Auth จริง: hash PIN/password (argon2), ออก JWT (jose) ใน httpOnly cookie, middleware role guard
4. **Single active session:** เก็บ session ปัจจุบันต่อ userId ใน Redis — ล็อกอินใหม่ทับ session เก่า
5. **Brute-force lockout:** นับครั้งกดผิดใน Redis (key ต่อ user/ip) → ครบ 3–5 ครั้งล็อก 15 นาที (TTL)
6. **2FA OTP** สำหรับ Super Admin (TOTP `otplib` หรือ OTP ทาง Telegram)
7. เปลี่ยน `NEXT_PUBLIC_USE_MOCK=false` ให้ทุกหน้าใช้ API จริง (ไม่แตะไฟล์ UI)
8. API CRUD: users, groups, tickets, stats + Zod validation + ทดสอบ

### เฟส 5 — Telegram Bot (Webhook)
1. สร้าง bot กับ BotFather, เก็บ `TELEGRAM_BOT_TOKEN` ใน Vercel env + **ปิด Privacy Mode** (`/setprivacy` → Disable) แล้วเพิ่มบอทเข้ากลุ่มเป็น admin (ให้เห็นทุกข้อความ — ดูหัวข้อ 12)
2. `app/api/telegram/webhook/route.ts` (Node runtime) + ตั้ง `setWebhook` ชี้มาที่ URL Vercel
3. รับ event ทุกข้อความ → **log ลง `ChatMessage`** (ระบุ CUSTOMER/ADMIN จาก `telegramId`), ผูกแอดมิน, เปิด/อัปเดต ticket, **จับคู่ลูกค้า→แอดมินตอบ → คำนวณ response time → เขียน stats** (ป้อน KPI หน้า 2)
4. หน้า 4 ปุ่ม **Ping/Test Bot** → API ยิงข้อความทดสอบเข้า `chatId`
5. ปกป้อง webhook ด้วย secret token ของ Telegram
6. ต่อ **หน้า 7 แท็บ Bot** เข้า API จริง: ตั้ง/อัปเดต token (เข้ารหัสก่อนเก็บ), ปุ่มตั้ง/รีเซ็ต webhook + ดูสถานะ (`getWebhookInfo`), ทดสอบเชื่อมต่อ (`getMe`), สลับ AI auto-reply — Super Admin เท่านั้น
7. **Telegram QR login จริง:** `/api/auth/telegram/start` สร้าง one-time token (Redis TTL 2 นาที, ผูก browser nonce) → render QR ของ `t.me/<bot>?start=<token>` → webhook รับ `/start <token>` เช็ค telegramId ที่ลงทะเบียน+isActive → บอทเด้ง inline ปุ่มยืนยัน (โชว์อุปกรณ์/IP) → ตั้ง token = authenticated → `/api/auth/telegram/poll` ออก JWT cookie (ใช้ anti-concurrent + lockdown เดิม)
8. ต่อ **config ต่อกลุ่ม** (หน้า 4) เข้า API จริง: `purpose` / `botMode` / `collections` + cron `retention` ลบ `ChatMessage` ที่เกิน **30 วัน**

### เฟส 6 — AI Knowledge Base (RAG)
1. หน้า 5 อัปโหลด: ขอ presigned URL → client อัปโหลดไฟล์ตรงไป **Vercel Blob** (เลี่ยง limit 4.5MB)
2. **Ingest pipeline** (Vercel Cron / on-demand): ดึงไฟล์ → parse (pdf-parse/mammoth) → chunk → สร้าง embedding ด้วย **Voyage AI** → เก็บลง pgvector → set status `READY`
3. FAQ ที่กรอกมือ → embedding เช่นกัน
4. ตอบคำถามในกลุ่ม: เลือกเฉพาะ chunk ใน **collection ของกลุ่มนั้น** → similarity search pgvector → ใส่ **`group.purpose` เป็น persona** → **Claude** generate คำตอบ
5. แสดงสถานะ ingest ของแต่ละ doc บนหน้า 5 (แยกตาม collection)
6. **botMode ต่อกลุ่ม:** `AUTO_REPLY` ส่งเองเมื่อมั่นใจ (ไม่มั่นใจ → เงียบ/แจ้งแอดมิน) · `DRAFT` สร้าง `AiDraft` → ส่งให้แอดมินอนุมัติผ่าน **inline button ใน Telegram** หรือกล่อง Pending Drafts หน้า 2 · `OFF` ไม่ตอบ
7. **Cron `score`:** ให้ Claude ให้คะแนนคุณภาพการตอบของแอดมิน/บอท → ป้อน KPI "คะแนน AI ประเมินคุณภาพ"
8. ต่อ **แท็บ AI ในหน้า 7** เข้า `AiSetting` จริง: provider/model, persona กลาง, auto-reply threshold, RAG params, scoring rubric + **Playground** ทดสอบ (ค่าพวกนี้ถูกใช้โดย step 4–7)

### เฟส 7 — Realtime / Online status / Session enforcement
1. **สถานะ "PIN กำลังออนไลน์"** (หน้า 3): heartbeat เขียน Redis (TTL สั้น) + client poll `/api/auth/session` หรือใช้ realtime channel
2. **เตะเซสชันเก่า:** เมื่อ session ถูกทับ client เก่า poll เจอ session ไม่ตรง → เด้ง `SessionExpiredModal` แล้วส่งกลับ login
3. เชื่อม `LockdownOverlay` กับ lockout จริงใน Redis (countdown จาก TTL ที่เหลือ)

### เฟส 8 — Deploy & Hardening
1. ตั้ง env ครบบน Vercel (ดูหัวข้อ 10) + เชื่อม Postgres/Blob/Upstash ผ่าน Vercel integration
2. ตั้ง **Vercel Cron**: cleanup session หมดอายุ, ประมวลผล ingest ค้าง
3. Security headers, rate-limit ทุก auth route, ตรวจ Node runtime ครบ route ที่ใช้ Prisma/parse
4. Lighthouse + a11y audit (contrast 2 ธีม, keyboard nav, reduced-motion) + e2e หลัก
5. Production deploy + smoke test

---

## 8. รายละเอียด 7 หน้าหลัก

### หน้า 1 — Login (แยก 2 ลิงก์ตามบทบาท)
ทั้งสองหน้าใช้พื้นหลัง **Particle Plexus / Data Matrix** (canvas, ปิดเมื่อ reduced-motion) + กล่อง **Glassmorphism** ขอบเรืองแสงเขียวร่วมกัน

**หน้า 1A — `/login` (Manager / Admin):**
- **Telegram QR (วิธีหลัก):** แสดง QR ในกล่อง glass → สแกนด้วยแอป Telegram → กดยืนยันในบอท → เว็บ poll แล้วเข้าระบบอัตโนมัติ · มีสถานะชัดเจน: *รอสแกน → ยืนยันแล้ว → QR หมดอายุ (ปุ่มสร้างใหม่)*
- **PIN (fallback):** ลิงก์ "ใช้ PIN แทน" → สไลด์เผย **PIN Keypad 6 หลัก** (glow overlay + scale ตอนกด, จุดบอกจำนวนหลัก)
- ลิงก์เล็ก "เข้าระบบสำหรับ Super Admin" → ไป `/login/super`

**หน้า 1B — `/login/super` (Super Admin):**
- ช่อง Username/Password → ถ้าถูกต้อง สไลด์เผยช่อง **OTP 2FA**
- ลิงก์เล็ก "เข้าระบบด้วย PIN" → กลับ `/login`

ทั้งคู่เชื่อม Security UI (หัวข้อ 9): กดผิดเกินกำหนด → `LockdownOverlay`

### หน้า 2 — Dashboard Overview
- **KPI Cards 4 ใบ:** เวลาเฉลี่ยการตอบกลับ · คะแนน AI ประเมินคุณภาพ · งานสะสม (Working) · งานสำเร็จ (Done) — **คำนวณจากข้อมูลแชทจริง** (ดูหัวข้อ 12)
- **กราฟ Response Time Trend** (Recharts line) + legend + tooltip + empty/loading/error state
- **กล่อง "คำตอบ AI รออนุมัติ" (Pending Drafts):** ลิสต์ `AiDraft` จากกลุ่มที่ตั้ง `botMode=DRAFT` พร้อมปุ่มอนุมัติ/แก้/ข้าม
- มือถือ: KPI เรียงเป็นการ์ดแนวตั้ง, กราฟ scroll/ย่อแกนอัตโนมัติ

### หน้า 3 — User & PIN Management
- ตารางผู้ใช้ + ฟอร์มเพิ่ม/แก้ไข: ชื่อ, บทบาท, **Telegram ID**, **PIN 6 หลัก**
- ป้ายสถานะสดๆ **"PIN นี้กำลังออนไลน์อยู่หรือไม่"** (`OnlineDot` เขียว/เทา จาก heartbeat)
- มือถือ: card view (1 ผู้ใช้/การ์ด) + ปุ่มแก้ไข/ลบ (ลบมี confirm)

### หน้า 4 — Group Registry
- ตาราง: **ชื่อกลุ่ม** + **Telegram Chat ID** + โหมดบอท + สถานะ
- ปุ่ม **Ping/Test Bot** → ยิงข้อความทดสอบเข้ากลุ่ม + toast ผลลัพธ์
- ฟอร์มเพิ่ม/แก้กลุ่ม (validate ด้วย Zod) — ตั้งค่า **ต่อกลุ่ม** ได้:
  - **วัตถุประสงค์กลุ่ม (purpose):** อธิบายว่ากลุ่มนี้ทำอะไร → ใช้เป็น context/persona ให้ AI ตอบให้ตรงบริบท
  - **โหมดบอท (botMode):** `AUTO_REPLY` (ตอบเอง) · `DRAFT` (ร่างให้แอดมินอนุมัติ) · `OFF` (ไม่ตอบ)
  - **คลังความรู้ที่ใช้ตอบ:** multi-select เลือก **Collection** (หน้า 5) ที่กลุ่มนี้ดึงมาตอบ — คนละกลุ่มใช้คนละชุดได้
- มือถือ: card view (1 กลุ่ม/การ์ด)

### หน้า 5 — Knowledge Base Management
- จัดคลังความรู้เป็น **Collection** (ชุด) — สร้าง/แก้/ลบ collection แล้วผูกกับกลุ่มในหน้า 4
- เลือก collection ปลายทางตอน **Drag & Drop** อัปโหลด PDF/Docx/TXT (`FileDropzone`) → อัปโหลดตรงไป Vercel Blob
- Textarea กรอก **FAQ (คำถาม–คำตอบ)** ด้วยมือ → เก็บเข้า collection ที่เลือก
- รายการเอกสารแยกตาม collection + **สถานะ ingest** (Pending/Processing/Ready/Failed) + ปุ่มลบ/ลองใหม่

### หน้า 6 — Task & Ticket Reports
- ตารางสรุป: **ID งาน · กลุ่ม · ชื่อแอดมิน · แท็กเรื่อง · ความเร่งด่วน · สถานะ**
- **UrgencyTag:** แดง (เร่งด่วนมาก) · ส้ม (ปานกลาง) · ฟ้า/น้ำเงิน (ปกติ) — มีไอคอน+ข้อความกำกับ
- **StatusTag:** เหลือง/ส้ม (Working) · เขียว (Done)
- sortable + filter ตามกลุ่ม/สถานะ/ความเร่งด่วน · มือถือ = card view

### หน้า 7 — Bot & AI Settings (เฉพาะ Super Admin)
รวมการตั้งค่าทั้งหมดไว้หน้าเดียว แบ่งเป็น 2 แท็บ: **Bot** และ **AI**

**แท็บ Bot (Telegram):**
- **Bot Token:** ช่อง masked (กดแสดง/ซ่อนได้) เก็บแบบเข้ารหัสในฐานข้อมูล ไม่โชว์ค่าเต็ม
- **Webhook:** ปุ่มตั้ง/รีเซ็ต webhook + แสดงสถานะปัจจุบันจาก `getWebhookInfo` (URL, pending updates, last error)
- **ทดสอบการเชื่อมต่อ:** ปุ่มเรียก `getMe` → แสดงชื่อ/username ของบอท + toast ผลลัพธ์
- **AI Auto-reply (ค่าเริ่มต้นทั้งระบบ):** สวิตช์เปิด/ปิด — แต่ละกลุ่ม override ด้วย `botMode` ที่หน้า 4 ได้
- ลิงก์คู่มือการตั้งค่ากับ BotFather

**แท็บ AI (`AiSetting`):**
- **Provider & Model:** เลือก provider (Claude default) + chat model (`opus`/`sonnet`) — รองรับ pluggable
- **Embeddings:** provider/model (Voyage)
- **Persona / System prompt กลาง:** น้ำเสียง/ขอบเขตเริ่มต้น (กลุ่ม override ด้วย `purpose`)
- **Auto-reply threshold:** ค่าความมั่นใจขั้นต่ำที่บอทจะตอบเอง (`botMode=AUTO_REPLY`)
- **RAG params:** top-k, similarity threshold, ความยาว context
- **Quality scoring:** เปิด/ปิด + เกณฑ์ (rubric) + model + ความถี่ cron
- **Playground:** ลองถาม → ดูคำตอบ + แหล่งอ้างอิง (debug RAG)
- **API keys:** อยู่ใน env ของ Vercel (ไม่แก้ใน UI เพื่อความปลอดภัย) — โชว์สถานะ "ตั้งครบไหม" + ปุ่ม Test

ซ่อนหน้านี้จากบทบาทที่ไม่ใช่ Super Admin (เช็คทั้งฝั่ง UI และ API)

---

## 9. ตรรกะความปลอดภัยบน UI

### 9.1 Anti-Concurrent Alert (กันเข้าซ้อน)
- เก็บ **active session id ต่อ userId** ใน Redis — ล็อกอินเครื่องใหม่ = เขียนทับ session เดิม
- เครื่องเก่า poll/realtime พบว่า session ของตนไม่ใช่ active แล้ว → เด้ง **Modal สีแดง**: "เซสชันของคุณหมดอายุ เนื่องจากเข้าสู่ระบบจากอุปกรณ์อื่น" → เคลียร์ cookie → เตะกลับ Login ทันที

### 9.2 Brute-Force Lockdown (ล็อกหน่วงเวลา)
- นับครั้งกด PIN/รหัสผิดต่อ user/ip ใน Redis
- ครบ **3–5 ครั้ง** → UI ขึ้น **เลเยอร์บล็อกสีแดง** (`LockdownOverlay`) + **นาฬิกานับถอยหลัง 15 นาที** (อ่านจาก TTL ที่เหลือ) — ห้ามกดยืนยันระหว่างล็อก
- ฝั่ง server ปฏิเสธ request ระหว่างล็อก (ไม่เชื่อ client อย่างเดียว)

### 9.3 Telegram QR Login (กัน phishing)
- token ใช้**ครั้งเดียว + TTL สั้น (2 นาที)** เก็บใน Redis และ**ผูกกับ browser nonce** (cookie) — QR ที่ถ่ายต่อไปใช้บนเครื่องอื่นไม่ได้
- บอท**เด้งปุ่ม inline ให้ยืนยัน** พร้อมโชว์อุปกรณ์/IP ก่อนออก session (กันการหลอกให้สแกน QR ของผู้โจมตี)
- รับเฉพาะ **telegramId ที่ลงทะเบียน + isActive** เท่านั้น · ใช้ anti-concurrent (9.1) + lockdown (9.2) ร่วมด้วย

> หลักการ: UI แสดงผลให้ผู้ใช้เข้าใจ แต่ **การบังคับใช้จริงอยู่ที่ server/Redis** เสมอ

---

## 10. Vercel Deployment Checklist

**Environment variables (ตั้งใน Vercel dashboard):**
```
DATABASE_URL / POSTGRES_PRISMA_URL   # Vercel Postgres (pooled)
POSTGRES_URL_NON_POOLING             # สำหรับ migration
KV_REST_API_URL / KV_REST_API_TOKEN  # Upstash Redis
BLOB_READ_WRITE_TOKEN                # Vercel Blob
TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET
ANTHROPIC_API_KEY                    # Claude (provider หลัก)
AI_PROVIDER=anthropic                # สลับได้: anthropic | openai-compatible (Hermes/Typhoon)
# AI_BASE_URL / AI_API_KEY           # (option) endpoint OpenAI-compatible เมื่อใช้ open model
VOYAGE_API_KEY                       # embeddings
JWT_SECRET                           # เซ็น session
ENCRYPTION_KEY                       # เข้ารหัส bot token ที่เก็บใน DB
NEXT_PUBLIC_USE_MOCK=false           # โปรดักชัน
```

**ขั้นตอน deploy:**
1. เชื่อม Postgres + Blob + Upstash ผ่าน Vercel Integrations (env ถูก inject ให้)
2. รัน `prisma migrate deploy` ใน build step + เปิด extension `pgvector`
3. ตั้ง `setWebhook` ของ Telegram → `https://<app>.vercel.app/api/telegram/webhook` + **ปิด Privacy Mode** แล้วเพิ่มบอทเข้ากลุ่มเป็น admin
4. ตั้ง **Vercel Cron** ใน `vercel.json` (cleanup session, ingest, `score` คุณภาพ, `retention` ลบแชท>30วัน)
5. ตรวจ route ที่ใช้ Prisma/parse ไฟล์ตั้ง `export const runtime = 'nodejs'`
6. Smoke test: login ทุก role, ping bot, อัปโหลดไฟล์, ถาม AI, ดูรายงาน

---

## 11. Definition of Done ต่อเฟส

- **เฟส 0–1:** `npm run build` ผ่าน, theme toggle ทำงาน 2 ธีม, AppShell responsive (desktop sidebar ↔ mobile bottom-nav), lint/typecheck เขียว
- **เฟส 2:** 7 หน้าเรนเดอร์ครบด้วย mock, ตารางแปลงเป็น card บนมือถือ, ผ่าน a11y เบื้องต้น (keyboard nav, contrast 2 ธีม)
- **เฟส 3:** login แยก 2 ลิงก์ (`/login` QR + PIN fallback · `/login/super` รหัสผ่าน+OTP) เล่นได้ (mock), QR/PIN keypad/OTP/lockdown/session modal แสดงถูกต้อง, ทดสอบบนมือถือจริง
- **เฟส 4:** auth จริงผ่าน (hash, JWT, role guard), single-session + lockout บังคับที่ server, CRUD API + Zod + unit test เขียว
- **เฟส 5:** webhook รับ event จริง, **log แชท + คำนวณ response time จริง** (ป้อน KPI), เปิด/อัปเดต ticket, ปุ่ม Ping ส่งเข้ากลุ่มได้, config ต่อกลุ่ม (purpose/botMode/collections) ใช้งานได้, **Telegram QR login จริงใช้ได้**, หน้า 7 ตั้ง token/webhook + ทดสอบ getMe ได้
- **เฟส 6:** อัปโหลด→ingest→ตอบคำถามด้วย RAG (จำกัดตาม collection ของกลุ่ม + ใช้ purpose) ได้ครบ loop, botMode AUTO_REPLY/DRAFT/OFF ทำงาน, อนุมัติ draft ได้, cron `score` ป้อน KPI คุณภาพ, หน้า 7 แท็บ AI (provider/model/persona/threshold/RAG/scoring) + Playground ใช้งานได้
- **เฟส 7:** online status สดจริง, เตะเซสชันเก่าได้จริง, countdown ผูกกับ TTL จริง
- **เฟส 8:** ขึ้น production บน Vercel, cron ทำงาน, Lighthouse/a11y ผ่านเกณฑ์, e2e หลักเขียว

---

## 12. การอ่านแชท, Auto-reply & ความเป็นส่วนตัว

### 12.1 ขอบเขตที่ทำได้ (Bot API)
- บอทอ่านข้อความในกลุ่มได้เมื่อ **ปิด Privacy Mode** (BotFather → `/setprivacy` → Disable) + เป็นสมาชิก/แอดมินกลุ่ม
- อ่านได้ **เฉพาะข้อความตั้งแต่บอทเข้ากลุ่มเป็นต้นไป** — Bot API อ่านประวัติย้อนหลังไม่ได้
- ไม่ใช้ user-account (MTProto) เพราะเสี่ยงผิด ToS และซับซ้อน

### 12.2 Pipeline
```
webhook (ทุกข้อความ)
  → ChatMessage (CUSTOMER / ADMIN / BOT)
  → จับคู่ customer→admin reply → response time → KPI หน้า 2
  → ถ้าเป็นคำถาม: RAG เฉพาะ collection ของกลุ่ม + purpose เป็น persona → Claude
       • botMode=AUTO_REPLY → ตอบเองเมื่อมั่นใจ (ไม่มั่นใจ → เงียบ/แจ้งแอดมิน)
       • botMode=DRAFT      → สร้าง AiDraft ให้แอดมินอนุมัติ (inline ใน Telegram / หน้า 2)
       • botMode=OFF        → ไม่ตอบ
  → Cron score:     Claude ให้คะแนนคุณภาพ → KPI "คะแนน AI ประเมิน"
  → Cron retention: ลบ ChatMessage เกิน 30 วัน
```

### 12.3 ต่อกลุ่ม (แต่ละกลุ่มต่างกันได้)
ทุกกลุ่มตั้งค่าแยกที่หน้า 4: **purpose** (บริบท/persona), **botMode**, และ **collections** (คลังความรู้ที่ใช้ตอบ) — กลุ่มฝ่ายขายกับกลุ่มซัพพอร์ตจึงตอบจากคนละชุดความรู้ ด้วยน้ำเสียง/ขอบเขตต่างกันได้

### 12.4 ความเป็นส่วนตัว
- **แจ้งสมาชิกกลุ่ม** ว่ามีบอทบันทึกข้อความเพื่อวิเคราะห์/ช่วยตอบ
- เก็บข้อความ **30 วัน** แล้วลบอัตโนมัติ (cron `retention`)
- เก็บเท่าที่จำเป็น · จำกัดสิทธิ์เข้าถึงตามบทบาท · ข้อมูลอยู่บน Postgres ของระบบ

### 12.5 AI Provider (ออกแบบให้เปลี่ยนได้)
- `lib/ai.ts` ห่อด้วย **Vercel AI SDK** → เปลี่ยน provider จาก env เดียว (`AI_PROVIDER`) โดยไม่แก้โค้ดที่เรียกใช้
- **เริ่มด้วย Claude** (คุณภาพ + ภาษาไทย + zero-ops บน Vercel)
- สลับเป็น **OpenAI-compatible endpoint** ได้ → ครอบคลุม **Hermes / Typhoon** ผ่าน OpenRouter/Together หรือ self-host (vLLM/Ollama) บน **GPU แยก** (เพราะ Vercel ไม่มี GPU)
- **Embeddings แยกจาก chat** เสมอ (Voyage เป็นหลัก) — สลับ embedding provider ได้เช่นกัน

---

> **ก้าวถัดไป:** เมื่อยืนยันแผนนี้ จะแตกเฟส 0–3 เป็น implementation plan ละเอียด (task ย่อยพร้อมไฟล์/เกณฑ์ทดสอบ) แล้วเริ่มลงมือเฟส 0
