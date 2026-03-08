# AI Butler Quick Start Guide

**Version**: v2.3.0
**Updated**: 2026-03-08
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
│  ├── Discord (bot notifications + commands)     │
│  ├── Mobile (WhatsApp / Telegram)               │
│  └── Obsidian (knowledge base)                  │
├─────────────────────────────────────────────────┤
│  AGENT LAYER                                    │
│  ├── Core: Butler (orchestrator)                │
│  ├── Specialists: PM, Finance, Investment, etc. │
│  └── Automation: Social, Brief, Sync            │
├─────────────────────────────────────────────────┤
│  MEMORY LAYER                                   │
│  ├── L1: Static files (@file in skills/memory)  │
│  ├── L2: Local RAG (QMD — BM25 + vector)        │
│  └── L3: Semantic memory (RLabs + Episodic)     │
├─────────────────────────────────────────────────┤
│  MODEL LAYER                                    │
│  ├── Claude Code (primary reasoning)            │
│  ├── CLIProxyAPI (model router — local proxy)   │
│  │   ├── claude-sonnet-4-6 (default)            │
│  │   ├── gemini-2.5-flash (long context/bulk)   │
│  │   └── glm-4.7 (free tier reasoning)          │
│  └── Ollama (local models for offline tasks)    │
├─────────────────────────────────────────────────┤
│  RUNTIME LAYER                                  │
│  ├── LaunchAgents (Bun/Node bots, schedulers)   │
│  ├── PM2 (Python/Node long-running services)    │
│  └── infra-health (watchdog, every 15 min)      │
└─────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (10 minutes)

### 1.1 Create Directory Structure

```bash
VAULT_PATH="$HOME/Dropbox/PKM-Vault"  # User can customize

# PKM directories (Obsidian vault)
mkdir -p "$VAULT_PATH"/{0-Inbox,1-Projects,2-Areas,3-Resources,4-Archives}

# AI Butler system (hidden from Obsidian sidebar)
mkdir -p "$VAULT_PATH/.ai-butler-system"/{personas,shared-context,docs,credentials,memory,reports}

# Runtime directories
mkdir -p "$HOME/bin"
mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$HOME/.logs"

# Tachikoma multi-agent system (for Discord bots)
mkdir -p "$HOME/tachikoma/shared"
```

### 1.2 Ask User for Basic Info

**Claude Code should ask:**
1. What name for your AI assistant? (Default: Butler)
2. Your name?
3. Timezone? (Default: Asia/Taipei)
4. Obsidian Vault path? (Default: ~/Dropbox/PKM-Vault)
5. Will you use Discord bots? (Y/N)

### 1.3 Create System Config

Create `$VAULT_PATH/.ai-butler-system/config.json`:

```json
{
  "version": "2.3.0",
  "created": "{{CURRENT_DATE}}",
  "vault_path": "{{VAULT_PATH}}",
  "ai_name": "{{AI_NAME}}",
  "user_name": "{{USER_NAME}}",
  "timezone": "{{TIMEZONE}}",
  "features": {
    "daily_brief": true,
    "persona_system": true,
    "memory_system": true,
    "discord_bots": false,
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

**Version**: 2.3.0
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

# Install dependencies (Python 3.11+ required)
python3 --version  # Confirm ≥ 3.11
pip3 install -r requirements.txt

# Start server
python3 -m memory.server --port 8765
```

Test: `curl http://localhost:8765/health`

**Add as MCP server:**
```bash
claude mcp add rlabs-memory -- python3 -m memory.mcp_server --port 8765
```

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
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
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

# Build index (downloads models on first run)
qmd update
qmd embed

# Add as MCP server (specify port to avoid conflicts)
claude mcp add qmd -- qmd mcp --port 7474
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
#   ProgramArguments: /opt/homebrew/bin/node, {{HOME}}/bin/daily-brief.js
#   StartCalendarInterval: Hour=7, Minute=0
#   RunAtLoad: false

# Load and test
launchctl load ~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.dailybrief.plist
node ~/bin/daily-brief.js
```

> **Note on node path**: Use `which node` to find the correct path. On Apple Silicon with Homebrew it's typically `/opt/homebrew/bin/node`. LaunchAgents don't inherit shell PATH.

---

## Phase 5: Model Router (Optional, 10 minutes)

### CLIProxyAPI — Unified Model Access

> Route requests to multiple LLM providers through a single local endpoint. Enables all agents to use one URL with automatic fallback.

```bash
# Download CLIProxyAPI (macOS Apple Silicon)
gh release download --repo router-for-me/CLIProxyAPI --pattern "*darwin_arm64*" -D ~/cliproxy
chmod +x ~/cliproxy/cliproxy

