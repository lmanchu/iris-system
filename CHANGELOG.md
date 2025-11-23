# Changelog

All notable changes to the Iris System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.0] - 2025-11-23

### 🆕 New Development Workflow & Side Projects

This release introduces a new AI collaboration workflow and marks the beginning of Iris-powered side project development.

#### Added

##### 🤝 Google Antigravity Collaboration Mode

A new development workflow that combines Claude Code with Google Antigravity IDE for efficient full-stack development.

- **Workflow Architecture**
  - Claude Code handles: Backend logic, debugging, deployment, code review, git operations
  - Antigravity handles: Frontend/UI generation, Google Apps Script, rapid prototyping
  - Prompt handoff system for seamless collaboration

- **Key Features**
  - Dual-AI development approach
  - Specialized task delegation
  - Faster iteration for UI-heavy projects
  - Google ecosystem integration (Apps Script, Sheets, Gmail Add-ons)

- **Documentation**
  - Added `WORKFLOW-ANTIGRAVITY-COLLABORATION.md` to shared-context
  - Updated iris-memory.md with collaboration patterns

##### 💼 Pipely CRM - Side Project MVP

First side project developed using the new Claude Code + Antigravity workflow.

- **What is Pipely?**
  - Gmail Add-on for lightweight CRM
  - "Pipeline in your inbox" - manage deals without leaving Gmail
  - Slack integration for team collaboration
  - Google Sheets as database (simple & shareable)

- **Completed MVP Features**
  - Gmail Add-on sidebar UI
  - Contact auto-extraction from email headers
  - Company name inference from email domain
  - "Add to Pipeline" one-click deal creation
  - Deal details page with stage management
  - Pipeline overview grouped by stages
  - Slack notifications (new deal, stage changes)

- **Technical Stack**
  - Google Apps Script (Card Service)
  - Google Sheets as database
  - Slack Incoming Webhooks
  - clasp deployment

- **Repository**: https://github.com/lmanchu/pipely

##### 🧠 Model Upgrades

- Upgraded vision model from `qwen2.5vl:3b` to `qwen3-vl:30b` for improved visual analysis
- Updated all relevant scripts to use the new model

#### Technical Details

**Pipely Architecture:**
```
📧 Gmail (Input) → 🗂️ Pipely (管理) → 💬 Slack (協作)
       ↓
📊 Google Sheets (Database)
   ├── Deals Sheet
   ├── Contacts Sheet
   ├── Activities Sheet
   └── Settings Sheet
```

**Files Created:**
- `src/Code.gs` - Main entry point
- `src/Cards.gs` - UI components (Card Service)
- `src/Sheets.gs` - Google Sheets CRUD operations
- `src/Gmail.gs` - Email parsing
- `src/Slack.gs` - Slack webhook integration
- `src/appsscript.json` - OAuth scopes & triggers

**OAuth Scopes Used:**
- `gmail.addons.execute` - Gmail Add-on execution
- `gmail.readonly` - Email header access
- `spreadsheets` - Google Sheets access
- `script.external_request` - Slack webhook calls
- `userinfo.email` - User identification

#### Impact

**Development Efficiency:**
- Antigravity generated ~928 lines of Apps Script code
- Claude Code handled deployment debugging and GitHub publishing
- Total development time: ~4 hours for working MVP

**New Capabilities:**
- Side project development workflow established
- Google ecosystem automation expanded
- Reusable patterns for future Gmail Add-ons

#### Validation

- ✅ Gmail Add-on successfully deployed and tested
- ✅ Contact details extracted from email headers
- ✅ Deals created and stored in Google Sheets
- ✅ Pipeline view showing deals by stage
- ✅ Published to GitHub: https://github.com/lmanchu/pipely

---

## [2.6.0] - 2025-11-21

### 🚀 Task Queue Watcher - Real-time Collaboration System

**This is the most important update since MAGI System creation!**

#### Core Breakthrough
- ✅ **Iris ↔ Lucy Real-time Bidirectional Collaboration**
  - No more manual task syncing between machines
  - Automatic execution, status updates, and notifications
