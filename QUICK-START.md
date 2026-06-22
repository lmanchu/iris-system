# AI Butler Quick Start Guide

**Version**: v3.0.0
**Updated**: 2026-06-23
**Purpose**: Let your coding agent (Claude Code or Codex) build your complete AI assistant system by reading this guide

> **For Claude Pro users**: This guide is split into 3 sessions (~20 messages each). Complete one session per day to stay within usage limits. Each session ends with a working system you can use immediately.

---

## For Claude Code

> **Claude Code**: Execute the Phases assigned to the current Session. Replace all `{{PLACEHOLDER}}` variables (like `{{HOME}}`, `{{USER_NAME}}`, `{{VAULT_PATH}}`) with the user's actual values from Phase 2 answers. After completing each Phase, confirm with the user before proceeding. Ask questions if anything is unclear. Do NOT proceed to the next Session's phases — stop and summarize what was built.

---

## For Codex

> **Codex**: This guide is written with Claude Code as the primary agent, but the system itself is agent-agnostic — Codex can build the same setup. Follow the same Phases; only a few mechanics differ. Substitute as you go:
>
> | What the guide says | Codex equivalent |
> |---|---|
> | `~/.claude/CLAUDE.md` (global rules) | `~/.codex/AGENTS.md` (global) |
> | project `CLAUDE.md` | project-root `AGENTS.md` |
> | `~/.claude/commands/{name}.md` (slash command, Phase 3) | Codex has no slash commands — put the same "load my memory and restore context" instructions directly in `AGENTS.md` |
> | `claude mcp add <name> -- <cmd>` (Phases 5) | register the server under `[mcp_servers.<name>]` (command + args) in `~/.codex/config.toml` — check the current Codex MCP docs for the exact schema before relying on it |
> | `claude plugin add … episodic-memory` (Phase 4) | no Codex plugin equivalent — skip it, or expose session search as a tool later (the Phase 12 pattern) |
>
> Everything else — directory layout, `memory.md`, QMD, the daily brief, CLIProxyAPI, Hermes Agent, the Telegram bot, LaunchAgents — is identical. Those are plain files, binaries, and OS services, not tied to any one coding agent.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  YOU (User)                                     │
│  ├── Claude Code (primary interface)            │
│  ├── Slack (team collaboration, optional)       │
│  ├── WhatsApp / Telegram (mobile, optional)     │
│  └── Obsidian (knowledge base)                  │
├─────────────────────────────────────────────────┤
│  MEMORY LAYER                                   │
│  ├── L1: Static files (CLAUDE.md + memory.md)  │
│  ├── L2: Episodic Memory (conversation search) │
│  └── L3: QMD — Local RAG (BM25 + vector)       │
├─────────────────────────────────────────────────┤
│  MODEL LAYER                                    │
│  ├── Claude Code (primary reasoning)            │
│  └── CLIProxyAPI (model router, optional)       │
├─────────────────────────────────────────────────┤
│  RUNTIME LAYER                                  │
│  └── LaunchAgents (Bun-based bots, schedulers) │
└─────────────────────────────────────────────────┘
```

---

## Prerequisites (Do This Before Any Session)

> Assumes Claude Code is already running and you're logged in. If not, see https://claude.ai/download.

```bash
# Check what's installed — install any that are missing
brew --version    # If missing: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
bun --version     # If missing: brew install bun
node --version    # If missing: brew install node
git --version     # Built into macOS, should exist
python3 --version # Built into macOS, should exist
uv --version      # Optional — only needed if you build custom Python tools
```

---

## SESSION 1 — Identity & Foundation
**Goal**: Claude Code knows who you are and remembers across sessions.
**Time**: ~45 minutes | **Token budget**: ~20 messages

### Phase 1: Directory Structure (5 min)

```bash
VAULT_PATH="$HOME/Dropbox/PKM-Vault"  # Change if needed

# PKM directories (Obsidian vault)
mkdir -p "$VAULT_PATH"/{0-Inbox,1-Projects/Active,2-Areas,3-Resources,4-Archives}

# AI Butler system
mkdir -p "$VAULT_PATH/.ai-butler-system"/{personas,shared-context,docs,credentials,memory,reports}

