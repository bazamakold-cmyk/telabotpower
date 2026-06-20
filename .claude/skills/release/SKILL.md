---
name: release
description: Use when cutting a release — bumping the version, updating the changelog, tagging, and publishing build artifacts.
---

# Release

Cut a clean, traceable release.

## When to use

- A set of changes on the main branch is ready to ship.

## Process

1. **Pre-flight** — main is green (CI passing), no unmerged release-blockers.
2. **Version** — bump the version per SemVer (major / minor / patch).
3. **Changelog** — summarize user-facing changes under the new version heading.
4. **Tag** — create an annotated git tag (`vX.Y.Z`) on the release commit.
5. **Publish** — build and publish artifacts; verify they install/run.
6. **Announce** — note the release where downstream consumers will see it.

## Checklist

- [ ] CI green on main
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Tagged `vX.Y.Z`
- [ ] Artifacts published & verified
