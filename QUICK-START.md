# AI Butler Quick Start Guide

**Version**: v2.0.0
**Updated**: 2026-02-16
**Purpose**: Let Claude Code build your complete AI assistant system by reading this guide

---

## For Claude Code

> **Claude Code**: Execute the following Phases in order. After completing each Phase, confirm with the user before proceeding. Ask questions if anything is unclear.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  YOU (User)                                     │
│  ├── Claude Code (primary interface)            │
│  ├── Slack (team collaboration)                 │
│  ├── WhatsApp / Telegram (mobile access)        │
│  └── Obsidian (knowledge base)                  │
├─────────────────────────────────────────────────┤
│  AGENT LAYER                                    │
│  ├── Core: Butler (orchestrator)                │
│  ├── Specialists: PM, Finance, Investment, etc. │
│  └── Automation: Social, Brief, Sync            │
├─────────────────────────────────────────────────┤
│  MEMORY LAYER                                   │
│  ├── L1: Static files (@file in skills/memory)  │
│  ├── L2: Local RAG (QMD — BM25 + vector)       │
│  └── L3: Semantic memory (RLabs + Episodic)     │
├─────────────────────────────────────────────────┤
│  MODEL LAYER                                    │
│  ├── Claude Code (primary reasoning)            │
│  ├── CLIProxyAPI (model router — local proxy)   │
│  └── Ollama (local models for embedding/tasks)  │
├─────────────────────────────────────────────────┤
│  RUNTIME LAYER                                  │
│  ├── LaunchAgents (Bun-based bots, schedulers)  │
│  ├── PM2 (Python/Node long-running services)    │
│  └── Cron-style scheduled tasks                 │
└─────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (10 minutes)

### 1.1 Create Directory Structure

```bash
VAULT_PATH="$HOME/Dropbox/PKM-Vault"  # User can customize

# PKM directories (Obsidian vault)
mkdir -p "$VAULT_PATH"/{0-Inbox,1-Projects/Active,2-Areas,3-Resources,4-Archives}

# AI Butler system (hidden from Obsidian sidebar)
mkdir -p "$VAULT_PATH/.ai-butler-system"/{personas,shared-context,docs,credentials,memory,reports}

# Runtime directories
mkdir -p "$HOME/bin"
mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$HOME/.logs"

# Tachikoma multi-agent system (optional, for Slack bots)
mkdir -p "$HOME/tachikoma/shared"
```

### 1.2 Ask User for Basic Info

**Claude Code should ask:**
1. What name for your AI assistant? (Default: Butler)
2. Your name?
3. Timezone? (Default: Asia/Taipei)
4. Obsidian Vault path? (Default: ~/Dropbox/PKM-Vault)
5. Will you use Slack bots? (Y/N)

### 1.3 Create System Config

Create `$VAULT_PATH/.ai-butler-system/config.json`:

```json
{
  "version": "2.0.0",
  "created": "{{CURRENT_DATE}}",
  "vault_path": "{{VAULT_PATH}}",
  "ai_name": "{{AI_NAME}}",
  "user_name": "{{USER_NAME}}",
  "timezone": "{{TIMEZONE}}",
  "features": {
    "daily_brief": true,
    "persona_system": true,
    "memory_system": true,
    "slack_bots": false,
    "social_automation": false,
    "financial_tracking": false
  }
}
```

---

## Phase 2: Identity & Memory (15 minutes)

### 2.1 Collect User Profile

**Claude Code should ask:**