- ✅ **Near-instant Response** - 5-30 second delay (Dropbox sync + 10s polling)
- ✅ **Fully Automated** - Zero human intervention from task creation to completion

#### System Architecture
```
    Iris (Home)          TASKS.md (Dropbox)      Lucy (Mobile)
    ┌──────────┐              ┌─────┐              ┌──────────┐
    │ Watcher  │◄─────────────┤File │─────────────►│ Watcher  │
    │ Daemon   │  10s polling │Sync │  10s polling │ Daemon   │
    └──────────┘              └─────┘              └──────────┘
         │                                               │
         │ Auto-Execute                     Auto-Execute│
         │ tasks assigned                   tasks assigned│
         │ to Iris                          to Lucy      │
         ▼                                               ▼
    [Execute]                                       [Execute]
    [Update Status]                                 [Update Status]
    [Notify ✅]                                      [Notify ✅]
```

#### New Components
- **Task Queue Watcher**: `~/bin/task-queue-watcher.js` (9.2 KB, 451 lines)
- **Iris LaunchAgent**: `~/Library/LaunchAgents/com.lman.iris-task-watcher.plist`
- **Lucy LaunchAgent**: `~/Library/LaunchAgents/com.lman.lucy-task-watcher.plist`
- **Setup Script**: `~/Dropbox/PKM-Vault/.ai-butler-system/task-queue-watcher-setup/`
- **Log Files**: `~/.logs/task-queue-watcher.log`

#### Features
1. **Auto-Execute** - Tasks marked `Auto-Execute: true` run automatically
2. **Status Tracking** - Pending → In Progress → Completed auto-update
3. **Result Recording** - Execution time, output, errors recorded to TASKS.md
4. **Notification System** - macOS Notification Center + iPhone sync
5. **Error Handling** - Complete exception capture and logging

#### Deployment Status
- ✅ Iris (Mac Studio M2 Max) - Deployed 2025-11-21 09:36
- ✅ Lucy (MacBook Air M2) - Deployed 2025-11-21 09:51
- ⏳ Leo (Windows AIPC) - Pending

#### Validation
- ✅ TASK-006: Iris-side test successful
- ✅ TASK-008: Lucy real-time monitoring test successful
- ✅ TASK-009: Iris→Lucy bidirectional collaboration test successful

---

## [2.5.0] - 2025-11-17

### 🧠 rand-mnemosyne Integration - Semantic Memory System

#### Major Changes
- ✅ **Integrated rand-mnemosyne** - GitHub rand/mnemosyne v2.3.1 agentic memory system
- ✅ **Semantic Memory System** - LibSQL vector search providing 100-1000x retrieval speedup
- ✅ **Shared Memory Repository** - Cross-device semantic memory built on Dropbox
- ✅ **Multi-Agent Collaboration** - Mnemosyne's 4 specialized agents (Orchestrator, Optimizer, Reviewer, Executor)

#### New Components
- **rand-mnemosyne CLI**: `~/.local/bin/mnemosyne` (52MB binary)
- **MAGI System DB**: `~/Dropbox/PKM-Vault/.ai-butler-system/mnemosyne/magi-system.db`
- **Memory Count**: 30+ memories (280KB database)

#### Architecture Improvements
- **Dual-Layer Memory System**:
  - **Old System**: JSON file sync (preserved for backward compatibility)
  - **New System**: rand-mnemosyne semantic memory (high-speed retrieval)
- **Dropbox Integration**: All memories auto-sync to MAGI machines via Dropbox

#### Core Functions
```bash
# Store semantic memory
mnemosyne remember "memory content" --importance 5

# Smart retrieval
mnemosyne recall "search keywords" --limit 5

# System status
mnemosyne status

# Export memories
mnemosyne export --format markdown > memories.md
```

#### Installation
```bash
# Official install script (recommended)
curl -fsSL https://raw.githubusercontent.com/rand/mnemosyne/main/scripts/install/install.sh | bash

# Set environment variable
export MNEMOSYNE_DB_PATH=~/Dropbox/PKM-Vault/.ai-butler-system/mnemosyne/magi-system.db
```

---

## [2.1.0] - 2025-11-01