# Configure providers (add your API keys to config.yaml)
# DO NOT commit config.yaml — it contains API keys
cp ~/cliproxy/config.example.yaml ~/cliproxy/config.yaml
# Edit with your API keys for: OpenRouter, Gemini, etc.

# Start
~/cliproxy/cliproxy &

# Test (replace 'your-key' with the key you set in config.yaml)
curl -H "Authorization: Bearer your-key" http://127.0.0.1:8317/v1/models
```

All agents can then use `http://127.0.0.1:8317/v1` with automatic provider fallback.

### Recommended Model Routing

| Use Case | Model | Why |
|----------|-------|-----|
| Primary reasoning | `claude-sonnet-4-6` | Best quality |
| Long context / bulk | `gemini-2.5-flash` | 1M token window |
| Free tier tasks | `glm-4.7` | Free, reasoning capable |
| Local / offline | Ollama models | No API cost |

---

## Phase 6: Google Workspace Integration (Optional, 15 minutes)

### gws CLI — Gmail, Calendar, Drive, Docs

> Connect your Google Workspace to all agents via a unified CLI and MCP server.

```bash
# Install gws CLI
npm install -g @googleworkspace/cli

# Authenticate (opens browser for OAuth)
gws auth login

# Verify access
gws gmail list --max-results 5
gws calendar events list

# Add as MCP server (select scopes you need)
gws mcp -s drive,gmail,calendar,docs,sheets
# Copy the output command to: claude mcp add gws -- <output>
```

**Available capabilities after setup:**
- Read/search Gmail, draft and send email
- Create, list, update Google Calendar events
- Read and edit Google Docs / Sheets
- List and download Drive files

> **Security**: OAuth tokens are stored encrypted at `~/Library/Application Support/gws/`. No API keys needed — uses your Google account.

---

## Phase 7: Discord Bot (Optional, 20 minutes)

### Butler Bot — Personal Notifications + Commands

> Discord provides a persistent notification hub for your AI agents, accessible from any device.

**Prerequisites**: Create a Discord server + Discord Application at [discord.com/developers](https://discord.com/developers/applications)

**Setup your Discord App:**
1. Create a new Application → Bot
2. Enable: Message Content Intent, Server Members Intent
3. Copy Bot Token (store in `.env`, never commit)
4. Invite bot to your server with `bot` + `applications.commands` scopes

```bash
mkdir -p ~/tachikoma/butler && cd ~/tachikoma/butler

# Initialize
npm init -y
npm install discord.js dotenv axios
```

Create `~/tachikoma/butler/.env`:
```bash
# NEVER commit this file
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
```

Create `~/tachikoma/butler/bot.js`:

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ]
});

