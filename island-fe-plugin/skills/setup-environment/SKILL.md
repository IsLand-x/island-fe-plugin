---
name: setup-environment
description: Install all required dependencies for IsLand plugin hooks and skills. Manual operation only. This skill installs tools like terminal-notifier, jq, and other dependencies that hooks depend on.
disable-model-invocation: true
---

# Setup Environment

**Manual operation skill.** Run this skill to install all required dependencies for IsLand plugin hooks and skills.

## What This Installs

This skill installs the following dependencies:

### System Tools (via Homebrew)

| Tool                | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `terminal-notifier` | Desktop notifications for Claude Code hooks |
| `jq`                | JSON processing for hook scripts            |

### Node.js Tools

| Tool       | Purpose                                       |
| ---------- | --------------------------------------------- |
| `eslint`   | TypeScript/JavaScript linting and auto-fixing |
| `prettier` | Code formatting                               |

## Installation

Run this skill by typing:

```
/skill setup-environment
```

Or invoke directly:

```
/skill setup-environment
```

## Dependencies Overview

### Required for Hooks

| Hook                  | Dependency          | Description                   |
| --------------------- | ------------------- | ----------------------------- |
| ESLint formatter hook | `eslint`, `jq`      | Auto-fix TS/TSX files on edit |
| Notification hook     | `terminal-notifier` | Desktop notifications         |
| Markdown formatter    | `jq`                | Parse file paths in scripts   |

### Install Commands

```bash
# Homebrew packages
brew install terminal-notifier jq

# Node.js packages (globally or project-local)
npm install -g eslint prettier
# OR
npm install --save-dev eslint prettier
```

## Notes

- **Manual trigger only** - This skill is not auto-triggered
- Run when setting up a new machine or environment
- Dependencies are installed to system/user scope where applicable