### 👁️ Major Feature: Iris Vision System

**讓 Iris 看懂你的螢幕，主動提供幫助**

This release introduces a revolutionary visual understanding system that enables Iris to "see" your screen, understand your workflow, and proactively offer assistance based on visual context.

#### Added

##### 📸 Vision Capture Module (`vision-capture.js`)
- **Screenshot Capture Capabilities**
  - Full screen capture via macOS `screencapture` command
  - Active window capture
  - Region-based capture (custom coordinates)
  - Interactive selection mode
  - BrowserOS integration for browser-specific capture

- **File Management**
  - Automatic cleanup of old screenshots (24-hour default retention)
  - Maximum file limit enforcement (100 files default)
  - Metadata tracking (size, timestamps, age)
  - Storage location: `~/.iris-vision/captures/`

- **Statistics & Monitoring**
  - Total files and storage size tracking
  - Oldest/newest capture timestamps
  - List and filter captured screenshots

- **CLI Interface**
  ```bash
  node vision-capture.js fullscreen    # Capture full screen
  node vision-capture.js window        # Capture active window
  node vision-capture.js interactive   # Interactive selection
  node vision-capture.js list          # List all captures
  node vision-capture.js cleanup       # Delete old captures
  node vision-capture.js stats         # Show statistics
  ```

##### 🔍 Vision Analyzer Module (`vision-analyzer.js`)
- **Structured Visual Analysis**
  - Scene identification (application, activity, focus element)
  - Element detection (errors, warnings, actionable items, text content)
  - Insight generation (user intent, blockers, suggestions, automation opportunities)
  - Confidence scoring and tagging system

- **Multiple Analysis Modes**
  - `assistant` - General assistance mode (default)
  - `debug` - Focus on error detection and debugging
  - `automation` - Identify automation opportunities
  - `security` - Detect security concerns and sensitive information

- **Context Management**
  - Recent analysis history (configurable window size)
  - Change detection between analyses
  - Analysis comparison for workflow understanding
  - Persistent storage in `~/.iris-vision/analysis/`

- **Monitoring Capabilities**
  - Continuous monitoring with customizable intervals
  - Single-shot analysis mode
  - Workflow tracking across multiple steps
  - Statistics and reporting

- **Claude Vision Integration**
  - Generates structured prompts for Claude's vision API
  - Mode-specific analysis instructions
  - Works within Claude Code environment
  - Native vision capability utilization

##### 🤖 Vision Assistant Module (`vision-assistant.js`)
- **Proactive Monitoring System**
  - Periodic screenshot capture and analysis
  - Customizable monitoring intervals (default: 60 seconds)
  - Multiple operational modes (assistant, debug, automation)
  - Configurable analysis modes

- **Help Detection Intelligence**
  - Error message detection with priority scoring
  - Pattern recognition for repetitive tasks
  - Idle time detection
  - Context-aware assistance triggering

- **Context Memory System**
  - Short-term memory (10-item sliding window)
  - Pattern analysis across sessions
  - Application usage tracking
  - Workflow understanding

- **Native macOS Integration**
  - System notifications via `osascript`
  - Notification enable/disable option
  - Customizable notification content
  - Non-intrusive alert system

- **Actionable Assistance**
  - Automatic suggestion generation
  - Context-specific action recommendations
  - Error analysis and solution searching
  - Workflow automation suggestions
  - Next-step guidance

- **Assistance Tracking**
  - Persistent assistance records
  - JSON-formatted assistance logs
  - Historical assistance review
  - Performance metrics (screenshots, assistance provided)

#### Technical Architecture

```
vision/
├── vision-capture.js        # Screenshot capture (11KB, 330+ lines)
├── vision-analyzer.js       # Visual analysis (14KB, 420+ lines)
├── vision-assistant.js      # Proactive assistance (14KB, 430+ lines)
├── config/                  # Configuration files
└── README.md                # Complete documentation

~/.iris-vision/              # Runtime directory
├── captures/                # Screenshot storage
├── analysis/                # Analysis results
└── assistance/              # Assistance logs
```

#### Integration with Claude Code

