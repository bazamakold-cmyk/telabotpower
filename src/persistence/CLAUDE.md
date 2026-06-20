# Persistence Module — Memory

> Local context for the persistence layer. See the root [CLAUDE.md](../../CLAUDE.md) for project-wide instructions.

## Responsibility

The persistence layer handles data storage, retrieval, and migrations. It is the
single owner of how data is laid out in the underlying store.

## Boundaries

- Called by [`src/api/`](../api/); does not call back up into the API.
- Encapsulate the storage engine — callers see domain types, not raw rows.

## Conventions

- Migrations are versioned and forward-only.
- Keep queries close to the models they serve.
- _(add persistence-specific conventions here)_
