# Phase 0 — Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a runnable Next.js (App Router, TS, Tailwind, shadcn/ui) skeleton at the repo root with the 3 project fonts, the folder structure from PRD §4, route stubs for all 7 pages, and dev tooling — verifiable via `npm run build`.

**Architecture:** Single Next.js codebase (frontend + API routes) deployed on Vercel. Phase 0 produces only the scaffold + structure (no real data/logic). Data flows through `lib/services/*` (mock-first) in later phases. Scaffolding is done in a temp dir then merged into the root because `create-next-app` refuses to run in the existing non-empty folder.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Lucide · next/font (Chakra Petch, IBM Plex Sans Thai, JetBrains Mono) · Prettier · Vitest · Playwright.

**Constraints carried forward (from STARTPROJECT.md — apply in later phases):**
- ⛔ **DB safety:** NEVER `prisma db push`, `prisma migrate reset`, or `prisma migrate dev` on prod. Schema changes = `npx prisma migrate dev --name <n> --create-only` → review SQL → `npx prisma migrate deploy` → `npx prisma generate`.
- DB default = **Neon (PostgreSQL)**; File storage = **Vercel Blob**; Deploy = **Vercel**.
- Seed admin later: `admin147` / `admin123`.

---

## File Structure (created/modified in this plan)

- `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `next-env.d.ts` — from scaffold
- `app/layout.tsx` — root layout, wires 3 fonts as CSS variables, `lang="th"`, `className="dark"`
- `app/globals.css` — Tailwind entry (Phase 1 adds tokens)
- `app/page.tsx` — temporary index (redirect to `/login` added in Phase 2; stub for now)
- `app/(auth)/login/page.tsx` · `app/(auth)/login/super/page.tsx` — login stubs
- `app/(dashboard)/layout.tsx` — dashboard shell stub
- `app/(dashboard)/page.tsx` · `users/` · `groups/` · `knowledge/` · `tickets/` · `settings/page.tsx` — page stubs
- `components/.gitkeep`, `lib/{mock,services,validators}/.gitkeep`, `hooks/.gitkeep` — structure
- `components.json` — shadcn config (from `shadcn init`)
- `.prettierrc.json`, `vitest.config.ts`, `playwright.config.ts`, `tests/.gitkeep` — tooling

---

## Task 1: Initialize git and snapshot the current scaffold

**Files:** `.gitignore` (temp minimal, replaced in Task 2)

- [ ] **Step 1: Init git repo**

Run:
```bash
cd "d:/projects/telabotpower"
git init
git config core.autocrlf true
```
Expected: `Initialized empty Git repository ...`

- [ ] **Step 2: Add a minimal .gitignore so we don't commit junk**

Create `.gitignore`:
```
node_modules/
.next/
.env*
!.env.example
```

- [ ] **Step 3: Commit current state (docs/PRD/CLAUDE/etc.)**

Run:
```bash
git add -A
git commit -m "chore: snapshot project docs before Next.js scaffold

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
Expected: a commit is created listing CLAUDE.md, PRD.md, STARTPROJECT.md, docs/, .claude/, src/, tools/.

---

## Task 2: Scaffold Next.js in a temp dir and merge into root

**Files:** adds scaffold files to root (`app/`, `public/`, configs)

- [ ] **Step 1: Scaffold into a temp sibling dir (non-interactive)**

Run:
```bash
cd "d:/projects"
npx --yes create-next-app@latest _telabot_scaffold \
  --typescript --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --skip-install --yes
```
Expected: `Success! Created _telabot_scaffold ...` (no node_modules due to `--skip-install`).

- [ ] **Step 2: Copy scaffold files into the repo root (skip node_modules/.git/README)**

Run:
```bash
cd "d:/projects/_telabot_scaffold"
shopt -s dotglob
for item in *; do
  case "$item" in
    node_modules|.git|README.md) continue ;;
  esac
  cp -r "$item" "d:/projects/telabotpower/"
done
```
Expected: no output (success). The scaffold's `.gitignore` overwrites the temp one from Task 1.