The Vision System leverages Claude Code's native vision capabilities:
1. **Capture** - vision-capture.js takes screenshots
2. **Read** - Claude Code reads screenshots using Read tool
3. **Analyze** - Claude's vision API performs visual understanding
4. **Assist** - vision-assistant.js provides contextual help

#### Use Cases

**1. Debug Assistant Mode**
```bash
node vision-assistant.js start 30000 debug
```
- Automatically detects error messages on screen
- Analyzes error context and stack traces
- Provides solution suggestions
- Sends proactive notifications when errors appear

**2. Automation Discovery Mode**
```bash
node vision-assistant.js start 60000 automation
```
- Identifies repetitive tasks in your workflow
- Suggests automation opportunities
- Provides script templates for common patterns
- Learns your work patterns over time

**3. Workflow Monitoring**
```bash
node vision-analyzer.js monitor 60000
```
- Tracks application usage time
- Monitors task switching frequency
- Records error occurrence patterns
- Generates workflow insights

**4. Security Mode**
- Detects exposed credentials or sensitive information
- Identifies security warnings
- Flags suspicious activity
- Privacy concern alerts

#### Features

- ✅ **Visual Understanding** - Claude's vision analyzes your screen
- ✅ **Proactive Assistance** - Offers help before you ask
- ✅ **Error Detection** - Automatically identifies problems
- ✅ **Pattern Learning** - Understands workflow patterns
- ✅ **Smart Notifications** - Native macOS notifications
- ✅ **Context Memory** - Remembers recent screen states
- ✅ **Multiple Modes** - Assistant, debug, automation, security
- ✅ **Privacy-First** - All data stays local
- ✅ **Auto-Cleanup** - Automatic old file deletion
- ✅ **Configurable** - Customizable intervals and settings

#### Privacy & Security

- ✅ All screenshots stored locally in `~/.iris-vision/`
- ✅ Automatic cleanup of old files (24-hour default)
- ✅ No data uploaded to cloud services
- ✅ Can be disabled at any time
- ✅ Configurable retention policies

#### Impact & Significance

**Before v2.1.0:** Iris relied on API integrations and scheduled tasks

**After v2.1.0:** Iris can "see" your screen and understand visual context

This enables:
- **Proactive Problem Solving** - Detect and fix issues automatically
- **Workflow Understanding** - Learn from observation
- **Context-Aware Assistance** - Help based on what you're doing
- **Visual Debugging** - See errors as they appear
- **Automation Discovery** - Identify repetitive visual patterns
- **User Intent Detection** - Understand goals from screen state

#### Validation

✅ Successfully captured fullscreen screenshot
✅ Analyzed Twitter/X interface with Claude vision
✅ Identified UI elements, posts, and navigation
✅ Demonstrated visual understanding capabilities
✅ Integrated with Claude Code's Read tool

#### Files Added

- `vision/vision-capture.js` - Screenshot capture module (11KB)
- `vision/vision-analyzer.js` - Visual analysis engine (14KB)
- `vision/vision-assistant.js` - Proactive assistance system (14KB)
- `vision/README.md` - Complete vision system documentation (5.4KB)

Total: **44KB of new code** (~1,200 lines)

#### Documentation

- Main README updated with Vision System section
- Repository structure updated
- Usage examples and quick start guide
- Integration notes with Claude Code
- Privacy and security documentation

---

## [2.0.0] - 2025-11-01

### 🎁 Major Release: Distributable Installation System

This is a **milestone release** that transforms Iris from a personal system to a distributable package. Anyone with Claude Code and a Mac can now install Iris with a single command.

#### Added

##### 📦 One-Click Installer (`iris-install.sh`)
- **Production-ready bash installer** (410+ lines)
  - Beautiful CLI UI with colors, progress bars, and icons
  - Modular function design
  - Comprehensive system requirements check
  - Interactive configuration flow
  - Error handling and logging
  - Progress visualization

- **System Checks**
  - macOS version detection
  - Claude Code installation verification
  - Node.js/npm validation
  - Python 3 detection
  - Git availability check