# Runtime directories
mkdir -p "$HOME/bin"
mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$HOME/.logs"
```

### Phase 2: Identity & Memory (20 min)

**Claude Code should ask the user:**
1. What name for your AI assistant? (Default: Butler)
2. Your name?
3. Timezone? (Default: Asia/Taipei)
4. Obsidian Vault path? (Default: ~/Dropbox/PKM-Vault)
5. MBTI type? (optional — take test at 16personalities.com)
6. Professional background? (industry, role)
7. Preferred language for responses?

**Create `$VAULT_PATH/.ai-butler-system/config.json`:**

```json
{
  "version": "2.3.0",
  "created": "{{CURRENT_DATE}}",
  "vault_path": "{{VAULT_PATH}}",
  "ai_name": "{{AI_NAME}}",
  "user_name": "{{USER_NAME}}",
  "timezone": "{{TIMEZONE}}"
}
```

**Create `$VAULT_PATH/.ai-butler-system/personas/user-persona.md`:**

```markdown
# {{USER_NAME}} Persona Profile

## Core Identity
- **MBTI**: {{MBTI_TYPE}}
- **Industry**: {{INDUSTRY}}
- **Role**: {{ROLE}}

## Communication Preferences
- **Language**: {{PREFERRED_LANGUAGE}}
- Direct answers, skip pleasantries
- No emojis unless requested
- For ideas: question and improve
- For execution: give concrete steps

## Current Focus
- {{CURRENT_FOCUS}}
```

**Create `$VAULT_PATH/.ai-butler-system/memory.md`:**

```markdown
# {{AI_NAME}} Memory

> Long-term memory — loaded at start of each conversation.
> Last Updated: {{CURRENT_DATE}}

## Identity
- **Name**: {{AI_NAME}}
- **User**: {{USER_NAME}}

## Active Projects
(Add projects as they come up)

## Key Decisions
(Record important decisions with dates)

## Learned Preferences
(Record patterns you notice about the user)
```

### Phase 3: CLAUDE.md + Slash Command (10 min)

**Create `$VAULT_PATH/CLAUDE.md`:**

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
- Never fabricate data — show ⚠️ Data unavailable when unsure
- Record important decisions to memory file

## Available Skills
| Command | Purpose |
|---------|---------|
| `/{{AI_NAME_LOWERCASE}}` | Load AI memory and context |
```

**Create `~/.claude/commands/{{AI_NAME_LOWERCASE}}.md`:**

```markdown
Hello! I'm {{AI_NAME}}.

Please read my memory file and restore context:

@{{VAULT_PATH}}/.ai-butler-system/memory.md

After reading, briefly confirm:
1. Your name ({{AI_NAME}})
2. Current pending tasks (if any)

Then prepare for new task instructions.
```

### Phase 4: Episodic Memory (10 min)

> Episodic Memory indexes your Claude Code conversations so you can search past sessions.

```bash
# Install as Claude Code plugin (not npm — it's a Claude plugin)
claude plugin add https://github.com/obra/episodic-memory.git
```

> **If `claude plugin add` fails**: Your Claude Code version may not support plugins yet. Try updating first: `claude update`. If still failing, skip this step — you can add it later. The system works fine without it.

After installing, **restart Claude Code completely** (quit and reopen, not just new session):
```bash
# Verify the plugin is loaded
claude mcp list
# Should show "episodic-memory" in the output
```

> **If `claude mcp list` doesn't show episodic-memory**: The plugin may have installed but not registered as MCP. Try: `claude mcp add episodic-memory -- npx -y @anthropic/episodic-memory` as a fallback.

**✅ Session 1 Complete.** Claude Code now has memory and identity.

Restart Claude Code, then test the slash command:
```
/{{AI_NAME_LOWERCASE}}
```
> ⚠️ The slash command only works after restarting Claude Code (it reads `~/.claude/commands/` on startup).

---

## SESSION 2 — Search & Periodic Sync
**Goal**: Claude Code can search your knowledge base; episodic memory stays current across long sessions.
**Time**: ~30 minutes | **Token budget**: ~10 messages

