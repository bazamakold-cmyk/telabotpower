# 🚀 START PROJECT — คู่มือตั้งต้นโปรเจค

> เอกสารนี้คือ **จุดเริ่มต้น** ของทุกโปรเจค ใช้เป็นแผนที่ (map) บอกว่าโครงสร้างอยู่ตรงไหน,
> ไฟล์ไหนทำหน้าที่อะไร, และต้องทำอะไรบ้างตั้งแต่ "ยังไม่มีอะไร" จนถึง "เว็บรันได้"
>
> 👤 เขียนสำหรับเจ้าของโปรเจคที่ **ไม่ต้องเขียนโค้ดเอง** — ให้ Claude Code ทำตามขั้นตอนในนี้

---

## 0. 🧩 ปลั๊กอินเสริม — ติดตั้งครั้งเดียว ใช้ได้ทุกโปรเจค

ปลั๊กอินเสริม (Claude Code plugins) คือชุด **skill สำเร็จรูป** ที่ช่วยให้ Claude ทำงานเก่งขึ้น
ติดตั้งที่ระดับ **user (global)** ครั้งเดียว → ใช้ได้ทุกโปรเจคในเครื่อง ไม่ต้องลงซ้ำต่อโปรเจค

| ปลั๊กอิน | ทำอะไร | source (repo ในเครื่อง) |
| --- | --- | --- |
| **superpowers** | ชุด workflow มืออาชีพ: วางแผน, debug, TDD, code review, brainstorming | `D:\projects\superpowers` |
| **ui-ux-pro-max** | ฐานความรู้ UI/UX: 67 styles, 161 palettes, font pairing, charts, component | `D:\projects\ui-ux-promaxskill` |

### วิธีที่ใช้อยู่: Junction (live — แก้ repo แล้วมีผลทันที)

เหมาะกับการพัฒนา skill เอง เพราะชี้ตรงไป repo ไม่ copy:

```powershell
# 1) สร้าง junction ใน ~/.claude/skills/  (ชี้ไป repo จริง)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\superpowers"   -Target "D:\projects\superpowers"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\ui-ux-pro-max" -Target "D:\projects\ui-ux-promaxskill"
```

```jsonc
// 2) เปิดใช้งานใน  ~/.claude/settings.json
"enabledPlugins": {
  "superpowers@skills-dir": true,
  "ui-ux-pro-max@skills-dir": true
}
```

```text
3) ⚠️ Restart Claude Code  (ปิด-เปิด session ใหม่) — Claude จะ scan junction ตอนเริ่มเท่านั้น
```

### ทางเลือก: Marketplace (snapshot — เสถียร แต่ต้อง update เอง)

ถ้าแค่ "ใช้" ไม่ได้พัฒนา skill เอง ใช้วิธีนี้ก็ได้ (copy ลง cache):

```bash
claude plugin marketplace add "D:/projects/superpowers"        # หรือ GitHub repo URL
claude plugin install "superpowers@superpowers-dev"            # scope: user (default)
claude plugin update  "superpowers"                            # ดึงของใหม่หลังแก้ repo
```

### ตรวจสอบ & คำสั่งจัดการ

```bash
claude plugin list                      # ดูปลั๊กอินที่ติดตั้ง + สถานะ enabled
claude plugin marketplace list          # ดู marketplace ที่มี
claude plugin disable <plugin>          # ปิดชั่วคราว
claude plugin uninstall <plugin>        # ถอนออก
```

> 💡 **junction vs marketplace:** junction = แก้ repo แล้ว live ทันที (แค่ restart ครั้งแรก) /
> marketplace = เป็น snapshot ใน cache ต้องสั่ง `claude plugin update` ทุกครั้งที่แก้ repo
>
> ✅ เครื่องนี้ติดตั้งทั้งสองตัวแบบ **junction** เรียบร้อยแล้ว — เครื่องใหม่ค่อยทำตามขั้นตอนข้างบน

---

## 1. โปรเจคนี้คืออะไร (กรอกก่อนเริ่ม)