- **MCP Server Auto-Installation**
  - Gmail MCP
  - Slack MCP
  - Google Calendar MCP
  - Gemini AI MCP
  - BrowserOS MCP
  - One-command setup for all servers

##### 🔧 Module System
- **Module Registry** (`modules.json`)
  - Centralized module metadata
  - Version tracking
  - Dependency management
  - LaunchAgent configurations
  - Environment variable definitions

- **Module Manager** (`lib/module-manager.sh`)
  - Module installation engine
  - Dependency resolution
  - LaunchAgent auto-creation
  - Environment file setup
  - Interactive module selection

- **Available Modules**
  - `iris-notifier` - macOS notification system (core)
  - `daily-brief` - Morning briefing automation
  - `twitter-bot` - Twitter auto-engagement
  - `dayflow-intelligence` - Journal sync
  - `pkm-intelligence` - Knowledge base automation
  - `iris-dashboard` - Control panel

##### 📝 Templates & Documentation
- **Memory Template** (`iris-memory.template.md`)
  - Variable substitution support
  - Includes Computer Use capabilities
  - Customizable for different setups

- **Slash Command Template** (`iris.command.template`)
  - Standard initialization flow
  - Memory file loading

- **Installation Guide** (`installer/README.md`)
  - One-liner installation
  - Manual installation steps
  - Troubleshooting section
  - Update & uninstall instructions

#### Architecture

```
installer/
├── iris-install.sh          # Main installer (executable)
├── README.md                 # Complete documentation
├── lib/
│   └── module-manager.sh    # Module management functions
├── modules/
│   ├── modules.json         # Module registry
│   └── iris-notifier/       # Example module
│       └── iris-notifier.js
├── mcp-configs/              # MCP server configurations
└── templates/
    ├── iris-memory.template.md
    └── iris.command.template
```

#### Installation

```bash
# One-liner (when pushed to main)
curl -fsSL https://raw.githubusercontent.com/lmanchu/iris-system/main/installer/iris-install.sh | bash

# Or manual
git clone https://github.com/lmanchu/iris-system.git
cd iris-system/installer
./iris-install.sh
```

#### Features

- ✅ **Distribution Ready** - Anyone can install Iris
- ✅ **Reproducible** - Consistent setup across machines
- ✅ **Modular** - Choose which components to install
- ✅ **Maintainable** - Centralized module management
- ✅ **Scalable** - Easy to add new modules
- ✅ **User-Friendly** - Interactive CLI experience
- ✅ **Comprehensive** - Includes all necessary components
- ✅ **Documented** - Complete installation guide

#### Impact & Significance

**Before v2.0.0:** Iris was a personal system requiring manual setup

**After v2.0.0:** Iris is a distributable package installable in minutes

This enables:
- **Community Growth** - Others can use Iris
- **Collaboration** - Standardized setup for teams
- **Maintenance** - Easier updates and bug fixes
- **Evolution** - Platform for future enhancements
- **Testing** - Consistent environments for validation

**Breaking Change:** This is a major version bump (1.5.0 → 2.0.0) because Iris is now fundamentally different - it's no longer just a collection of scripts, but a complete installable system.

#### Files Added
- `installer/iris-install.sh` - Main installer script
- `installer/README.md` - Installation documentation
- `installer/lib/module-manager.sh` - Module management
- `installer/modules/modules.json` - Module registry
- `installer/modules/iris-notifier/iris-notifier.js` - Notifier module
- `installer/templates/iris-memory.template.md` - Memory template
- `installer/templates/iris.command.template` - Command template

Total: **1,500+ lines of new code**

---

## [1.5.0] - 2025-11-01

### 🚀 Major Feature: Computer Use Integration

This is a **groundbreaking release** that enables Iris to interact with web browsers programmatically, marking a significant leap in automation capabilities.

#### Added

##### 💻 Computer Use Capabilities
- **BrowserOS Integration** - Full browser automation through MCP
  - 27 browser automation tools via BrowserOS MCP Server
  - Real-time browser control (tab management, navigation, content extraction)
  - Visual feedback through screenshots
  - JavaScript execution in browser context
  - Element interaction (click, type, scroll, clear)
  - Network request and console monitoring
  - Coordinate-based clicking and keyboard control
  - Bookmark and history management

