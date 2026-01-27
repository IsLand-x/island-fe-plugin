# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code personal plugin** (skill-playground) for "IsLand" (island-fe). It extends Claude Code with custom skills, agents, and hooks.

## Project Structure

```
.
├── .claude-plugin/plugin.json    # Plugin manifest (name, version, author)
├── .claude/settings.local.json   # Claude permissions configuration
├── skills/                       # Domain-specific coding skills
│   └── mobx-react-coder/
│       └── SKILL.md              # Skill definition and instructions
├── agents/                       # AI agent rule definitions
│   └── code-reviewer.md          # Agent system prompt
├── hooks/                        # Event hooks
│   └── hooks.json                # Hook definitions
└── CHANGELOG.md                  # Version history
```

## Key Files

### Plugin Manifest (`.claude-plugin/plugin.json`)
Defines plugin metadata:
- `name`: Plugin identifier (island-fe)
- `version`: Semantic version
- `author`: Name and email

### Permissions (`.claude/settings.local.json`)
Configures allowed operations:
- WebFetch: Domain-specific fetching (e.g., mobx.js.org)
- Bash: Approved shell commands

## Adding New Components

### New Skill
1. Create `skills/<skill-name>/SKILL.md`
2. Write skill instructions in markdown
3. Reference the skill in conversations with `/skill <skill-name>`

### New Agent
1. Create `agents/<agent-name>.md`
2. Write system prompt defining the agent's behavior
3. Invoke with Task tool using `subagent_type: "general-purpose"` and reference the agent file

### New Hook
1. Edit `hooks/hooks.json`
2. Define event triggers and actions

## Commands

This project has no build system. It's a configuration-only plugin:
- `npm test` - Placeholder (no tests configured)

Changes take effect immediately in Claude Code when files are saved.
