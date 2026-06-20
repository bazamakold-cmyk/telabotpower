# Phase 1 — Design System + AppShell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the Phase 0 scaffold into a themed product shell — neon-cyber / glassmorphism tokens (dark default + light), a no-flash theme toggle, restyled shadcn primitives, a responsive AppShell (desktop sidebar ↔ mobile bottom-nav), and the shared display components (StatusTag, UrgencyTag, OnlineDot, ResponsiveTable, state components) — applied to the existing route stubs.

**Architecture:** Tailwind v4 `@theme inline` maps semantic CSS variables; `:root` = light, `.dark` = dark (default). `next-themes` manages the class with no FOUC. AppShell is a client component using `usePathname` for active state. Display components are presentational and token-driven (color + icon + text, never color alone).

**Tech Stack:** Next.js 16 · Tailwind v4 · shadcn/ui (Base UI) · next-themes · lucide-react · Vitest.

**Constraints carried forward:** DB safety rules (Phase 4+); all colors must pass 4.5:1 in BOTH themes; every status color also carries an icon + text label.

---

## File Structure

- `app/globals.css` — replace token blocks with neon-cyber palette (light `:root` + `.dark`), add custom tokens (`--brand`, `--surface`, `--warn`, `--info`, `--success`, `--working`) + `@theme inline` maps + `.glass` utility
- `components/theme-provider.tsx` — `next-themes` provider wrapper (client)
- `components/theme-toggle.tsx` — sun/moon toggle (client)
- `app/layout.tsx` — wrap children in ThemeProvider; `suppressHydrationWarning` on `<html>`; drop the hardcoded `dark` class (next-themes owns it)
- `components/nav-config.ts` — primary + secondary nav items (href, label, icon)
- `components/app-shell.tsx` — responsive shell (desktop sidebar + mobile top bar + mobile bottom nav)
- `app/(dashboard)/layout.tsx` — render `<AppShell>`
- `components/ui/*` — add via shadcn CLI: card, input, badge, table, dialog, sonner, skeleton, tabs, dropdown-menu, tooltip
- `components/status-tag.tsx`, `components/urgency-tag.tsx`, `components/online-dot.tsx` — tags/dot (+ pure map in `lib/tags.ts`)
- `lib/tags.ts` — pure mappings (urgency/status → label/icon/token); unit-tested
- `components/responsive-table.tsx` — generic table↔card
- `components/states.tsx` — `EmptyState`, `ErrorState` (Skeleton comes from shadcn)
- `app/(dashboard)/page.tsx` — small demo (KPI cards + ResponsiveTable sample) to verify the system visually
- `tests/tags.test.ts` — unit test for `lib/tags.ts`

---

## Token palette (target values for globals.css)

Light (`:root`) / Dark (`.dark`):
- `--background`: `#f5f7f6` / `#0a0f0d`
- `--foreground`: `#121c17` / `#ffffff`
- `--card` (glass): `rgba(255,255,255,0.72)` / `rgba(255,255,255,0.04)`
- `--card-foreground`: `#121c17` / `#ffffff`
- `--primary` (neon): `#00aa44` / `#00ff66` · `--primary-foreground`: `#ffffff` / `#04140a`
- `--brand`: same as primary (semantic alias for accents/glow)
- `--muted-foreground`: `#5b6b63` / `#a3b8ae`
- `--border`: `rgba(0,170,68,0.22)` / `rgba(0,255,102,0.16)`
- `--ring`: `#00aa44` / `#00ff66`
- `--destructive`/`--danger`: `#d11d2c` / `#ff3b4e`
- `--warn`: `#c46a00` / `#ff9f1c` · `--info`: `#1d4ed8` / `#3b82f6`
- `--success`: `#00aa44` / `#00e658` · `--working`: `#b8890b` / `#facc15`

`.glass` utility: translucent `--card` bg + `backdrop-blur-md` + `1px` `--border` border.

---

## Task 1: next-themes provider + no-flash theme

**Files:** Create `components/theme-provider.tsx`; Modify `app/layout.tsx`

- [ ] **Step 1: Install next-themes**

Run: `npm install next-themes`
Expected: `added 1 package`.