> ⚠️ **Do this BEFORE starting Session 2** (takes 10-30 min in Terminal, no Claude session needed):
> ```bash
> # Step 1: Install QMD
> bun install -g qmd
>
> # Step 2: Verify install — IMPORTANT: bun puts binaries in ~/.bun/bin/
> # If this works, skip Step 3:
> qmd --version
>
> # Step 3: If "command not found", add bun to PATH:
> echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
> source ~/.zshrc
> qmd --version   # Should work now
>
> # Step 4: Initialize with your vault
> qmd add pkm-vault "$HOME/Dropbox/PKM-Vault" "**/*.md"
>
> # Step 5: Build search index
> # ⚠️ First run downloads ~2.2GB of AI models — needs good internet, takes 5-15 min
> qmd update
> qmd embed    # This is the slow step (model download + vector embedding)
>
> # Step 6: Verify it works
> qmd query "test search"
> # Should return some results from your vault files
> ```
>
> **If `bun install -g qmd` fails**: Try `npm install -g qmd` instead. The binary will be in your npm global path instead.

### Phase 5: QMD Local Search (10 min)

```bash
# Confirm QMD is working (should have been set up in pre-work above)
qmd query "test search"

# Add as MCP server — use full path to avoid PATH issues
claude mcp add qmd -- "$(which qmd)" mcp

# If 'which qmd' returns nothing, use the bun path directly:
# claude mcp add qmd -- ~/.bun/bin/qmd mcp
```

> **Verify MCP connection**: Restart Claude Code, then in a new session ask Claude to search your vault. It should use the QMD tool automatically.

### Phase 6: Episodic Memory Periodic Sync (10 min)

> Episodic Memory indexes your Claude Code conversations for cross-session search. The plugin syncs automatically when Claude Code is running, but long sessions (2+ hours) can miss recent conversations. This LaunchAgent syncs every 30 minutes in the background.

**First, verify episodic-memory plugin is installed:**
```bash
claude mcp list
# Should show "episodic-memory" in the output
# If missing: claude plugin add https://github.com/obra/episodic-memory.git
```

**Find the plugin's CLI script path:**
```bash
# Look for episodic-memory.js in the plugins cache
find ~/.claude/plugins -name "episodic-memory.js" 2>/dev/null
# Note the full path — you'll need it for the LaunchAgent below
```

**Create LaunchAgent** at `~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.episodic-memory-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{{USER_LOWERCASE}}.episodic-memory-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>{{NODE_PATH}}</string>
        <string>{{EPISODIC_MEMORY_JS_PATH}}</string>
        <string>sync</string>
        <string>--background</string>
    </array>
    <!-- NODE_PATH: run 'which node' to get the path -->
    <!-- EPISODIC_MEMORY_JS_PATH: from the find command above -->
    <key>StartInterval</key>
    <integer>1800</integer>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/episodic-memory-sync.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/episodic-memory-sync.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>HOME</key>
        <string>{{HOME}}</string>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.episodic-memory-sync.plist
launchctl list | grep episodic-memory  # Confirm loaded
```

> **Why 30 minutes?** The episodic-memory plugin syncs inline during active Claude Code sessions. But if a session runs for hours, the index drifts — conversations from the last 2-3 hours won't be searchable. The LaunchAgent closes that gap automatically.

**✅ Session 2 Complete.** Claude Code can search your vault and conversation history.

---

## SESSION 3 — Automation
**Goal**: Daily brief runs automatically. System is self-maintaining.
**Time**: ~30 minutes | **Token budget**: ~10 messages

### Phase 7: Daily Brief (20 min)

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

  // Expand as you grow:
  // ## Today's Calendar (Google Calendar MCP)
  // ## Email Summary (Gmail MCP)
  // ## Market Update (financial APIs)

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

```bash
chmod +x ~/bin/daily-brief.js

# Test it now
node ~/bin/daily-brief.js
# Check: should create a file in 0-Inbox/
```

