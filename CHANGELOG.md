# Changelog

All notable changes to the Iris System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
