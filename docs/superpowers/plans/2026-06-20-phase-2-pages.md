# Phase 2 — 7 Pages with Mock Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Build all 7 pages (Dashboard, Users, Groups, Knowledge, Tickets, Bot & AI Settings, Login×2) with realistic mock data served through a `lib/services/*` layer, so the entire product is navigable and demoable in both themes — no backend yet.

**Architecture:** `lib/types.ts` holds domain types (from PRD §5). `lib/mock/*` holds seed arrays. `lib/services/*` exposes async getters that read `NEXT_PUBLIC_USE_MOCK` (always mock this phase) — pages call services, never mock directly, so Phase 4 swaps to `fetch` without touching pages. Server components fetch + render; interactivity (forms, PIN keypad, filters, ping) lives in client components. Reuse Phase 1 components (ResponsiveTable, StatusTag, UrgencyTag, OnlineDot, states, AppShell).

**Tech Stack:** Next.js 16 · shadcn/ui · Recharts · Vitest. Dialogs/forms use shadcn Dialog + Input; toasts use sonner.

**Constraints:** All status colors carry icon+text; touch targets ≥44px (PIN keypad); responsive (table↔card); both themes pass contrast.

---

## File Structure

- `lib/types.ts` — `User`, `Role`, `TelegramGroup`, `BotMode`, `KnowledgeCollection`, `KnowledgeDoc`, `IngestStatus`, `Ticket`, `Urgency`, `TicketStatus`, `ResponseTrendPoint`, `Kpis`
- `lib/mock/{users,groups,knowledge,tickets,stats}.ts` — seed arrays
- `lib/services/{users,groups,knowledge,tickets,stats}.ts` — async getters (USE_MOCK)
- `lib/use-mock.ts` — `USE_MOCK` flag + `delay()` helper
- `tests/services.test.ts` — unit test (mock counts / a transform)
- `components/kpi-card.tsx` · `components/response-trend-chart.tsx` (client, Recharts)
- `components/pin-keypad.tsx` · `components/otp-input.tsx` · `components/login-qr.tsx` (client)
- `components/lockdown-overlay.tsx` · `components/session-expired-modal.tsx` (client)
- `components/file-dropzone.tsx` (client, UI only)
- Pages: `app/(dashboard)/{page,users/page,groups/page,knowledge/page,tickets/page,settings/page}.tsx`; `app/(auth)/login/{page,super/page}.tsx`

---

## Task 1: Types + mock + service layer (TDD on a transform)

**Files:** `lib/types.ts`, `lib/use-mock.ts`, `lib/mock/*.ts`, `lib/services/*.ts`, `tests/services.test.ts`

- [ ] **Step 1:** `lib/types.ts` — define domain types/enums (string-literal unions matching PRD §5).
- [ ] **Step 2:** `lib/use-mock.ts`:
```ts
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
export const delay = (ms = 0) => new Promise((r) => setTimeout(r, ms));
```
- [ ] **Step 3:** `lib/mock/*.ts` — seed arrays: ≥6 users (mixed roles, online flags), ≥5 groups (purposes, botModes), ≥3 collections + ≥6 docs (mixed ingest status), ≥10 tickets (mixed urgency/status/admin/group), stats (4 KPIs + 14-point response trend).
- [ ] **Step 4 (TDD):** Write `tests/services.test.ts` expecting `getTickets()` returns ≥10 and `getKpis()` has 4 numeric fields → run (fail) → implement services → run (pass).
- [ ] **Step 5:** `lib/services/*.ts` — each getter `async`, returns mock when `USE_MOCK`, shaped like a future API.
- [ ] **Step 6:** lint+test+build. **Commit** — `feat: domain types + mock data + service layer`

---

## Task 2: Dashboard (service-driven KPIs + Recharts trend)

**Files:** `components/kpi-card.tsx`, `components/response-trend-chart.tsx`, `app/(dashboard)/page.tsx`

- [ ] **Step 1:** `npm install recharts`
- [ ] **Step 2:** `KpiCard` (glass card: label, value, icon, optional delta).
- [ ] **Step 3:** `ResponseTrendChart` (client, Recharts `LineChart` of response-time trend; legend, tooltip, responsive container; reads data via prop; empty state when no data).
- [ ] **Step 4:** Dashboard page (server) fetches `getKpis()` + `getResponseTrend()` → 4 `KpiCard` + chart + the existing recent-tickets ResponsiveTable (now from `getTickets()` sliced).
- [ ] **Step 5:** lint+test+build. **Commit** — `feat: dashboard (KPIs + response-time trend) on mock services`

---

## Task 3: Tickets page (table + filters)

**Files:** `app/(dashboard)/tickets/page.tsx`, `components/tickets-table.tsx` (client for filters)

- [ ] **Step 1:** `TicketsTable` (client): filter controls (status, urgency, group) + ResponsiveTable of tickets with UrgencyTag/StatusTag, admin + OnlineDot, sortable by createdAt. Empty state when filter yields none.
- [ ] **Step 2:** Page (server) fetches `getTickets()` + passes to client table.
- [ ] **Step 3:** lint+test+build. **Commit** — `feat: tickets report page (filters + tags)`

---

## Task 4: Users & PIN page (table + add/edit dialog + delete confirm)

**Files:** `app/(dashboard)/users/page.tsx`, `components/user-form-dialog.tsx`, `components/users-manager.tsx` (client)

