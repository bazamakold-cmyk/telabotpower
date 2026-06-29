# Summary Bot — Design Spec

**Date:** 2026-06-29  
**Status:** Approved

---

## Overview

เพิ่ม Telegram Bot ตัวใหม่แยกจาก Customer Bot สำหรับกลุ่ม Admin ทีมงานโดยเฉพาะ Bot จะตอบสนองเมื่อมีคนพิมพ์ keyword ที่กำหนด โดยดึงข้อมูลจากระบบและตอบกลับในกลุ่มทันที

---

## Architecture

### Flow

```
ทีมงานพิมพ์ keyword ในกลุ่ม Telegram (เช่น "สรุปแชทค้าง")
         ↓
Telegram ส่ง webhook → POST /api/telegram/summary-webhook
         ↓
ตรวจ Secret Token header (x-telegram-bot-api-secret-token)
         ↓
อ่าน message text → เช็ค Keyword Map ใน code
         ↓
เรียก Handler function → Query DB
         ↓
Format ข้อความ → Telegram sendMessage กลับไปในกลุ่ม
```

### Separation from Customer Bot

| | Customer Bot | Summary Bot |
|-|---|---|
| Token | แยก (เข้ารหัสใน `BotSetting`) | แยก (เข้ารหัสใน `SummaryBotSetting`) |
| Webhook | `/api/telegram/webhook` | `/api/telegram/summary-webhook` |
| กลุ่มเป้าหมาย | กลุ่มลูกค้า | กลุ่ม Admin ทีมงาน |
| ทิศทาง | รับข้อความลูกค้า + ตอบอัตโนมัติ | ตอบ query จากทีม |

---

## Database

### New Model: `SummaryBotSetting`

```prisma
model SummaryBotSetting {
  id              String   @id @default(cuid())
  botToken        String?  // encrypted with ENCRYPTION_KEY
  webhookUrl      String?
  webhookSecret   String?
  targetGroupChatId String? // Telegram chat ID of admin group
  isActive        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Token เข้ารหัสด้วย `ENCRYPTION_KEY` เดิม เหมือน `BotSetting.botToken`

---

## Keyword System

### Keyword Map (ใน `lib/summary-bot.ts`)

```ts
const KEYWORD_HANDLERS: Record<string, Handler> = {
  'สรุปแชทค้าง': handlePendingChats,
  // เพิ่ม keyword ใหม่ที่นี่ทีหลัง
}
```

### Matching Rules

- **Contains match** — ไม่ต้องพิมพ์ตรงๆ ทั้งหมด (เช่น "ช่วยสรุปแชทค้างด้วย" จับได้)
- **Case-insensitive**
- **Trim whitespace**
- ถ้าไม่ match keyword ใดเลย — Bot ไม่ตอบ (ไม่รบกวนการสนทนาปกติ)

---

## Handlers

### `handlePendingChats`

**Trigger:** keyword "สรุปแชทค้าง"

**Data Source:** Logic เดิมจาก `/api/pending-chats`
- Query `ChatMessage` role = `CUSTOMER` ที่ไม่มี reply จาก `ADMIN` หรือ `BOT` ตามหลัง
- Join กับ `TelegramGroup` เพื่อได้ชื่อกลุ่ม
- คำนวณเวลารอจาก `sentAt` ถึงปัจจุบัน
- **แสดงเฉพาะกลุ่มที่มีแชทค้าง** (กลุ่มที่ count = 0 ไม่แสดง)

**Response Format (มีค้าง):**
```
📊 สรุปแชทค้าง
━━━━━━━━━━━━━━━
🔴 กลุ่ม ลูกค้า VIP: 3 แชท (รอนานสุด 45 นาที)
🟡 กลุ่ม Support: 1 แชท (รอนานสุด 12 นาที)
━━━━━━━━━━━━━━━
📌 รวม: 4 แชทค้าง
🕐 อัพเดท: 14:32 น.
```

**Response Format (ไม่มีค้าง):**
```
✅ ไม่มีแชทค้าง
🕐 อัพเดท: 14:32 น.
```

**Color Logic:**
- 🔴 รอนานสุด > 30 นาที
- 🟡 รอนานสุด 10–30 นาที
- (กลุ่ม < 10 นาที ไม่แสดง เพราะยังไม่ถือว่าค้าง — TBD อาจปรับได้)

---

## Files

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `prisma/schema.prisma` | เพิ่ม model `SummaryBotSetting` |
| `prisma/migrations/...` | migration ใหม่ |
| `lib/summary-bot.ts` | Keyword map, handlers, Telegram sendMessage |
| `lib/actions/summary-bot.ts` | Server actions: save token, configure webhook, test send |
| `app/api/telegram/summary-webhook/route.ts` | Webhook handler |
| `app/(dashboard)/settings/page.tsx` | เพิ่ม Summary Bot section |

---

## Settings UI

Section ใหม่ในหน้า `/settings` (ต่อจาก Bot Settings เดิม):

```
┌─ Summary Bot ──────────────────────────────────┐
│                                                  │
│  Bot Token    [••••••••••••••]  [บันทึก]        │
│  Group Chat ID  [-1001234567890]  [บันทึก]      │
│  Webhook URL   [https://...]   [ตั้งค่า Webhook] │
│                                                  │
│  สถานะ: ● เชื่อมต่อแล้ว / ○ ยังไม่ตั้งค่า       │
│                                                  │
│  [ทดสอบส่งข้อความ]                              │
└──────────────────────────────────────────────────┘
```

**Actions:**
- บันทึก Bot Token (เข้ารหัสก่อนเก็บ)
- บันทึก Group Chat ID
- ปุ่ม "ตั้งค่า Webhook" — เรียก Telegram setWebhook API
- ปุ่ม "ทดสอบส่งข้อความ" — ส่งข้อความ ping ไปกลุ่ม Admin

---

## Security

- Webhook request ตรวจสอบด้วย `x-telegram-bot-api-secret-token` header
- Bot Token เข้ารหัสด้วย `ENCRYPTION_KEY` ก่อนเก็บใน DB
- Webhook endpoint ไม่มี auth session (รับจาก Telegram โดยตรง) แต่ป้องกันด้วย secret token
- Bot ตอบได้เฉพาะกลุ่มที่ตรงกับ `targetGroupChatId` เท่านั้น (ป้องกัน Bot ถูกเพิ่มในกลุ่มอื่น)

---

## Future Keywords (เพิ่มทีหลัง)

ตัวอย่าง keyword ที่อาจเพิ่มได้:
- `สรุปงานค้าง` → Ticket ที่ยัง RECEIVED/WORKING
- `ตอบช้ากี่นาที` → average response time
- `แชทรอดราฟท์` → AiDraft ที่ status = PENDING

เพิ่มโดยบอก Claude แล้ว redeploy — ไม่ต้องเปลี่ยน DB schema
