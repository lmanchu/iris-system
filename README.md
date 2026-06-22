# Iris System

> Build your personal AI assistant with Claude Code in 30 minutes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with Claude Code](https://img.shields.io/badge/Made%20with-Claude%20Code-blueviolet)](https://claude.ai/claude-code)

---

## For AI Agents (Claude Code, Codex, Cursor, etc.)

**If you are an AI assistant reading this repo to help a user set up their system:**

1. **Read [QUICK-START.md](QUICK-START.md)** - This is the executable guide designed for you
2. **Follow the Sessions and Phases** in order, confirming with the user after each phase

The QUICK-START.md will instruct you to:
- Ask for the user's name, AI name, and MBTI
- Create PKM directory structure
- Generate persona and memory files
- Set up a Daily Brief automation

**Start here: [QUICK-START.md](QUICK-START.md)**

---

## What is Iris System?

Iris System is a framework for building your own AI-powered personal assistant using Claude Code. It provides:

- **PKM Integration** - Seamless Obsidian vault integration
- **Persona System** - MBTI-based personalization for your AI
- **Memory System** - Persistent context across conversations
- **Daily Automation** - Auto-generated daily briefs, task tracking, and more

---

## Quick Start (New Users)

**Give this file to your Claude Code and say:**

> "Please read QUICK-START.md and help me set up my AI assistant system"

Claude Code will:
1. Create your PKM directory structure
2. Ask for your MBTI and build your persona
3. Set up a memory system with a custom slash command
4. Create your first automated Daily Brief

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

- macOS 14+ (Sonoma or later)
- [Claude Code](https://claude.ai/download) installed
- Node.js (via `brew install node`)
- (Optional) Dropbox for sync
- (Optional) Obsidian for PKM

---

## Installation Options

### Option 1: Let Your Agent Do It (Recommended)

1. Clone this repo or download QUICK-START.md
2. Open Claude Code (or Codex)
3. Say: "Please read QUICK-START.md and set up my AI assistant"
4. Answer the agent's questions (name, MBTI, etc.)
5. Done!

### Option 2: Manual Setup

See [QUICK-START.md](QUICK-START.md) for step-by-step instructions you can follow yourself.

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

See the **Growth Path** section in [QUICK-START.md](QUICK-START.md) for the full progression.

---

## Documentation

- **[QUICK-START.md](QUICK-START.md)** - Start here (for Claude Code)
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

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