**Create LaunchAgent** (fires at 7:00 AM daily):
`~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.dailybrief.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{{USER_LOWERCASE}}.dailybrief</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>{{HOME}}/bin/daily-brief.js</string>
    </array>
    <!-- NOTE: If node is not at /opt/homebrew/bin/node, run 'which node' and use that path -->
    <key>EnvironmentVariables</key>
    <dict>
        <key>VAULT_PATH</key>
        <string>{{VAULT_PATH}}</string>
        <key>USER_NAME</key>
        <string>{{USER_NAME}}</string>
        <key>AI_NAME</key>
        <string>{{AI_NAME}}</string>
        <key>TIMEZONE</key>
        <string>{{TIMEZONE}}</string>
    </dict>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>{{HOME}}/.logs/dailybrief.log</string>
    <key>StandardErrorPath</key>
    <string>{{HOME}}/.logs/dailybrief.log</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.dailybrief.plist
```

**✅ Session 3 Complete.** Your AI Butler system is fully operational.

---

## Completion Checklist

### Session 1
- [ ] Directory structure created
- [ ] user-persona.md created
- [ ] memory.md created
- [ ] CLAUDE.md created
- [ ] Slash command `/{{AI_NAME_LOWERCASE}}` working
- [ ] Episodic Memory synced + MCP connected

### Session 2
- [ ] QMD indexed (run embed in Terminal before session)
- [ ] QMD MCP connected
- [ ] Episodic Memory sync LaunchAgent loaded (30 min interval)

### Session 3
- [ ] Daily Brief tested and working
- [ ] LaunchAgent scheduled for 7 AM

### Session 4
- [ ] CLIProxyAPI running (port 8317)
- [ ] Gemini OAuth completed (one-time browser step)
- [ ] Hermes Agent installed + connected to CLIProxyAPI
- [ ] SOUL.md generated from user-persona.md
- [ ] Telegram bot token configured
- [ ] QMD search tool wired
- [ ] Episodic Memory search tool wired
- [ ] Hermes LaunchAgent running

---

## SESSION 4 — Personal EA Telegram Bot
**Goal**: A Telegram bot that knows who you are, can search your knowledge base, and runs 24/7.
**Time**: ~60 minutes | **Token budget**: ~20 messages

> **Prerequisites**: Sessions 1–3 must be complete. You need a Telegram account and a Google account with Gemini Advanced or Google One AI Premium subscription.

---

### Phase 8: CLIProxyAPI — Free AI Compute via OAuth (15 min)

> CLIProxyAPI proxies your existing AI subscriptions (Gemini Advanced, Claude Max) into a single OpenAI-compatible endpoint. Hermes Agent uses this instead of paying per-token API fees.

```bash
# Download the latest binary for your platform (macOS Apple Silicon shown)
VERSION=$(curl -s https://api.github.com/repos/router-for-me/CLIProxyAPI/releases/latest | grep tag_name | cut -d'"' -f4)
curl -L "https://github.com/router-for-me/CLIProxyAPI/releases/download/${VERSION}/CLIProxyAPI_${VERSION#v}_darwin_arm64.tar.gz" -o /tmp/cliproxy.tar.gz
mkdir -p ~/cliproxy && tar -xzf /tmp/cliproxy.tar.gz -C ~/cliproxy
chmod +x ~/cliproxy/cliproxy

# Copy the example config
curl -L "https://raw.githubusercontent.com/router-for-me/CLIProxyAPI/main/config.example.yaml" -o ~/cliproxy/config.yaml
```

> **macOS Intel**: change `darwin_arm64` → `darwin_amd64`
> **Full guide**: https://help.router-for.me/

**Gemini OAuth (one-time, requires browser):**
```bash
# This opens a browser window — sign in with your Google account
~/cliproxy/cliproxy -login
# After completing, verify credentials saved
ls ~/.cli-proxy-api/   # Should show gemini-<email>-<project>.json
```

**Start CLIProxyAPI:**
```bash
~/cliproxy/cliproxy &
curl http://localhost:8317/v1/models | grep gemini
# Should show gemini-2.5-flash or similar
```

> ⚠️ **OAuth requires a browser** — this step cannot be done headlessly. If you're on a remote machine, you'll need a local browser session or X forwarding.

**Create LaunchAgent** at `~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.cliproxy.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{{USER_LOWERCASE}}.cliproxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>{{HOME}}/cliproxy/cliproxy</string>
        <string>-config</string>
        <string>{{HOME}}/cliproxy/config.yaml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{{HOME}}/.logs/cliproxy.log</string>
    <key>StandardErrorPath</key>
    <string>{{HOME}}/.logs/cliproxy.log</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.cliproxy.plist
```