- [ ] **Step 2: Create `components/theme-provider.tsx`**

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 3: Wrap layout + suppressHydrationWarning + drop hardcoded `dark`**

In `app/layout.tsx`: remove `dark` from the `<html>` className (keep the font variables + `h-full antialiased`), add `suppressHydrationWarning` to `<html>`, import `ThemeProvider`, and wrap `{children}` in:
```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
  {children}
</ThemeProvider>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 5: Commit** — `feat: add next-themes provider (no-flash, dark default)`

---

## Task 2: Neon-cyber token palette + glass utility

**Files:** Modify `app/globals.css`

- [ ] **Step 1:** Replace the `:root` token block, `.dark` token block, and `@theme inline` color maps with the palette above (keep the existing font + radius lines). Add custom tokens `--brand --surface --warn --info --success --working --danger` to both blocks and map each in `@theme inline` as `--color-*`.

- [ ] **Step 2:** Add a glass utility in `@layer components`:
```css
@layer components {
  .glass {
    background-color: var(--card);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
  }
}
```

- [ ] **Step 3:** Verify build + lint. Run: `npm run build && npm run lint`. Expected: pass.

- [ ] **Step 4: Commit** — `feat: neon-cyber + glass design tokens (dark/light)`

---

## Task 3: ThemeToggle

**Files:** Create `components/theme-toggle.tsx`

- [ ] **Step 1:** Create the toggle (mounted guard to avoid hydration mismatch):
```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
```

- [ ] **Step 2:** Verify build. Run: `npm run build`. Expected: pass.
- [ ] **Step 3: Commit** — `feat: ThemeToggle`

---

## Task 4: Add shadcn primitives

**Files:** `components/ui/{card,input,badge,table,dialog,sonner,skeleton,tabs,dropdown-menu,tooltip}.tsx`

- [ ] **Step 1:** Run:
```bash
npx --yes shadcn@latest add card input badge table dialog sonner skeleton tabs dropdown-menu tooltip
```
Expected: components created (auto-installs any deps).

- [ ] **Step 2:** Add `<Toaster />` (sonner) to `app/layout.tsx` inside ThemeProvider (after `{children}`).

- [ ] **Step 3:** Verify build. Run: `npm run build`. Expected: pass.
- [ ] **Step 4: Commit** — `feat: add shadcn primitives (card/input/badge/table/dialog/sonner/skeleton/tabs/dropdown/tooltip)`

---

## Task 5: nav-config + AppShell, wired into dashboard layout

**Files:** Create `components/nav-config.ts`, `components/app-shell.tsx`; Modify `app/(dashboard)/layout.tsx`

- [ ] **Step 1:** `components/nav-config.ts` — `primaryNav` (Dashboard `/`, Users `/users`, Groups `/groups`, Knowledge `/knowledge`, Tickets `/tickets`) + `secondaryNav` (Settings `/settings`), each `{ href, label (Thai), icon (lucide) }`.

- [ ] **Step 2:** `components/app-shell.tsx` (client) — desktop (`lg`) left sidebar with brand + primary/secondary nav + footer ThemeToggle; mobile top bar (brand + ThemeToggle + Settings link) + fixed bottom nav (5 primary items, `pb-[env(safe-area-inset-bottom)]`); active state via `usePathname` (`/` exact, others `startsWith`). Main content `lg:pl-64 pb-20 lg:pb-0`.

- [ ] **Step 3:** `app/(dashboard)/layout.tsx` → `return <AppShell>{children}</AppShell>;`

- [ ] **Step 4:** Verify build + dev (200). Run build; expected pass.
- [ ] **Step 5: Commit** — `feat: responsive AppShell (sidebar ↔ bottom-nav) + nav config`

---

## Task 6: Tag/Dot components + pure map (TDD)

**Files:** Create `lib/tags.ts`, `tests/tags.test.ts`, `components/status-tag.tsx`, `components/urgency-tag.tsx`, `components/online-dot.tsx`

- [ ] **Step 1: Write failing test** `tests/tags.test.ts`:
```ts
import { expect, test } from "vitest";
import { urgencyMeta, statusMeta } from "@/lib/tags";

