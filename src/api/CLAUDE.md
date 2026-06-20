# API Module — Memory

> Local context for the API layer. See the root [CLAUDE.md](../../CLAUDE.md) for project-wide instructions.

## Responsibility

The API layer exposes the application's surface to clients. It validates input,
orchestrates calls to lower layers, and shapes responses.

## Boundaries

- Talks to [`src/persistence/`](../persistence/) for data; never accesses storage directly.
- Keep transport concerns (routing, serialization) out of business logic.

## Conventions

- Validate at the edge; trust internal callers.
- Return typed, predictable errors.
- _(add API-specific conventions here)_
