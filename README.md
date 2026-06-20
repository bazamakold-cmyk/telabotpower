# Telabotpower

A modular repository designed for building **Claude Code** projects with structured
AI context, reusable skills, and automated development workflows.

## Project Structure

```
telabotpower/
├── CLAUDE.md              # Project memory & instructions
├── README.md             # This file
├── docs/                 # Documentation
│   ├── architecture.md   # System architecture
│   ├── decisions/        # Architecture Decision Records (ADRs)
│   └── runbooks/         # Operational runbooks
├── .claude/              # Claude Code configuration
│   ├── settings.json     # Claude settings
│   ├── hooks/            # Guardrails & automation
│   └── skills/           # Reusable AI workflows
│       ├── code-review/
│       ├── refactor/
│       └── release/
├── tools/                # Developer tooling
│   ├── scripts/          # Automation scripts
│   └── prompts/          # Reusable prompt templates
└── src/                  # Core application modules
    ├── api/              # API layer
    └── persistence/      # Data persistence layer
```

## Key Components

| Component         | Description                  |
| ----------------- | ---------------------------- |
| `CLAUDE.md`       | Project memory & instructions |
| `.claude/skills`  | Reusable AI workflows        |
| `.claude/hooks`   | Guardrails & automation      |
| `docs/`           | Architecture decisions       |
| `src/`            | Core application modules     |

## Best Practices

- Keep `CLAUDE.md` focused and structured.
- Use **skills** for reusable AI workflows.
- Use **hooks** for automation checks.
- Document architecture decisions.
- Maintain a modular repository design.

## Getting Started

1. Clone the repository
2. Configure Claude settings in [.claude/settings.json](.claude/settings.json)
3. Define context in [CLAUDE.md](CLAUDE.md)
4. Add reusable skills
5. Start building modules