- [ ] **Step 1:** `UserFormDialog` (client): fields name, role (select), Telegram ID, PIN (6-digit, shown for Manager/Admin), isActive. Mock submit → toast; no persistence.
- [ ] **Step 2:** `UsersManager` (client): ResponsiveTable of users (name, role, telegramId, OnlineDot for PIN-online, actions edit/delete). Delete → confirm Dialog → toast. "เพิ่มผู้ใช้" opens UserFormDialog.
- [ ] **Step 3:** Page fetches `getUsers()`. lint+test+build. **Commit** — `feat: user & PIN management page (mock CRUD UI)`

---

## Task 5: Groups page (table + ping + per-group config)

**Files:** `app/(dashboard)/groups/page.tsx`, `components/group-form-dialog.tsx`, `components/groups-manager.tsx` (client)

- [ ] **Step 1:** `GroupFormDialog`: name, chatId, purpose (textarea), botMode (select AUTO_REPLY/DRAFT/OFF), collections (multi-select checkboxes from `getCollections()`).
- [ ] **Step 2:** `GroupsManager` (client): ResponsiveTable (name, chatId mono, botMode badge, status) + "Ping/Test" button per row → mock async + toast (success/fail) + add/edit.
- [ ] **Step 3:** Page fetches `getGroups()` + `getCollections()`. lint+test+build. **Commit** — `feat: group registry (ping + per-group purpose/botMode/collections)`

---

## Task 6: Knowledge Base page (collections + dropzone + FAQ + ingest status)

**Files:** `app/(dashboard)/knowledge/page.tsx`, `components/file-dropzone.tsx`, `components/knowledge-manager.tsx` (client)

- [ ] **Step 1:** `FileDropzone` (client, UI only): drag-over highlight, accepts PDF/Docx/TXT, lists picked files → mock "upload" toast.
- [ ] **Step 2:** `KnowledgeManager` (client): collection selector/tabs; FileDropzone; FAQ textarea form (question/answer) → mock add + toast; doc list with ingest status badge (Pending/Processing/Ready/Failed) + delete/retry.
- [ ] **Step 3:** Page fetches `getCollections()` + `getDocs()`. lint+test+build. **Commit** — `feat: knowledge base (collections + dropzone + FAQ + ingest status)`

---

## Task 7: Bot & AI Settings page (tabs)

**Files:** `app/(dashboard)/settings/page.tsx`, `components/settings-bot-tab.tsx`, `components/settings-ai-tab.tsx` (client)

- [ ] **Step 1:** `SettingsBotTab`: masked Bot Token (show/hide), webhook status (mock getWebhookInfo card), "ทดสอบ getMe" button → toast, AI auto-reply switch.
- [ ] **Step 2:** `SettingsAiTab`: provider/model selects, persona textarea, auto-reply threshold (slider/number), RAG top-k + similarity, scoring toggle + rubric, "API keys" status row (mock), Playground (textarea → mock answer card).
- [ ] **Step 3:** Page (client) shadcn `Tabs` [Bot | AI]. Mock save → toast. lint+test+build. **Commit** — `feat: bot & AI settings page (tabs, mock)`

---

## Task 8: Login pages (QR + PIN + super + security overlays)

**Files:** `components/{pin-keypad,otp-input,login-qr,lockdown-overlay,session-expired-modal}.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/login/super/page.tsx`, `components/particle-plexus.tsx`

- [ ] **Step 1:** `ParticlePlexus` (client, canvas) — light moving green dots; respects `prefers-reduced-motion` (renders static if reduced).
- [ ] **Step 2:** `PinKeypad` (client): 6-dot indicator + 0-9 keys (≥44px, glow + scale on press) + backspace; on 6 digits → mock check (correct PIN `123456` → success toast/redirect; wrong → shake + increment; after 3 wrong → `LockdownOverlay`).
- [ ] **Step 3:** `LoginQrCode` (client, placeholder): styled QR box (static SVG/box) + status `รอสแกน` with a "จำลองสแกนสำเร็จ" button → success; "QR หมดอายุ" + refresh.
- [ ] **Step 4:** `LockdownOverlay` (client): red blocking layer + 15:00 countdown (mock, counts down). `SessionExpiredModal` (red Dialog) — exported for later.
- [ ] **Step 5:** `OtpInput` (client): 6-box OTP.
- [ ] **Step 6:** `/login` page: ParticlePlexus bg + glass card; LoginQrCode primary + "ใช้ PIN แทน" reveals PinKeypad; link to `/login/super`.
- [ ] **Step 7:** `/login/super` page: glass card; username/password → on submit reveal OtpInput (slide); link back to `/login`.
- [ ] **Step 8:** lint+test+build. **Commit** — `feat: login pages (QR + PIN keypad + super 2FA + lockdown UI)`

---

## Task 9: Final gate

- [ ] **Step 1:** `npm run lint && npm run test && npm run typecheck && npm run build` — all pass.
- [ ] **Step 2:** Dev smoke: each route returns 200.
- [ ] **Step 3:** **Commit** any remaining + done.

---

## Definition of Done (Phase 2)

- All 7 pages render with mock data via `lib/services/*`; pages never import `lib/mock` directly.
- Dashboard shows KPIs + response-time trend chart.
- Tickets filterable; Users/Groups have add/edit/delete UI + toasts; Groups ping works (mock); Knowledge has dropzone + FAQ + ingest status; Settings has Bot|AI tabs.
- Login: QR + PIN keypad (lockdown after wrong attempts) + super password→OTP; particle bg respects reduced-motion.
- Responsive (table↔card) + both themes; `lint/test/typecheck/build` pass; clean commits.

**Next:** Phase 4 — real backend (Prisma/Neon + auth) wired behind the same services (flip `NEXT_PUBLIC_USE_MOCK`).
