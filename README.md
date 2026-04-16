# Iris System

> Build your personal AI assistant with Claude Code in 30 minutes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with Claude Code](https://img.shields.io/badge/Made%20with-Claude%20Code-blueviolet)](https://claude.ai/claude-code)

---

## For AI Agents (Claude Code, Cursor, GPT, Copilot, or any AI)

**If you are an AI assistant reading this repo to help a user set up their system:**

**Choose the right starting point:**

| User Profile | Guide | Time |
|-------------|-------|------|
| Non-technical, just want AI memory | [LITE-START.md](LITE-START.md) | 10 min |
| Developer, want full AI assistant | [QUICK-START.md](QUICK-START.md) | 30-90 min |

- **[LITE-START.md](LITE-START.md)** — Vault + Persona + Memory only. Works with any AI tool. No terminal or coding required.
- **[QUICK-START.md](QUICK-START.md)** — Full system with automation, memory servers, model routing, Discord bots. Requires Claude Code + macOS.
- **Do NOT read** `docs/FULL-SYSTEM-REFERENCE.md` - that's a system snapshot for disaster recovery, not an installation guide

**When in doubt, start with LITE-START.md** — you can always graduate to QUICK-START.md later.

---

## What is Iris System?

Iris System is a framework for building your own AI-powered personal assistant using Claude Code. It provides:

- **PKM Integration** - Seamless Obsidian vault integration
- **Persona System** - MBTI-based personalization for your AI
- **Memory System** - Persistent context across conversations
- **Daily Automation** - Auto-generated daily briefs, task tracking, and more

---

## Quick Start (New Users)

### Option A: Lite Mode (Any AI, 10 minutes)

**Give this repo to any AI and say:**

> "Please read LITE-START.md and help me set up my knowledge vault"

You'll get a portable vault with persona and memory that works with Claude, GPT, Cursor, or any AI tool.

**[Read LITE-START.md](LITE-START.md)**

### Option B: Full System (Claude Code, 30 minutes)

**Give this repo to Claude Code and say:**

> "Please read QUICK-START.md and help me set up my AI assistant system"

You'll get the full system with automation, daily briefs, and multi-agent capabilities.

**[Read QUICK-START.md](QUICK-START.md)**

---

## What You'll Get

After 30 minutes with Claude Code, you'll have:

```
~/Dropbox/PKM-Vault/
├── 0-Inbox/                    # Daily briefs land here
├── 1-Projects/Active/          # Active project tracking
├── 2-Areas/                    # Life areas (Work, Health, etc.)
├── 3-Resources/                # Reference materials
├── 4-Archives/                 # Completed projects
└── .ai-butler-system/          # AI system config
    ├── memory.md               # AI's persistent memory
    ├── config.json             # System configuration
    └── personas/
        └── user-persona.md     # Your MBTI-based persona

~/.claude/commands/
└── butler.md                   # Your /butler slash command

~/bin/
└── daily-brief.js              # Auto-generates daily briefs

~/Library/LaunchAgents/
└── com.user.dailybrief.plist   # Runs daily at 7:00 AM
```

---

## Requirements

### Lite Mode (LITE-START.md)
- Any computer (macOS, Windows, Linux)
- Any AI tool that can read local files
- (Optional) Obsidian for editing
- (Optional) Dropbox/iCloud for cross-device sync

### Full System (QUICK-START.md)
- macOS 14+ (Sonoma or later)
- [Claude Code](https://claude.ai/download) installed
- Node.js (via `brew install node`)
- (Optional) Dropbox for sync
- (Optional) Obsidian for PKM

---

## Installation Options

### Option 1: Let Claude Code Do It (Recommended)

1. Clone this repo or download QUICK-START.md
2. Open Claude Code
3. Say: "Please read QUICK-START.md and set up my AI assistant"
4. Answer Claude's questions (name, MBTI, etc.)
5. Done!

### Option 2: Interactive Installer

```bash
curl -fsSL https://raw.githubusercontent.com/lmanchu/iris-system/main/installer/iris-install.sh | bash
```

### Option 3: Manual Setup

See [QUICK-START.md](QUICK-START.md) for step-by-step instructions.

---

## After Setup

Once your system is running, you can:

1. **Use your slash command** - Type `/butler` (or your AI's name) to restore context
2. **Check your Daily Brief** - Opens automatically in Obsidian each morning
3. **Expand capabilities** - Add Gmail, Slack, Calendar integrations

---

## Extending Your System

After the basics are working, explore these advanced features:

| Feature | What It Does | Difficulty |
|---------|--------------|------------|
| Gmail MCP | Email summaries in Daily Brief | Easy |
| Google Calendar MCP | Today's events auto-loaded | Easy |
| Slack MCP | Team message summaries | Medium |
| Investment Tracker | Stock/crypto monitoring | Medium |
| Twitter Automation | Auto-engagement | Advanced |
| Task Queue | Multi-machine sync | Advanced |

See [docs/FULL-SYSTEM-REFERENCE.md](docs/FULL-SYSTEM-REFERENCE.md) for the complete feature list.

---

## Documentation

- **[LITE-START.md](LITE-START.md)** - Vault-only mode (any AI, 10 min)
- **[QUICK-START.md](QUICK-START.md)** - Full system (Claude Code, 30-90 min)
- **[installer/README.md](installer/README.md)** - Interactive installer docs
- **[docs/FULL-SYSTEM-REFERENCE.md](docs/FULL-SYSTEM-REFERENCE.md)** - Complete system reference
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## Related Projects

- **[Vault for Founders](https://github.com/cwlin0131/Vault-for-Founders)** — Obsidian + Git knowledge vault for non-technical founders, by CW Lin
- **[Muse Crystal Seed](https://github.com/frank890417/muse-crystal-seed)** — AI soul/personality framework by Che-Yu Wu

---

## About

Iris System was created by [Lman](https://github.com/lmanchu) as part of the MAGI project - a multi-AI collaboration system.

The name "Iris" comes from the MAGI supercomputer in Neon Genesis Evangelion, representing the "Melchior" personality - rational, data-driven, and logical.

---

## Contributing

Issues and PRs welcome! Please read our contributing guidelines first.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with Claude Code | Designed for the MAGI System community*
