# Architecture

> High-level system architecture for Telabotpower.

## Overview

Describe the system's purpose, major subsystems, and how they interact.

## Components

### API (`src/api/`)

The API layer. Exposes the application's surface to clients.

### Persistence (`src/persistence/`)

The data persistence layer. Handles storage, retrieval, and migrations.

## Data Flow

```
Client → API → Persistence → Storage
```

Describe the request/response lifecycle and where data crosses boundaries.

## Decisions

Architecture decisions are recorded as ADRs under [decisions/](decisions/).

## Runbooks

Operational procedures are documented under [runbooks/](runbooks/).