- [ ] **Step 3: Remove the temp scaffold dir**

Run:
```bash
rm -rf "d:/projects/_telabot_scaffold"
```
Expected: dir gone.

- [ ] **Step 4: Verify expected files now exist at root**

Run:
```bash
cd "d:/projects/telabotpower"
ls package.json tsconfig.json next.config.* postcss.config.* app/layout.tsx app/page.tsx app/globals.css
```
Expected: all paths listed (no "No such file").

---

## Task 3: Install dependencies and verify the app builds + runs

**Files:** `package-lock.json`, `node_modules/`

- [ ] **Step 1: Install**

Run:
```bash
cd "d:/projects/telabotpower"
npm install
```
Expected: completes with `added N packages`.

- [ ] **Step 2: Verify production build passes**

Run:
```bash
npm run build
```
Expected: `✓ Compiled successfully` and a route table including `/`.

- [ ] **Step 3: Verify dev server boots (then stop it)**

Run:
```bash
npm run dev &
sleep 8
curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
```
Expected: prints `200`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js (App Router, TS, Tailwind)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire the three project fonts via next/font

**Files:** Modify `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx` with font wiring**

```tsx
import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans_Thai, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Chakra_Petch({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Telabotpower",
  description: "ระบบติดตามการทำงานและผู้ช่วยอัจฉริยะด้วย Telegram Bot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`dark ${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Map font variables in Tailwind via globals.css**

Add to the top of `app/globals.css` (after the existing `@import "tailwindcss";` line):
```css
@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);
}
```

- [ ] **Step 3: Verify build still passes (fonts download at build)**

Run: `npm run build`
Expected: `✓ Compiled successfully` (no font import errors).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: load Chakra Petch / IBM Plex Sans Thai / JetBrains Mono via next/font

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Initialize shadcn/ui + Lucide

**Files:** `components.json`, `components/ui/`, `lib/utils.ts`

- [ ] **Step 1: Init shadcn (non-interactive defaults)**

Run:
```bash
cd "d:/projects/telabotpower"
npx --yes shadcn@latest init -d
```
Expected: creates `components.json`, `lib/utils.ts`, and updates `globals.css` with base tokens. (`-d` = accept defaults.)

- [ ] **Step 2: Add the first primitive + Lucide to prove it works**

Run:
```bash
npx --yes shadcn@latest add button
npm install lucide-react
```
Expected: `components/ui/button.tsx` created; `lucide-react` added to deps.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: init shadcn/ui + lucide-react"
```

---

## Task 6: Create folder structure + route stubs for all 7 pages

**Files:** route group folders, page stubs, structure dirs

- [ ] **Step 1: Create structure dirs with .gitkeep**

Run:
```bash
cd "d:/projects/telabotpower"
mkdir -p components lib/mock lib/services lib/validators hooks tests
touch components/.gitkeep lib/mock/.gitkeep lib/services/.gitkeep lib/validators/.gitkeep hooks/.gitkeep tests/.gitkeep
```

- [ ] **Step 2: Create the auth login stubs**

Create `app/(auth)/login/page.tsx`:
```tsx
export default function LoginPage() {
  return <main className="grid min-h-dvh place-items-center font-display">หน้า 1A — Login (PIN) [stub]</main>;
}
```
Create `app/(auth)/login/super/page.tsx`:
```tsx
export default function SuperLoginPage() {
  return <main className="grid min-h-dvh place-items-center font-display">หน้า 1B — Super Admin Login [stub]</main>;
}
```

- [ ] **Step 3: Create the dashboard layout + page stubs**

Create `app/(dashboard)/layout.tsx`:
```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
```
Create these files, each a stub `export default function Page(){ return <main className="p-6 font-display">{LABEL} [stub]</main>; }` with the matching label:
- `app/(dashboard)/page.tsx` → `หน้า 2 — Dashboard`
- `app/(dashboard)/users/page.tsx` → `หน้า 3 — Users & PIN`
- `app/(dashboard)/groups/page.tsx` → `หน้า 4 — Groups`
- `app/(dashboard)/knowledge/page.tsx` → `หน้า 5 — Knowledge Base`
- `app/(dashboard)/tickets/page.tsx` → `หน้า 6 — Tickets`
- `app/(dashboard)/settings/page.tsx` → `หน้า 7 — Bot & AI Settings`

- [ ] **Step 4: Replace `app/page.tsx` with a simple index stub**

```tsx
import Link from "next/link";
export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center gap-4 font-display">
      <h1 className="text-2xl">Telabotpower</h1>
      <Link className="underline" href="/login">เข้าสู่ระบบ →</Link>
    </main>
  );
}
```

- [ ] **Step 5: Verify all routes compile**

Run: `npm run build`
Expected: route table lists `/`, `/login`, `/login/super`, `/` (dashboard group is pathless so dashboard is also `/` — NOTE: the dashboard `(dashboard)/page.tsx` and root `app/page.tsx` both map to `/` and will collide).

⚠️ **Resolution:** delete the dashboard index collision for now — keep `app/page.tsx` as the public index and move the dashboard overview to `/dashboard`:
```bash
mkdir -p "app/(dashboard)/dashboard"
git mv "app/(dashboard)/page.tsx" "app/(dashboard)/dashboard/page.tsx" 2>/dev/null || mv "app/(dashboard)/page.tsx" "app/(dashboard)/dashboard/page.tsx"
```
Then re-run `npm run build`. Expected: `✓ Compiled successfully`, routes include `/dashboard`, `/users`... wait — route groups don't add path segments, so `users/page.tsx` under `(dashboard)` maps to `/users`. Final expected routes: `/`, `/login`, `/login/super`, `/dashboard`, `/users`, `/groups`, `/knowledge`, `/tickets`, `/settings`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add folder structure + route stubs for all 7 pages"
```