| หัวข้อ | รายละเอียด |
| --- | --- |
| **ชื่อโปรเจค** | telabotpower |
| **ทำอะไร (1 ประโยค)** | _(กรอก... เช่น "ระบบจัดการบอท Telegram")_ |
| **ผู้ใช้งานหลัก** | _(กรอก... ใครใช้)_ |
| **สถานะตอนนี้** | 🟡 ตั้งโครงสร้าง / ยังไม่เริ่ม build |

> 📝 รายละเอียดฟีเจอร์ทั้งหมด → เขียนไว้ใน [PRD.md](PRD.md) (Product Requirements — สเปคของแอป)

---

## 2. แผนที่โครงสร้างโปรเจค (รู้ว่าอะไรอยู่ไหน)

```
telabotpower/
├── STARTPROJECT.md   ← 📍 คุณอยู่ตรงนี้ (คู่มือเริ่มงาน)
├── PRD.md            ← สเปคแอป: ฟีเจอร์ทั้งหมดที่อยากได้
├── CLAUDE.md         ← 🤖 กฎให้ Claude: tech stack, กฎความปลอดภัย, วิธีทำงาน
├── README.md         ← คำอธิบายโปรเจคแบบสั้น
│
├── docs/             ← เอกสาร
│   ├── architecture.md   ← โครงสร้างระบบ (อะไรเชื่อมกับอะไร)
│   ├── decisions/        ← บันทึกการตัดสินใจสำคัญ (ADR)
│   └── runbooks/         ← ขั้นตอนปฏิบัติงาน (deploy, แก้ปัญหา)
│
├── .claude/          ← ตั้งค่า Claude Code
│   ├── settings.json     ← permissions & config
│   ├── hooks/            ← automation อัตโนมัติ
│   └── skills/           ← ทักษะที่ใช้ซ้ำได้ (code-review, refactor, release)
│
├── tools/            ← เครื่องมือ
│   ├── scripts/          ← สคริปต์ช่วยงาน
│   └── prompts/          ← prompt template
│
└── src/              ← โค้ดแอปจริง
    ├── api/              ← ฝั่ง server / API
    └── persistence/      ← ฝั่งฐานข้อมูล (database)
```

**ไฟล์ที่ต้องเปิดดูบ่อยที่สุด:** `STARTPROJECT.md` (ไฟล์นี้) → `PRD.md` → `CLAUDE.md`

---

## 3. Tech Stack มาตรฐาน (ใช้ตัวนี้เสมอ ถ้าไม่ได้สั่งเป็นอย่างอื่น)

| ส่วน | เทคโนโลยี | หมายเหตุ |
| --- | --- | --- |
| **Frontend** | Next.js (App Router) | เว็บ + หน้าเพจ |
| **ORM** | Prisma | คุยกับฐานข้อมูล |
| **Database** | Neon (PostgreSQL) | ค่าเริ่มต้น (เปลี่ยนเป็น Supabase ได้ถ้าสั่ง) |
| **File Storage** | Vercel Blob | เก็บไฟล์/รูป (ไม่เก็บใน DB, ไม่เก็บใน local) |
| **Deploy** | Vercel | ขึ้น production |

> รายละเอียดเต็ม + เหตุผล อยู่ใน [CLAUDE.md](CLAUDE.md)

---

## 4. ขั้นตอนเริ่มโปรเจคใหม่ (ทำตามลำดับ)

### Phase 0 — วางแผน (ก่อนแตะโค้ด)
1. ✍️ กรอก **ข้อ 1** ด้านบน (โปรเจคนี้ทำอะไร)
2. ✍️ เขียนฟีเจอร์ที่อยากได้ลงใน [PRD.md](PRD.md) — บอก Claude ว่า "อยากได้แอปแบบไหน" ก็พอ เดี๋ยว Claude เรียบเรียงให้
3. 🤖 ให้ Claude สรุปแผน (to-do list) + เลือก tech ให้ครบ ก่อนลงมือ