> To personalize your AI assistant, I need some information:
>
> 1. **MBTI type?** (e.g., INTJ, ENFP — or take the test at [16personalities.com](https://www.16personalities.com/))
> 2. **Professional background?** (industry, role, years of experience)
>    - Optional: share LinkedIn PDF (Profile → More → Save to PDF)
> 3. **Communication preferences?** (Direct/Friendly/Formal, language preference)

### 2.2 Generate Persona File

Create `$VAULT_PATH/.ai-butler-system/personas/user-persona.md`:

```markdown
# {{USER_NAME}} Persona Profile

**Version**: 2.0.0
**Created**: {{CURRENT_DATE}}

---

## Core Identity

### MBTI: {{MBTI_TYPE}}
- **Cognitive Functions**: {{COGNITIVE_FUNCTIONS}}
- **Core Traits**: {{CORE_TRAITS}}

### Professional Background
- **Industry**: {{INDUSTRY}}
- **Role**: {{ROLE}}
- **Experience**: {{EXPERIENCE_YEARS}} years
- **Key Skills**: {{SKILLS}}

---

## Communication Preferences

- **Language**: {{PREFERRED_LANGUAGE}}
- **Tone**: {{TONE}}
- **Rules**:
  1. Direct answers, skip pleasantries
  2. Challenge assumptions, point out blind spots
  3. For ideas: question and improve
  4. For execution: give concrete steps
  5. No emojis unless requested

---

## Current Focus
- {{CURRENT_FOCUS}}
```

### 2.3 Create Memory File

Create `$VAULT_PATH/.ai-butler-system/memory.md`:

```markdown
# {{AI_NAME}} Memory

> Long-term memory — loaded at start of each conversation.

**Last Updated**: {{CURRENT_DATE}}

---

## Identity
- **Name**: {{AI_NAME}}
- **User**: {{USER_NAME}}
- **Environment**: {{MACHINE_INFO}}

## Active Projects
(Add projects as they come up)

## Key Decisions
(Record important decisions with dates)

## Learned Preferences
(Record patterns you notice about the user)
```

### 2.4 Create Slash Command (Skill)

Create `~/.claude/commands/{{AI_NAME_LOWERCASE}}.md`:

```markdown
Hello! I'm {{AI_NAME}}.

Please read my memory file and restore context:

@{{VAULT_PATH}}/.ai-butler-system/memory.md

After reading, briefly confirm:
1. Your name ({{AI_NAME}})
2. Current pending tasks (if any)

Then prepare for new task instructions.
```

### 2.5 Set Up CLAUDE.md (Project Instructions)

Create `$VAULT_PATH/CLAUDE.md`:

```markdown
# {{VAULT_PATH_BASENAME}} — {{USER_NAME}}'s AI Command Center

## Identity
You are assisting **{{USER_NAME}}**.

## Project Structure
- `0-Inbox/` — New notes, daily briefs
- `1-Projects/` — Active projects
- `2-Areas/` — Ongoing areas of responsibility
- `3-Resources/` — Reference material
- `4-Archives/` — Completed/archived items

## Rules
- Respond in **{{PREFERRED_LANGUAGE}}**
- Code and commit messages in English
- Never fabricate data — show `⚠️ Data unavailable` when unsure
- Record important decisions to memory file

## Available Skills
| Command | Purpose |
|---------|---------|
| `/{{AI_NAME_LOWERCASE}}` | Load AI memory and context |
```

---

## Phase 3: Memory Infrastructure (20 minutes)

### 3.1 RLabs Memory (Semantic Auto-Curation)

> AI-curated memory that automatically decides what's worth remembering across sessions.

```bash
# Clone RLabs Memory
cd ~ && git clone https://github.com/RLabs-Inc/memory.git rlabs-memory
cd rlabs-memory

# Install dependencies
pip3 install -r requirements.txt

# Start server
python3 -m memory.server --port 8765
```

Test: `curl http://localhost:8765/health`

**Create LaunchAgent** at `~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.rlabs-memory.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{{USER_LOWERCASE}}.rlabs-memory</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>{{HOME}}/rlabs-memory/memory/server.py</string>
        <string>--port</string>
        <string>8765</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{{HOME}}/.logs/rlabs-memory.log</string>
    <key>StandardErrorPath</key>
    <string>{{HOME}}/.logs/rlabs-memory.log</string>
</dict>
</plist>
```

### 3.2 Episodic Memory (Conversation History Search)

```bash
# Install episodic-memory
npm install -g episodic-memory

# Sync and index conversations
episodic-memory sync
episodic-memory stats
```

Add as MCP server:
```bash
claude mcp add episodic-memory -- episodic-memory mcp
```

### 3.3 QMD — Local RAG Search (Optional but Recommended)

> Hybrid search (BM25 + vector + reranking) over your entire PKM vault.

```bash
# Install QMD (requires Bun)
bun install -g qmd

# Initialize collection
qmd add pkm-vault "$VAULT_PATH" "**/*.md"

# Build index (downloads ~2.2GB of GGUF models on first run)
qmd update
qmd embed

# Add as MCP server
claude mcp add qmd -- qmd mcp
```

Test: `qmd query "your search term"`

---

## Phase 4: Daily Brief (15 minutes)

### 4.1 Create Daily Brief Script

Create `~/bin/daily-brief.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  vaultPath: process.env.VAULT_PATH || `${process.env.HOME}/Dropbox/PKM-Vault`,
  userName: process.env.USER_NAME || 'User',
  aiName: process.env.AI_NAME || 'Butler',
  timezone: process.env.TIMEZONE || 'Asia/Taipei'
};

function getDateString() {
  return new Date().toISOString().split('T')[0];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getTodos() {
  const inboxPath = path.join(CONFIG.vaultPath, '0-Inbox');
  const todos = [];
  try {
    for (const file of fs.readdirSync(inboxPath)) {
      if (!file.endsWith('.md')) continue;
      const content = fs.readFileSync(path.join(inboxPath, file), 'utf-8');
      const matches = content.match(/- \[ \] .+/g);
      if (matches) {
        todos.push({ file, items: matches.map(t => t.replace('- [ ] ', '')) });
      }
    }
  } catch (e) { /* ignore */ }
  return todos;
}

function main() {
  const dateStr = getDateString();
  const todos = getTodos();

  let report = `# Daily Brief - ${dateStr}\n\n`;
  report += `${getGreeting()}, ${CONFIG.userName}!\n\n`;
  report += `---\n\n`;

  report += `## Pending Tasks\n\n`;
  if (todos.length > 0) {
    for (const todo of todos) {
      report += `### ${todo.file}\n`;
      todo.items.forEach(item => { report += `- [ ] ${item}\n`; });
      report += '\n';
    }
  } else {
    report += `No pending tasks.\n\n`;
  }

  // Add sections as you grow:
  // ## Today's Calendar (Google Calendar MCP)
  // ## Email Summary (Gmail MCP)
  // ## Slack Summary (Slack MCP)
  // ## Market Update (financial APIs)
  // ## AI News (RSS feeds)

  report += `---\n*Generated by ${CONFIG.aiName} at ${new Date().toLocaleTimeString('en-US', { timeZone: CONFIG.timezone })}*\n`;

  const outputPath = path.join(CONFIG.vaultPath, '0-Inbox', `${dateStr}-Daily-Brief.md`);
  fs.writeFileSync(outputPath, report);
  console.log(`Daily Brief generated: ${outputPath}`);

  try {
    execSync(`osascript -e 'display notification "Daily Brief ready" with title "${CONFIG.aiName}"'`);
  } catch (e) { /* ignore */ }
}

main();
```

### 4.2 Schedule It

```bash
chmod +x ~/bin/daily-brief.js

# Create LaunchAgent (fires at 7:00 AM daily)
# Use the LaunchAgent template from Phase 3, changing:
#   Label: com.{{USER_LOWERCASE}}.dailybrief
#   ProgramArguments: /usr/local/bin/node, {{HOME}}/bin/daily-brief.js
#   StartCalendarInterval: Hour=7, Minute=0
#   RunAtLoad: false

# Load and test
launchctl load ~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.dailybrief.plist
node ~/bin/daily-brief.js
```

---

## Phase 5: Model Router (Optional, 10 minutes)

### CLIProxyAPI — Unified Model Access

> Route requests to multiple LLM providers (OpenRouter, Ollama, etc.) through a single local endpoint.

```bash
# Download CLIProxyAPI (macOS Apple Silicon)
gh release download --repo router-for-me/CLIProxyAPI --pattern "*darwin_arm64*" -D ~/cliproxy
chmod +x ~/cliproxy/cliproxy

# Configure (add your API keys)
# Edit ~/cliproxy/config.yaml with your providers

# Start
~/cliproxy/cliproxy &

# Test
curl -H "Authorization: Bearer your-key" http://127.0.0.1:8317/v1/models
```

This lets all your agents use one endpoint (`http://127.0.0.1:8317/v1`) with automatic fallback between models.

---

## Phase 6: Slack Bot (Optional, 20 minutes)

### KITT — Team Collaboration Bot

> If you work with a team, a Slack bot provides shared AI access.

**Prerequisites**: Slack workspace, Slack App with Bot Token (Socket Mode)

```bash
mkdir -p ~/tachikoma/kitt && cd ~/tachikoma/kitt

# Initialize
npm init -y
npm install @slack/bolt dotenv

# Shared utilities (all bots reuse these)
mkdir -p ~/tachikoma/shared
```

Create `~/tachikoma/kitt/bot.js` with Slack Bolt v3 + Socket Mode. Key features:
- `@mention` for AI Q&A
- Language detection and translation
- Slash commands (`/kitt help`, `/kitt ask`)

Create `~/tachikoma/shared/tune-socket-mode.js` for connection stability:
- Reconnect on disconnect
- Heartbeat monitoring
- Graceful error handling

**Important**: Use Bun runtime for Slack bots (LaunchAgent), NOT PM2. PM2 crashes with `bun:sqlite`.

---

## Completion Checklist

### Phase 1: Foundation
- [ ] PKM directory structure created
- [ ] `.ai-butler-system/` configured
- [ ] `config.json` created

### Phase 2: Identity & Memory
- [ ] User persona collected and saved
- [ ] Memory file created
- [ ] Slash command created
- [ ] CLAUDE.md created

### Phase 3: Memory Infrastructure
- [ ] RLabs Memory running (port 8765)
- [ ] Episodic Memory synced + MCP connected
- [ ] QMD indexed + MCP connected (optional)

### Phase 4: Daily Brief
- [ ] Script created and tested
- [ ] LaunchAgent scheduled

### Phase 5: Model Router (optional)
- [ ] CLIProxyAPI running (port 8317)

### Phase 6: Slack Bot (optional)
- [ ] KITT bot responding in Slack

---

## Growth Path

After the basics are running, you can progressively add:

| Level | Add | Benefit |
|-------|-----|---------|
| **L1** | Google Calendar MCP | Calendar in Daily Brief |
| **L1** | Gmail MCP | Email summaries |
| **L2** | Slack MCP + Summary | Team communication digest |
| **L2** | Investment tracker (Argus) | Portfolio monitoring |
| **L3** | Social media automation | Twitter/LinkedIn auto-posting |
| **L3** | Financial CFO bot (Wells) | Personal finance management |
| **L4** | Multi-agent orchestration | Agents delegating to agents |
| **L4** | Browser automation (Peekaboo) | UI control from agents |

Each level builds on the previous. Don't skip ahead — get L1 stable before adding L2.

---

## Troubleshooting

### LaunchAgent Not Running
```bash
launchctl list | grep {{USER_LOWERCASE}}
cat ~/.logs/{{SERVICE}}.log
launchctl kickstart -k gui/$(id -u)/com.{{USER_LOWERCASE}}.{{SERVICE}}
```

### Memory Server Down
```bash
curl http://localhost:8765/health   # RLabs Memory
curl http://localhost:8317/v1/models  # CLIProxyAPI
```

### Node.js Path Issues
```bash
which node   # Confirm path
which bun    # For Bun-based services
# Update ProgramArguments in plist files accordingly
```

### Service Management Rules
- **LaunchAgents** = Bun-runtime bots (Slack, schedulers)
- **PM2** = Python/Node long-running services
- **Never** put Bun apps in PM2 (`bun:sqlite` will crash)
- After reboot: `launchctl list | grep {{USER_LOWERCASE}}` AND `pm2 list`

---

## Version History

- **v2.0.0** (2026-02-16): Major rewrite — 3-layer memory architecture, CLIProxyAPI model router, QMD local RAG, multi-agent growth path, service management guidelines
- **v1.0.0** (2025-12-23): Initial release

---

*Designed by Iris (Melchior) for the MAGI System community*