---

## Task 7: Dev tooling — Prettier, Vitest, Playwright

**Files:** `.prettierrc.json`, `vitest.config.ts`, `playwright.config.ts`, `package.json` (scripts)

- [ ] **Step 1: Prettier**

Run: `npm install -D prettier`
Create `.prettierrc.json`:
```json
{ "semi": true, "singleQuote": false, "printWidth": 100 }
```

- [ ] **Step 2: Vitest + a smoke test**

Run: `npm install -D vitest`
Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```
Create `tests/smoke.test.ts`:
```ts
import { expect, test } from "vitest";
test("toolchain runs", () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 3: Playwright (install package + config only; browsers later)**

Run: `npm install -D @playwright/test`
Create `playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
});
```

- [ ] **Step 4: Add scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"format": "prettier --write .",
"e2e": "playwright test"
```

- [ ] **Step 5: Run unit test + lint + build to verify the toolchain**

Run:
```bash
npm run test
npm run lint
npm run build
```
Expected: vitest `1 passed`; lint no errors; build `✓ Compiled successfully`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Prettier, Vitest, Playwright tooling + scripts"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full gate**

Run:
```bash
cd "d:/projects/telabotpower"
npm run lint && npm run test && npm run build
```
Expected: all three succeed.

- [ ] **Step 2: Confirm git log shows the Phase 0 history**

Run: `git log --oneline`
Expected: commits for snapshot, scaffold, fonts, shadcn, stubs, tooling.

---

## Definition of Done (Phase 0)

- `npm run build` and `npm run lint` and `npm run test` all pass.
- App boots (`npm run dev` → `http://localhost:3000` returns 200).
- 3 fonts loaded as CSS variables (`--font-display/body/mono`).
- shadcn/ui initialized; `components/ui/button.tsx` exists; Lucide installed.
- Route stubs resolve: `/`, `/login`, `/login/super`, `/dashboard`, `/users`, `/groups`, `/knowledge`, `/tickets`, `/settings`.
- Folder structure from PRD §4 exists (`components/`, `lib/{mock,services,validators}/`, `hooks/`, `tests/`).
- Clean git history of small commits.

**Next:** Phase 1 — Design System + AppShell (CSS token themes, ThemeToggle, restyled primitives, responsive sidebar/bottom-nav, ResponsiveTable).