client.once('ready', () => {
  console.log(`[Butler] Ready as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  // Only respond to @mention
  if (!message.mentions.has(client.user)) return;

  const content = message.content.replace(/<@[^>]+>/g, '').trim();
  // Add your AI response logic here (call CLIProxyAPI, etc.)
  await message.reply(`Echo: ${content}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

**Create LaunchAgent** at `~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.butler-discord.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{{USER_LOWERCASE}}.butler-discord</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>{{HOME}}/tachikoma/butler/bot.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>{{HOME}}</string>
    </dict>
    <key>WorkingDirectory</key>
    <string>{{HOME}}/tachikoma/butler</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{{HOME}}/.logs/butler-discord.log</string>
    <key>StandardErrorPath</key>
    <string>{{HOME}}/.logs/butler-discord.log</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.butler-discord.plist
```

---

## Phase 8: Infrastructure Health (Optional, 5 minutes)

> A watchdog script that automatically restarts failed services — so you don't wake up to a dead system.

Create `~/tachikoma/scripts/infra-health.sh`:

```bash
#!/bin/bash
# Check and restart critical services
LOG="$HOME/.logs/infra-health.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

check_http() {
  local name="$1" url="$2" label="${3:-$1}"
  if ! curl -sf "$url" > /dev/null 2>&1; then
    echo "[$(timestamp)] RESTART $label" >> "$LOG"
    launchctl kickstart -k "gui/$(id -u)/com.{{USER_LOWERCASE}}.$name" 2>/dev/null
  fi
}

check_process() {
  local name="$1" pattern="$2"
  if ! pgrep -f "$pattern" > /dev/null 2>&1; then
    echo "[$(timestamp)] RESTART $name" >> "$LOG"
    launchctl kickstart -k "gui/$(id -u)/com.{{USER_LOWERCASE}}.$name" 2>/dev/null
  fi
}

# Add your services here:
check_http "rlabs-memory" "http://localhost:8765/health" "RLabs Memory"
check_http "cliproxy" "http://localhost:8317/v1/models" "CLIProxyAPI"
check_process "butler-discord" "tachikoma/butler/bot.js"
```

Schedule it every 15 minutes via LaunchAgent with `StartInterval: 900`.

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

### Phase 6: Google Workspace (optional)
- [ ] gws CLI authenticated
- [ ] MCP server connected

### Phase 7: Discord Bot (optional)
- [ ] Bot responding to @mention
- [ ] LaunchAgent running

### Phase 8: Infra Health (optional)
- [ ] Watchdog script created and scheduled

---

## Growth Path

After the basics are running, you can progressively add:

| Level | Add | Benefit |
|-------|-----|---------|
| **L1** | Google Calendar MCP (via gws) | Calendar in Daily Brief |
| **L1** | Gmail MCP (via gws) | Email summaries |
| **L2** | Discord notification hub | Mobile alerts from agents |
| **L2** | Investment tracker | Portfolio monitoring |
| **L3** | Social media automation | Twitter/LinkedIn auto-posting |
| **L3** | Financial CFO bot | Personal finance management |
| **L4** | Task queue (antfarm) | Agents delegating to agents |
| **L4** | Browser automation | UI control from agents |

Each level builds on the previous. Don't skip ahead — get L1 stable before adding L2.

---

## Troubleshooting

### LaunchAgent Not Running
```bash
launchctl list | grep {{USER_LOWERCASE}}
cat ~/.logs/{{SERVICE}}.log
launchctl kickstart -k gui/$(id -u)/com.{{USER_LOWERCASE}}.{{SERVICE}}
```

### Find Correct node/bun Path (Critical for LaunchAgents)
```bash
which node   # e.g., /opt/homebrew/bin/node
which bun    # e.g., /opt/homebrew/bin/bun
# Use the FULL path in ProgramArguments — LaunchAgents don't use shell PATH
```

### Memory Server Down
```bash
curl http://localhost:8765/health   # RLabs Memory
curl http://localhost:8317/v1/models  # CLIProxyAPI
curl http://localhost:7474/health   # QMD
```

### Discord Bot Not Responding
```bash
# Check log
tail -50 ~/.logs/butler-discord.log

# Verify token is valid (Discord returns 401 if expired)
node -e "require('dotenv').config({path:'$HOME/tachikoma/butler/.env'}); require('https').get({hostname:'discord.com',path:'/api/v10/users/@me',headers:{Authorization:'Bot '+process.env.DISCORD_BOT_TOKEN}},r=>r.on('data',d=>console.log(d.toString())))"

# If token expired: regenerate at discord.com/developers → your app → Bot → Reset Token
```

### Service Management Rules
- **LaunchAgents** = Node/Bun bots (Discord bots, schedulers)
- **PM2** = Python/Node long-running services
- **Never** put Bun apps in PM2 (`bun:sqlite` will crash)
- After reboot: `launchctl list | grep {{USER_LOWERCASE}}` AND `pm2 list`

### gws CLI Auth Issues
```bash
# Re-authenticate
gws auth logout && gws auth login

# Check token status
gws auth status
```

---

## Security Checklist

Before pushing any code to GitHub:

- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded tokens, API keys, or webhook URLs in source files
- [ ] Discord Bot Token only in `.env`, never in `bot.js`
- [ ] `config.yaml` (CLIProxyAPI with API keys) is gitignored
- [ ] Channel IDs are acceptable to commit (not secrets), but tokens are not

---

## Version History

- **v2.3.0** (2026-03-08): Discord-native architecture (replaced Slack), added Google Workspace integration (gws CLI), Phase 8 infra health watchdog, updated model roster, fixed LaunchAgent node path guidance, added security checklist
- **v2.0.0** (2026-02-16): Major rewrite — 3-layer memory architecture, CLIProxyAPI model router, QMD local RAG, multi-agent growth path
- **v1.0.0** (2025-12-23): Initial release

---

*Designed by Iris (Melchior) for the MAGI System community*