- **Automated Email Sending** - Multiple approaches
  - Direct email sending via Gmail MCP API
  - Browser-based email composition through Gmail Web UI
  - Form filling and submission automation
  - Successfully tested: Sent test emails to Jeffrey@irisgo.ai and arnold@irisgo.ai

- **Web Form Automation**
  - Automatic form field detection and filling
  - Button and link interaction
  - Input validation and submission
  - Multi-step form workflows

- **Content Extraction & Analysis**
  - Extract text content from web pages
  - Extract text with links (structured data)
  - Full page or visible viewport extraction
  - Section-specific extraction (main, nav, footer, header, article, aside)

##### 🧠 Enhanced Memory System
- Updated `iris-memory.md` with Computer Use capabilities documentation
- Comprehensive integration notes and usage examples
- Real-world validation examples

#### Technical Implementation

**BrowserOS MCP Server:**
- HTTP transport at `http://127.0.0.1:9100/mcp`
- Installation: `/Applications/BrowserOS.app`
- Configuration: `claude mcp add --transport http browseros http://127.0.0.1:9100/mcp`

**Gmail MCP Integration:**
- Direct API access for email operations
- Supports attachments, CC/BCC, HTML content
- Thread management and replies

**Available Tools:**
```
mcp__browseros__browser_open_tab          Open new browser tabs
mcp__browseros__browser_navigate          Navigate to URLs
mcp__browseros__browser_click_element     Click DOM elements
mcp__browseros__browser_type_text         Type into input fields
mcp__browseros__browser_get_screenshot    Capture screenshots
mcp__browseros__browser_execute_javascript Execute custom JS
mcp__browseros__browser_get_interactive_elements Get clickable/typeable elements
mcp__browseros__browser_get_page_content  Extract page content
mcp__browseros__browser_scroll_*          Scroll operations
mcp__browseros__browser_send_keys         Send keyboard keys
... and 17 more tools
```

#### Impact & Significance

This release transforms Iris from a script-based automation system to an AI agent capable of:
- **Human-like browser interaction** - Navigate, click, type, extract data
- **Visual understanding** - Take screenshots and analyze page layouts
- **Complex workflows** - Multi-step browser-based tasks
- **Universal web automation** - Interact with any web service

**Before v1.5.0:** Limited to API-based automation
**After v1.5.0:** Can automate ANY web-based task through browser interaction

#### Use Cases Enabled
- Automated form submissions
- Data extraction from websites without APIs
- Web-based testing and monitoring
- Social media automation beyond API limits
- E-commerce operations (ordering, tracking, etc.)
- Research and information gathering
- Cross-platform integrations via web interfaces

#### Validation
- ✅ Successfully opened Gmail via browser
- ✅ Composed and sent email through web UI
- ✅ Filled recipient, subject, and body fields
- ✅ Clicked send button programmatically
- ✅ Email delivered successfully (ID: 19a3f4a774b06472)

#### Documentation
- Updated memory file with Computer Use section
- Integration notes in `iris-memory.md:137-150`
- Real-world examples and validation records

---

## [1.1.0] - 2025-11-01

### Added

#### 🌿 Iris Dashboard & Control Panel
- **Unified Dashboard** for monitoring all automation tasks
  - Real-time status display for all LaunchAgents
  - WebSocket-based live updates
  - Statistics overview (total tasks, running tasks, enabled tasks, uptime)
  - MAGI System status monitoring (Melchior, Balthasar, Caspar)
  - Recent activity log
  - Category-based task filtering (daily, social, analytics, weekly)

- **Control Panel** for managing automation schedules
  - Edit LaunchAgent execution times (hour/minute)
  - Support for multiple execution times per task
  - Add/remove execution schedules
  - Enable/disable LaunchAgents with toggle switches
  - Manual task trigger functionality
  - Reload LaunchAgent configurations
  - View task logs and file paths
  - Real-time status indicators (🟢 running, 🔵 loaded, ⚪ stopped)