test("urgency maps to label + token", () => {
  expect(urgencyMeta("HIGH").token).toBe("danger");
  expect(urgencyMeta("NORMAL").label).toBe("ปกติ");
});
test("status maps to label + token", () => {
  expect(statusMeta("WORKING").token).toBe("working");
  expect(statusMeta("DONE").token).toBe("success");
});
```

- [ ] **Step 2: Run test → fails.** Run: `npm run test`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/tags.ts`:**
```ts
export type Urgency = "HIGH" | "MEDIUM" | "NORMAL";
export type TicketStatus = "WORKING" | "DONE";
export type Token = "danger" | "warn" | "info" | "working" | "success";

export function urgencyMeta(u: Urgency): { label: string; token: Token } {
  switch (u) {
    case "HIGH": return { label: "เร่งด่วนมาก", token: "danger" };
    case "MEDIUM": return { label: "ปานกลาง", token: "warn" };
    case "NORMAL": return { label: "ปกติ", token: "info" };
  }
}
export function statusMeta(s: TicketStatus): { label: string; token: Token } {
  return s === "WORKING"
    ? { label: "กำลังทำ", token: "working" }
    : { label: "ทำเสร็จแล้ว", token: "success" };
}
```

- [ ] **Step 4: Run test → passes.** Run: `npm run test`. Expected: 2 new tests pass.

- [ ] **Step 5:** Implement `status-tag.tsx`, `urgency-tag.tsx` (Badge + token color via inline style `color: var(--<token>)` / translucent bg + Lucide icon + label text), and `online-dot.tsx` (green pulse dot when online, gray when offline, with `aria-label` + sr text).

- [ ] **Step 6:** Verify build + test. Run: `npm run build && npm run test`. Expected: pass.
- [ ] **Step 7: Commit** — `feat: StatusTag/UrgencyTag/OnlineDot + tag mappings (tested)`

---

## Task 7: ResponsiveTable + state components

**Files:** Create `components/responsive-table.tsx`, `components/states.tsx`

- [ ] **Step 1:** `responsive-table.tsx` — generic `<ResponsiveTable<T>>` with `columns: { key; header; render?(row): ReactNode; className? }[]`, `data: T[]`, `getRowKey(row): string`, `empty?: ReactNode`. Desktop (`hidden md:block`): shadcn `<Table>`. Mobile (`md:hidden`): one glass `<Card>` per row showing `header: value` pairs. Render `empty` when `data.length === 0`.

- [ ] **Step 2:** `states.tsx` — `EmptyState({icon,title,description,action?})` and `ErrorState({title,description,onRetry?})`, both centered, muted, icon + text.

- [ ] **Step 3:** Verify build. Run: `npm run build`. Expected: pass.
- [ ] **Step 4: Commit** — `feat: ResponsiveTable + Empty/Error states`

---

## Task 8: Dashboard demo + final gate

**Files:** Modify `app/(dashboard)/page.tsx`

- [ ] **Step 1:** Replace the dashboard stub with a small demo: 4 KPI glass cards (static numbers + Lucide icons) and a `ResponsiveTable` sample (2-3 mock ticket rows using UrgencyTag/StatusTag/OnlineDot) — proves tokens, glass, responsive table, and tags render in both themes.

- [ ] **Step 2: Full gate.** Run: `npm run lint && npm run test && npm run typecheck && npm run build`. Expected: all pass.

- [ ] **Step 3:** Dev smoke: start dev in background, `curl` → 200, kill (same pattern as Phase 0).

- [ ] **Step 4: Commit** — `feat: dashboard demo (KPI cards + responsive ticket table)`

---

## Definition of Done (Phase 1)

- Theme toggle switches dark↔light with no flash; dark is default; choice persists (localStorage).
- Neon-cyber + glass tokens applied; all status colors carry icon + text.
- AppShell: desktop left sidebar + mobile bottom nav (5) with correct active state; safe-area respected.
- shadcn primitives present and theme-aware.
- StatusTag/UrgencyTag/OnlineDot + ResponsiveTable + Empty/Error states implemented; `lib/tags.ts` unit-tested.
- Dashboard demo renders KPI cards + responsive table in both themes.
- `npm run lint && test && typecheck && build` all pass; clean commit history.

**Next:** Phase 2 — build the 7 pages with mock data via `lib/services/*`.
