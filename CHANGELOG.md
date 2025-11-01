# Changelog

All notable changes to the Iris System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