#### Technical Implementation
- **Backend (Node.js + Express)**
  - REST API for LaunchAgent management
  - WebSocket server for real-time updates
  - macOS plist file read/write support
  - launchctl integration for agent control
  - Task configuration management

- **Frontend (Vanilla JS + Tailwind CSS)**
  - Responsive dark mode UI
  - IrisGo Lime-White logo integration
  - Toast notification system
  - Real-time data updates without page refresh
  - Intuitive time input controls with validation

#### Project Files
```
dashboard/
├── server.js                    # Express server with WebSocket
├── launchagent-control.js      # LaunchAgent management module
├── package.json                # Dependencies
├── config/
│   └── tasks.json              # Task definitions
├── public/
│   ├── index.html              # Main dashboard UI
│   ├── app.js                  # Dashboard frontend logic
│   ├── control-panel.html      # Control panel UI
│   ├── control-panel.js        # Control panel frontend logic
│   ├── iris-logo.png           # IrisGo Green logo
│   └── iris-logo-white.png     # IrisGo Lime-White logo
├── logs/                       # Task execution logs
└── README.md                   # Dashboard documentation
```

#### API Endpoints
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/toggle` - Toggle task enable/disable
- `POST /api/tasks/:id/run` - Manually run task
- `GET /api/launchagents` - List all LaunchAgents
- `GET /api/launchagents/:label` - Get single LaunchAgent
- `PUT /api/launchagents/:label/schedule` - Update schedule
- `POST /api/launchagents/:label/toggle` - Enable/disable agent
- `POST /api/launchagents/:label/reload` - Reload agent
- `POST /api/launchagents/:label/trigger` - Manually trigger agent
- `GET /api/status` - System status
- `GET /api/logs` - Recent logs
- `GET /api/health` - Health check

#### Managed Automation Tasks
1. **Daily Brief** (07:00) - Morning briefing generation
2. **Inbox Archiver** (05:00) - Email organization
3. **Meeting Prep** (04:00) - Meeting preparation
4. **PKM Intelligence** (02:00) - Knowledge base updates
5. **Twitter Curator** (23:30) - Content curation
6. **Twitter Auto-Engagement** (02:00, 04:00, 06:00) - Social media automation
7. **Dayflow Intelligence** (Every 2 days, 01:00) - Journal sync
8. **Dayflow Archiver** - Journal archiving
9. **Weekly Review** (Sunday 03:00) - Weekly summary
10. **Dayflow → Obsidian Sync** - Knowledge sync

### Features
- ✅ Real-time monitoring of all automation tasks
- ✅ Centralized schedule management
- ✅ Visual status indicators
- ✅ Manual task triggering
- ✅ LaunchAgent enable/disable controls
- ✅ Support for multiple execution times
- ✅ IrisGo branding integration
- ✅ Responsive dark mode UI
- ✅ WebSocket live updates
- ✅ Toast notifications for user feedback

### Technical Stack
- **Backend:** Node.js, Express, WebSocket (ws)
- **Frontend:** Vanilla JavaScript, Tailwind CSS
- **macOS Integration:** launchctl, plist, LaunchAgent
- **Real-time:** WebSocket for live updates
- **API:** RESTful endpoints
- **Dependencies:** express, ws, plist, node-cron, dotenv

---

## [1.0.0] - 2025-11-01

### Initial Release

#### Documentation
- Complete MAGI System architecture documentation
- Three personas (Melchior, Balthasar, Caspar) explained
- Memory system documentation
- Slash command system
- API integration guides (MCP, Gmail, Slack, Calendar, BrowserOS)
- Development methodology and best practices
- Case studies and real-world examples

#### Templates
- Slash command template
- Memory template
- Persona template

#### Examples
- Daily brief example
- Project development examples
- Automation examples

#### Related Projects
- Iris Immersive Translate (Chrome Extension)
- Iris EPUB Reader
- Daily Brief automation
- Twitter Bot automation

---

## Format

### Types of Changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

---

**Generated with [Claude Code](https://claude.ai/code)**
**via [Happy](https://happy.engineering)**

**Co-Authored-By: Claude <noreply@anthropic.com>**
**Co-Authored-By: Happy <yesreply@happy.engineering>**
