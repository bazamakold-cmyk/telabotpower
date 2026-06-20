---
name: refactor
description: Use when restructuring code without changing behavior — extracting functions, renaming, deduplicating, or improving structure while keeping tests green.
---

# Refactor

Improve internal structure without changing external behavior.

## When to use

- Code is hard to read, duplicated, or poorly structured.
- Behavior must stay identical (a green test suite is the safety net).

## Process

1. **Characterize** — ensure tests cover the behavior you're about to change.
   If coverage is missing, add it first.
2. **Small steps** — make one mechanical change at a time (extract, rename, inline,
   move). Run tests after each step.
3. **Preserve behavior** — no functional changes mixed into a refactor commit.
4. **Verify** — full test suite green before and after.

## Guardrails

- One concern per commit: refactor OR feature, never both.
- If a refactor reveals a bug, note it separately — don't silently fix.