### Phase 1 — สร้างฐาน (Scaffold)
4. สร้าง Next.js app + ติดตั้ง dependencies
5. ตั้งค่า environment variables (ดู **ข้อ 6**)
6. เชื่อมต่อ database (Neon) ผ่าน Prisma
7. ออกแบบ schema (ตารางข้อมูล) ใน `prisma/schema.prisma`

### Phase 2 — ลงมือ Build
8. สร้าง migration ฐานข้อมูล (ใช้วิธี **ปลอดภัย** เท่านั้น — ดู **ข้อ 5**)
9. สร้าง seed data (ข้อมูลตัวอย่าง + admin: `admin147` / `admin123`)
10. สร้าง API + หน้าเว็บตาม PRD ทีละฟีเจอร์
11. ทดสอบแต่ละฟีเจอร์ (เขียน test → รัน → แก้ → ลบ test)

### Phase 3 — รัน & ตรวจ
12. รัน `npm run dev` → เปิด `localhost:3000`
13. ตรวจว่าทำงานครบตาม PRD
14. Deploy ขึ้น Vercel เมื่อพร้อม

---

## 5. ⛔ กฎความปลอดภัยฐานข้อมูล (ห้ามลืมเด็ดขาด)

> **เคยเกิดจริง:** ใช้ `prisma db push` แล้ว **ข้อมูลจริงหายถาวรทั้งหมด**

**ห้ามใช้คำสั่งเหล่านี้เด็ดขาด:**
- ❌ `prisma db push`
- ❌ `prisma migrate reset` / `migrate reset --force`
- ❌ `prisma migrate dev` บน production

**วิธีเปลี่ยน schema ที่ถูกต้อง (ปลอดภัย):**
```bash
# 1) สร้าง migration (ยังไม่ apply)
npx prisma migrate dev --name <ชื่อ> --create-only
# 2) เปิดดู SQL ที่จะรันก่อน
cat prisma/migrations/<timestamp>_<ชื่อ>/migration.sql
# 3) ให้เจ้าของโปรเจคดู SQL ก่อน → แล้วค่อย apply
npx prisma migrate deploy
# 4) อัปเดต client
npx prisma generate
```

📖 รายละเอียดเต็มของกฎทั้งหมด → [CLAUDE.md › Database Safety Rules](CLAUDE.md)

---

## 6. Environment Variables ที่ต้องมี (`.env.local`)

```bash
# Database (Neon / PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

> 🔑 token เอามาจาก dashboard ของ Neon และ Vercel — ถ้าไม่รู้ ให้ Claude แนะนำทีละขั้น

---

## 7. คำสั่งที่ใช้บ่อย (Cheat Sheet)

| งานที่อยากทำ | คำสั่ง |
| --- | --- |
| ติดตั้ง dependencies | `npm install` |
| รันเว็บ (dev) | `npm run dev` → `localhost:3000` |
| สร้าง migration (ปลอดภัย) | `npx prisma migrate dev --name <ชื่อ> --create-only` |
| apply migration | `npx prisma migrate deploy` |
| อัปเดต Prisma client | `npx prisma generate` |
| ดูข้อมูลใน DB | `npx prisma studio` |
| ใส่ข้อมูลตัวอย่าง | `npm run seed` (ถ้ามี script) |
| deploy production | `vercel --prod` |

---

## 8. เริ่มเลย! (สั่ง Claude แบบนี้ได้)

> 💬 ตัวอย่างประโยคสั่งงาน:
> - *"อ่าน STARTPROJECT.md กับ PRD.md แล้วสรุปแผนการ build ให้หน่อย"*
> - *"เริ่ม Phase 1 ตั้งโครง Next.js + เชื่อม Neon ให้เลย"*
> - *"สร้างฟีเจอร์ [ชื่อฟีเจอร์] ตามที่เขียนใน PRD"*

---

_อัปเดตล่าสุด: 2026-06-20 • โครงสร้างนี้อ้างอิงกฎใน [CLAUDE.md](CLAUDE.md)_
