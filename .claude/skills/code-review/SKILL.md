---
name: code-review
description: Use when reviewing a diff, pull request, or set of changes — checks for correctness bugs, then reuse/simplification/efficiency cleanups.
---

# Code Review

Review changes for correctness first, quality second.

## When to use

- A diff or branch is ready for review.
- Before merging or opening a PR.

## Process

1. **Scope** — identify what changed (`git diff`, changed files, PR description).
2. **Correctness** — look for real bugs: logic errors, edge cases, error handling,
   concurrency, security. Verify each finding before reporting it.
3. **Quality** — reuse existing helpers, simplify, remove dead code, fix obvious
   inefficiencies. Keep changes at the right altitude.
4. **Report** — group findings by severity. Cite `file:line`. Be specific and
   actionable; avoid nitpicks unless asked.

## Output

- ✅ Confirmed bugs (with evidence)
- ⚠️ Risks / questions
- 🧹 Cleanup suggestions
