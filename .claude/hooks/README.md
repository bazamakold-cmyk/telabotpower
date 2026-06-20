# Hooks

Guardrails & automation that the Claude Code harness runs around tool calls.

Hooks are configured in [../settings.json](../settings.json) under the `hooks` key,
and the scripts they invoke can live here.

## Common hook events

| Event              | When it fires                          | Typical use            |
| ------------------ | -------------------------------------- | ---------------------- |
| `PreToolUse`       | Before a tool runs                     | block/validate actions |
| `PostToolUse`      | After a tool runs                      | format, lint, test     |
| `UserPromptSubmit` | When the user submits a prompt         | inject context         |
| `Stop`             | When Claude finishes responding        | notify, summarize      |

## Example (in settings.json)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/format.sh" }
        ]
      }
    ]
  }
}
```
