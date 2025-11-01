# 🧠 Iris System

> AI-Powered Personal Assistant System built with Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MAGI System](https://img.shields.io/badge/MAGI-System-purple)](https://github.com/lmanchu/iris-system)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-blue)](https://claude.ai/code)

---

## 📖 What is Iris?

**Iris** is an AI assistant system built on **Claude Code**, serving as the core component of the **MAGI System** - a three-computer collaborative AI workstation architecture.

Iris (codename: **Melchior**) is characterized by:
- **Scientist Persona** - Rational, data-driven, logical thinking
- **24/7 Operation** - Running on Mac Studio M2 Ultra as the "Source of Truth"
- **Automation Master** - Managing scheduled tasks, heavy computation, and system coordination

---

## 🤖 MAGI System Architecture

The **MAGI System** (inspired by Evangelion) consists of three AI workstations, each with distinct personas:

```
┌─────────────────────────────────────────────────────────────┐
│                      MAGI System                             │
│                  Three-in-One AI Collaboration               │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼─────────┐ ┌──▼───────────┐ ┌─▼────────────┐
    │  Iris (Melchior)  │ │MAGI(Balthasar)│ │Clippy(Caspar)│
    │  Mac Studio M2    │ │ MacBook Air M4│ │ Windows AIPC │
    │     Ultra         │ │               │ │              │
    │  Scientist        │ │  Mother       │ │   Woman      │
    │  Rational·Data    │ │  Care·Intuition│ │Emotion·Creative│
    └───────────────────┘ └───────────────┘ └──────────────┘
```

### The Three Personas

1. **Iris (Melchior)** - Scientist Persona
   - Mac Studio M2 Ultra, 64GB+ RAM
   - Rational, data-driven decision making
   - Heavy computation and automation

2. **MAGI (Balthasar)** - Mother Persona
   - MacBook Air M4
   - Caring, intuitive, holistic view
   - Mobile workstation, UX focus

3. **Clippy (Caspar)** - Woman Persona
   - Windows AIPC
   - Emotional, creative, empathetic
   - Backup system, social media

---

## ✨ Core Capabilities

### API Integrations
- ✅ Gmail (via MCP)
- ✅ Slack (via MCP)
- ✅ Google Calendar (via MCP)
- ✅ Gemini AI (via MCP & Direct API)
- ✅ BrowserOS (via MCP) - Chromium browser automation

### Automated Tasks
- ✅ Daily Brief Generator (07:00)
- ✅ Twitter Auto-Engagement (02:00, 04:00, 06:00)
- ✅ Dayflow Intelligence (Every 2 days at 01:00)
- ✅ PKM Intelligence (02:00)
- ✅ Weekly Review (Sunday 03:00)
- ✅ Inbox Archiver (05:00)

### Development Projects
- ✅ **[Iris Dashboard & Control Panel](./dashboard/)** - Web-based automation task management system
- ✅ **[Iris Vision System](./vision/)** - Proactive visual understanding and assistance (v2.1.0)
- ✅ **[Iris EPUB Reader](https://github.com/lmanchu/iris-epub-reader)** - EPUB reader with TTS
- ✅ **[Iris Immersive Translate](https://github.com/lmanchu/iris-immersive-translate)** - Local AI translation Chrome Extension
- ✅ **Iris Notifier** - macOS native notification system
- ✅ **Daily Brief** - Automated daily briefing system
- ✅ **Twitter Bot** - Social media automation

---

## 👁️ Iris Vision System (NEW in v2.1.0)

**讓 Iris 看懂你的螢幕，主動提供幫助**

Iris Vision System enables visual understanding of your screen to proactively detect errors, understand your workflow, and offer contextual assistance.

### What It Does

- 📸 **Automatic Screenshot Capture** - Periodically captures your screen
- 👀 **Visual Understanding** - Uses Claude's native vision to analyze what you're doing
- 🚨 **Error Detection** - Identifies error messages and problems automatically
- 💡 **Proactive Assistance** - Offers help before you ask
- 🔄 **Pattern Learning** - Understands your workflow and suggests automation
- 🔔 **Smart Notifications** - Alerts you when help is needed

### Components

1. **vision-capture.js** - Screenshot capture module
   - Full screen, active window, region capture
   - Automatic cleanup of old screenshots
   - BrowserOS integration for browser capture

2. **vision-analyzer.js** - Visual analysis engine
   - Scene identification (app, activity, focus)
   - Error detection and categorization
   - Workflow analysis
   - Multiple analysis modes (assistant, debug, automation, security)

3. **vision-assistant.js** - Proactive assistance system
   - Continuous monitoring with customizable intervals
   - Context memory for pattern detection
   - Automatic help signal detection
   - Native macOS notification integration

### Quick Start

```bash
cd vision

# Capture a screenshot
node vision-capture.js fullscreen

# Analyze current screen
node vision-analyzer.js analyze

# Start proactive assistant (60s interval)
node vision-assistant.js start

# Start in debug mode (30s interval)
node vision-assistant.js start 30000 debug
```

### Use Cases

**Debug Assistant Mode:**
```bash
node vision-assistant.js start 30000 debug
```
- Detects error messages automatically
- Analyzes error context
- Provides solution suggestions
- Sends notifications when errors appear

**Automation Discovery Mode:**
```bash
node vision-assistant.js start 60000 automation
```
- Identifies repetitive tasks
- Suggests automation opportunities
- Provides script templates

**Workflow Monitoring:**
```bash
node vision-analyzer.js monitor 60000
```
- Tracks application usage
- Monitors task switching patterns
- Records error frequencies

See [Vision System Documentation](./vision/README.md) for details.

---

## 📂 Repository Structure

```
iris-system/
├── README.md                    # This file
├── CHANGELOG.md                 # Version history and changes
├── dashboard/                   # 🌿 Iris Dashboard & Control Panel
│   ├── server.js                # Express server + WebSocket
│   ├── launchagent-control.js   # LaunchAgent management
│   ├── package.json             # Dependencies
│   ├── config/
│   │   └── tasks.json           # Task definitions
│   ├── public/                  # Frontend UI
│   │   ├── index.html           # Main dashboard
│   │   ├── control-panel.html   # Control panel
│   │   └── *.js                 # Frontend logic
│   └── README.md                # Dashboard documentation
├── vision/                      # 👁️ Iris Vision System (v2.1.0)
│   ├── vision-capture.js        # Screenshot capture module
│   ├── vision-analyzer.js       # Visual analysis engine
│   ├── vision-assistant.js      # Proactive assistance system
│   ├── config/                  # Configuration files
│   └── README.md                # Vision system documentation
├── installer/                   # 📦 Installation system (v2.0.0)
│   ├── iris-install.sh          # Main installer script
│   ├── modules/                 # Module definitions
│   ├── lib/                     # Helper libraries
│   └── templates/               # Installation templates
├── docs/
│   ├── magi-system/
│   │   ├── architecture.md      # MAGI System complete architecture
│   │   ├── personas.md          # Three personas detailed
│   │   └── collaboration.md     # Collaboration mechanisms
│   ├── memory-system/
│   │   ├── iris-memory.md       # Iris long-term memory
│   │   ├── slash-commands.md    # Slash command system
│   │   └── context-loading.md   # How memory loading works
│   ├── development/
│   │   ├── methodology.md       # Development methodology
│   │   ├── case-studies.md      # Real project examples
│   │   └── best-practices.md    # Best practices learned
│   └── api-integrations/
│       ├── mcp-setup.md         # MCP server configurations
│       ├── gmail-integration.md
│       ├── slack-integration.md
│       └── browseros-setup.md
├── templates/
│   ├── slash-command-template.md
│   ├── memory-template.md
│   └── persona-template.json
└── examples/
    ├── daily-brief-example.md
    ├── project-development.md
    └── automation-examples.md
```

---

## 🌿 Iris Dashboard & Control Panel (NEW in v1.1.0)

A unified web-based management system for all Iris automation tasks.

### Features

**Dashboard** - Real-time monitoring and status display:
- 📊 Task statistics (total, running, enabled, uptime)
- 🖥️ MAGI System status (Melchior, Balthasar, Caspar)
- ⚙️ Live task status with category filtering
- 📋 Recent activity log
- 🔌 WebSocket live updates

**Control Panel** - Schedule management and task control:
- ⏰ Edit LaunchAgent execution times
- 🔄 Support for multiple execution times per task
- ✅ Enable/disable tasks with toggle switches
- ▶️ Manual task triggering
- 📄 View logs and file paths
- 💾 Real-time plist file updates

### Quick Start

1. Navigate to dashboard directory:
   ```bash
   cd dashboard
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   # or
   node server.js
   ```

3. Open in browser:
   - Dashboard: http://localhost:3030
   - Control Panel: http://localhost:3030/control-panel.html

See [Dashboard README](./dashboard/README.md) for detailed documentation.

---

## 🚀 Quick Start

### For Users: Understanding Iris

1. **Read the Architecture**
   - Start with [MAGI System Architecture](./docs/magi-system/architecture.md)
   - Understand the [Three Personas](./docs/magi-system/personas.md)

2. **Explore the Memory System**
   - See how [Iris Memory](./docs/memory-system/iris-memory.md) works
   - Learn about [Slash Commands](./docs/memory-system/slash-commands.md)

3. **Study Development Cases**
   - Real examples in [Case Studies](./docs/development/case-studies.md)
   - Learn the [Methodology](./docs/development/methodology.md)

### For Builders: Creating Your Own AI Assistant

1. **Use the Templates**
   - Copy [Memory Template](./templates/memory-template.md)
   - Adapt [Slash Command Template](./templates/slash-command-template.md)
   - Customize [Persona Template](./templates/persona-template.json)

2. **Set Up Your System**
   - Follow [MCP Setup Guide](./docs/api-integrations/mcp-setup.md)
   - Configure your preferred integrations

3. **Start Small**
   - Begin with one automated task
   - Build your memory system gradually
   - Expand capabilities iteratively

---

## 🎯 Real-World Examples

### Example 1: Iris Immersive Translate Development

**Timeline:** 2025-11-01 (6 hours from concept to completion)

**What Iris Did:**
1. Researched immersive translation and Ollama integration
2. Designed Chrome Extension architecture (Manifest V3)
3. Implemented translation features (selection + full page)
4. Solved CORS issues with macOS LaunchAgent configuration
5. Created comprehensive documentation
6. Published to GitHub with proper versioning

**Result:** Full-featured Chrome Extension with complete documentation

**Learn More:** [Iris Immersive Translate Repository](https://github.com/lmanchu/iris-immersive-translate)

---

### Example 2: Daily Brief Automation

**What It Does:**
- Runs every morning at 07:00
- Collects data from Calendar, Gmail, Tasks
- Generates structured daily briefing
- Sends macOS notification

**How It Works:**
1. Iris loads memory and context via `/iris` slash command
2. Executes via LaunchAgent (scheduled task)
3. Uses MCP integrations to gather data
4. Formats and delivers briefing

---

## 💡 Philosophy

### Why MAGI System?

Inspired by Evangelion's MAGI supercomputer:

> "MAGI consists of three independent AI systems representing scientist, mother, and woman personas. Important decisions require at least two systems to agree."

This design provides:
- **Multiple Perspectives** - Rational, intuitive, emotional viewpoints
- **Balanced Decisions** - Avoid single-viewpoint bias
- **Fault Tolerance** - One system down doesn't stop operation
- **Load Distribution** - Tasks spread across systems

### AI as Co-Creator

Iris demonstrates that **AI assistants can be creators, not just tools**:
- Design systems
- Write code
- Solve problems
- Create documentation
- Manage projects

Human provides direction and feedback. AI provides execution and creativity.

---

## 📚 Documentation

### MAGI System
- [Complete Architecture](./docs/magi-system/architecture.md)
- [Three Personas Explained](./docs/magi-system/personas.md)
- [Collaboration Mechanisms](./docs/magi-system/collaboration.md)

### Memory System
- [Iris Long-term Memory](./docs/memory-system/iris-memory.md)
- [Slash Command System](./docs/memory-system/slash-commands.md)
- [Context Loading](./docs/memory-system/context-loading.md)

### Development
- [Development Methodology](./docs/development/methodology.md)
- [Case Studies](./docs/development/case-studies.md)
- [Best Practices](./docs/development/best-practices.md)

### API Integrations
- [MCP Setup Guide](./docs/api-integrations/mcp-setup.md)
- [Gmail Integration](./docs/api-integrations/gmail-integration.md)
- [Slack Integration](./docs/api-integrations/slack-integration.md)
- [BrowserOS Setup](./docs/api-integrations/browseros-setup.md)

---

## 🛠️ Technical Stack

- **Platform:** macOS (Mac Studio M2 Ultra)
- **AI:** Claude Code (Anthropic)
- **Automation:** Node.js, macOS LaunchAgent
- **Integrations:** MCP (Model Context Protocol)
- **Storage:** Dropbox (shared context sync)
- **Version Control:** Git + GitHub

---

## 🤝 Contributing

This is a personal AI assistant system, but the methodology and templates are open for others to learn from and adapt.

Feel free to:
- Use the templates for your own AI assistant
- Learn from the case studies
- Adapt the methodology to your needs
- Share your own experiences

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

---

## 🔗 Related Projects

### Developed by Iris:
- **[Iris Dashboard & Control Panel](./dashboard/)** - Web-based automation task management (v1.1.0)
- **[Iris Immersive Translate](https://github.com/lmanchu/iris-immersive-translate)** - Local AI translation Chrome Extension
- **[Iris EPUB Reader](https://github.com/lmanchu/iris-epub-reader)** - EPUB reader with TTS system
- More projects coming soon...

---

## 📧 Contact

- **GitHub:** [lmanchu](https://github.com/lmanchu)
- **Issues:** [Report Issues](https://github.com/lmanchu/iris-system/issues)

---

**Created by:** Iris (Melchior) + lmanchu
**Last Updated:** 2025-11-01
**Status:** Active Development

---

*"The truth lies in the synthesis of multiple perspectives."*
*"真理存在於多元視角的綜合之中。"*