---

### Phase 9: Hermes Agent Install (10 min)

> Hermes Agent (NousResearch) is an open-source AI agent with memory, tool use, and Telegram support. We point it at CLIProxyAPI so it uses your Gemini subscription.

```bash
# Install via uv (recommended)
uv tool install hermes-agent

# Or pip
pip install hermes-agent

# Verify
hermes --version
```

**Configure to use CLIProxyAPI:**

Edit `~/.hermes/config.yaml`:
```yaml
base_url: http://127.0.0.1:8317/v1
api_key: local-proxy-key
model: gemini-2.5-flash
```

**Test it works:**
```bash
OPENROUTER_BASE_URL=http://127.0.0.1:8317/v1 \
OPENROUTER_API_KEY=local-proxy-key \
hermes chat -q "What's 2+2?"
# Should return a response via Gemini
```

---

### Phase 10: SOUL.md — Persona Generation (10 min)

> SOUL.md is Hermes's system prompt. Claude Code will generate it from your user-persona.md (built in Phase 2).

**Ask Claude Code to generate your SOUL.md:**

```
Read my persona file at {{VAULT_PATH}}/.ai-butler-system/personas/user-persona.md
and generate a SOUL.md for my Hermes Agent at ~/.hermes/SOUL.md.

The SOUL.md should:
- Define the AI's name and role as my Personal Executive Assistant
- Reference my background, communication preferences, and current focus from the persona
- Be written in first person as the AI ("I am...")
- Keep it under 500 words — Hermes prepends this to every conversation
```

**Verify:**
```bash
cat ~/.hermes/SOUL.md
hermes chat -q "Introduce yourself briefly"
# Should respond as your personalized EA
```

---

### Phase 11: Telegram Bot Setup (10 min)

**Create your bot:**
1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Follow prompts → get your **bot token** (format: `123456:ABC-DEF...`)
4. Send `/start` to your new bot to initialize the chat

**Add token to Hermes config:**

Edit `~/.hermes/config.yaml`:
```yaml
telegram:
  enabled: true
  token: "{{YOUR_BOT_TOKEN}}"
  allowed_users:
    - "{{YOUR_TELEGRAM_USER_ID}}"  # Find via @userinfobot
```

**Test Telegram connection:**
```bash
hermes telegram &
# Send your bot a message in Telegram
# Should reply within a few seconds
kill %1
```

---

### Phase 12: Wire QMD + Episodic Memory as Tools (10 min)

> These two tools let Hermes actively search your knowledge base and past Claude Code sessions on demand.

**Create `~/.hermes/tools/search_pkm.py`:**

```python
import requests

def search_pkm(query: str) -> str:
    """Search the local PKM knowledge base (Obsidian vault)."""
    try:
        r = requests.post(
            "http://localhost:7474/query",
            json={"q": query, "limit": 5},
            timeout=5
        )
        results = r.json().get("results", [])
        if not results:
            return "No results found."
        return "\n\n".join(
            f"**{r['title']}**\n{r['excerpt']}" for r in results
        )
    except Exception as e:
        return f"PKM search unavailable: {e}"
```

**Create `~/.hermes/tools/search_sessions.py`:**

```python
import subprocess, shutil

def search_past_sessions(query: str) -> str:
    """Search past Claude Code conversation history."""
    em_js = shutil.which("episodic-memory")
    if not em_js:
        # Try plugin cache
        import glob
        matches = glob.glob(
            os.path.expanduser("~/.claude/plugins/**/episodic-memory.js"),
            recursive=True
        )
        if not matches:
            return "Episodic memory not available."
        em_js = f"node {matches[0]}"
    try:
        result = subprocess.run(
            [em_js, "search", query, "--mode", "text"],
            capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip() or "No matching sessions found."
    except Exception as e:
        return f"Session search unavailable: {e}"
```

**Register tools in Hermes config:**
```yaml
tools:
  - path: ~/.hermes/tools/search_pkm.py
    name: search_pkm
    description: "Search personal knowledge base for notes and documents"
  - path: ~/.hermes/tools/search_sessions.py
    name: search_past_sessions
    description: "Search past AI conversation history"
```

**Test tools:**
```bash
hermes chat -q "Search my notes for anything about my current project"
# Should call search_pkm and return results from your vault
```

---

### Phase 13: Hermes LaunchAgent (5 min)

**Create `~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.hermes-ea.plist`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{{USER_LOWERCASE}}.hermes-ea</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/uv</string>
        <string>run</string>
        <string>hermes</string>
        <string>telegram</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OPENROUTER_BASE_URL</key>
        <string>http://127.0.0.1:8317/v1</string>
        <key>OPENROUTER_API_KEY</key>
        <string>local-proxy-key</string>
        <key>HOME</key>
        <string>{{HOME}}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{{HOME}}/.logs/hermes-ea.log</string>
    <key>StandardErrorPath</key>
    <string>{{HOME}}/.logs/hermes-ea.log</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.{{USER_LOWERCASE}}.hermes-ea.plist
launchctl list | grep hermes-ea  # Confirm running

# Final test — send your bot a message in Telegram:
# "Search my notes for [any topic in your vault]"
# It should call search_pkm and reply with results
```

**✅ Session 4 Complete.** You now have a Personal EA that:
- Knows who you are (SOUL.md from your persona)
- Runs on free Gemini compute (via CLIProxyAPI OAuth)
- Can search your entire knowledge base (QMD)
- Can recall past AI conversations (Episodic Memory)
- Available 24/7 on Telegram

---

## Growth Path

After the basics are running, add progressively:

| Level | Add | Benefit |
|-------|-----|---------|
| **L1** | Google Calendar MCP | Calendar in Daily Brief |
| **L1** | Gmail MCP | Email summaries |
| **L2** | CLIProxyAPI | Route between multiple AI models |
| **L2** | Investment tracker | Portfolio monitoring |
| **L3** | Slack bot | Team AI access |
| **L3** | Social automation | Twitter/LinkedIn auto-posting |
| **L4** | Multi-agent system | Agents delegating to agents |

Each level builds on the previous. Get L1 stable before adding L2.

---

## Troubleshooting

### LaunchAgent Not Running
```bash
launchctl list | grep {{USER_LOWERCASE}}
cat ~/.logs/{{SERVICE}}.log
launchctl kickstart -k gui/$(id -u)/com.{{USER_LOWERCASE}}.{{SERVICE}}
```

### Episodic Memory Sync
```bash
# Check if LaunchAgent is loaded
launchctl list | grep episodic-memory

# Check last sync output
cat /tmp/episodic-memory-sync.log | tail -20

# Force sync now
node $(find ~/.claude/plugins -name "episodic-memory.js" 2>/dev/null | head -1) sync --background
```

### CLIProxyAPI (if installed)
```bash
curl http://localhost:8317/v1/models
```

### Node Path Issues
```bash
which node   # Copy this path into LaunchAgent ProgramArguments
which bun    # For Bun-based services
```

### Service Management Rules
- **LaunchAgents** = Bun-runtime bots + all scheduled tasks
- **NEVER put Bun apps in PM2** — crashes with `bun:sqlite`
- After reboot: `launchctl list | grep {{USER_LOWERCASE}}`

---

## Version History

- **v3.0.0** (2026-06-23): Added Codex support — the guide now works with Claude Code **or** Codex via a substitution table (`CLAUDE.md` ↔ `AGENTS.md`, MCP setup, slash commands). Cleaned up naming and examples for general/public use.
- **v2.5.0** (2026-04-23): Added Session 4 — Personal EA Telegram Bot (CLIProxyAPI + Hermes Agent + SOUL.md + QMD/Episodic tools + LaunchAgent)
- **v2.1–v2.4** (2026-02 – 2026-04): Multi-session format for usage-limited plans; 3-layer memory architecture (static + episodic + QMD local RAG); QMD install hardening; troubleshooting and first-run fixes.
- **v2.0.0** (2026-02-16): Major rewrite — 3-layer memory architecture, CLIProxyAPI, QMD, multi-agent growth path
- **v1.0.0** (2025-12-23): Initial release

---

*Designed by Iris (Melchior) for the MAGI System community. Fork it, adapt it, make it yours.*
