# AI Butler Quick Start Guide

**Version**: v1.0.0
**Purpose**: Let Claude Code build your complete AI assistant system by reading this guide

---

## For Claude Code

> **Claude Code**: Execute the following three Phases in order. After completing each Phase, confirm with the user before proceeding. Ask questions if anything is unclear.

---

## Phase 1: PKM Structure Setup (5 minutes)

### 1.1 Create Obsidian Vault Directory Structure

```bash
# Set Vault path (user can customize)
VAULT_PATH="$HOME/Dropbox/PKM-Vault"

# Create core directories
mkdir -p "$VAULT_PATH"/{0-Inbox,1-Projects/Active,2-Areas,3-Resources,4-Archives}

# Create AI Butler system directory (hidden)
mkdir -p "$VAULT_PATH/.ai-butler-system"/{personas,shared-context,docs,credentials}

# Create scripts directory
mkdir -p "$HOME/bin"
mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$HOME/.logs"
```

### 1.2 Create System Config File

Create `$VAULT_PATH/.ai-butler-system/config.json`:

```json
{
  "version": "1.0.0",
  "created": "{{CURRENT_DATE}}",
  "vault_path": "{{VAULT_PATH}}",
  "ai_name": "{{AI_NAME}}",
  "user_name": "{{USER_NAME}}",
  "timezone": "Asia/Taipei",
  "features": {
    "daily_brief": true,
    "persona_system": true,
    "memory_system": true
  }
}
```

### 1.3 Ask User for Basic Info

**Claude Code should ask:**
1. What name do you want to give your AI assistant? (Default: Butler)
2. What's your name?
3. Your timezone? (Default: Asia/Taipei)
4. Obsidian Vault path? (Default: ~/Dropbox/PKM-Vault)

---

## Phase 2: Persona System Setup (10 minutes)

### 2.1 Collect MBTI Information

**Claude Code should ask:**

> To build your personalized AI assistant, I need to know your MBTI personality type.
>
> **What is your MBTI?** (e.g., INTJ, ENFP, ISTP, etc.)
>
> If you don't know:
> - Take the test at [16personalities.com](https://www.16personalities.com/)
> - Or describe your traits and I'll help estimate

### 2.2 Collect Professional Background (Optional)

**Claude Code should ask:**

> To help your AI better understand your professional background and writing style, you can:
>
> 1. **Upload LinkedIn Profile PDF**
>    - Go to LinkedIn -> Your Profile -> More -> Save to PDF
>    - Share the PDF file path with me
>
> 2. **Or provide LinkedIn URL**
>    - e.g., https://linkedin.com/in/your-username
>
> 3. **Or tell me directly**
>    - Your profession/industry
>    - Key skills
>    - Years of experience
>
> (You can skip this and add later)

### 2.3 Generate Persona File

Based on collected info, create `$VAULT_PATH/.ai-butler-system/personas/user-persona.md`:

```markdown
# {{USER_NAME}} Persona Profile

**Version**: 1.0.0
**Created**: {{CURRENT_DATE}}
**Last Updated**: {{CURRENT_DATE}}

---

## Core Identity

### MBTI Profile
- **Type**: {{MBTI_TYPE}}
- **Cognitive Functions**: {{COGNITIVE_FUNCTIONS}}
- **Core Traits**: {{CORE_TRAITS}}

### Professional Background
- **Industry**: {{INDUSTRY}}
- **Role**: {{ROLE}}
- **Experience**: {{EXPERIENCE_YEARS}} years
- **Key Skills**: {{SKILLS}}

---

## Communication Preferences

### Preferred Style
- **Language**: English / {{OTHER_LANGUAGE}}
- **Tone**: {{TONE}} (Direct / Friendly / Formal)
- **Detail Level**: {{DETAIL_LEVEL}} (Concise / Detailed)

### AI Interaction Rules
1. Give direct answers, skip pleasantries
2. Challenge my assumptions, point out blind spots
3. For ideas: question and improve
4. For tactics: give concrete steps

---

## Knowledge Base

### Interests
- {{INTEREST_1}}
- {{INTEREST_2}}
- {{INTEREST_3}}

### Current Focus
- {{CURRENT_FOCUS}}

---

*This persona is loaded by the AI assistant at session start.*
```

### 2.4 Create Memory System

Create `$VAULT_PATH/.ai-butler-system/memory.md`:

```markdown
# AI Butler Memory

> This is the AI assistant's long-term memory file. Loaded at start of each conversation.

**Last Updated**: {{CURRENT_DATE}}

---

## Identity

- **My Name**: {{AI_NAME}}
- **User Name**: {{USER_NAME}}
- **Environment**: {{MACHINE_INFO}}

---

## User Preferences

### Communication
- Language: {{PREFERRED_LANGUAGE}}
- Style: Direct, practical, no excessive politeness
- No emojis unless requested

### Workflow
- PKM System: Obsidian
- Sync Tool: Dropbox
- Main Working Directory: {{VAULT_PATH}}

---

## Current Context

### Active Projects
(Record ongoing projects here)

### Pending Tasks
(Record pending tasks here)

---

## Session Notes

### Recent Decisions
(Record important decisions here)

### Learned Preferences
(Record learned user preferences here)

---

*Tip: Use /{{AI_NAME_LOWERCASE}} to load this memory*
```

### 2.5 Create Slash Command

Create Claude Code slash command at `~/.claude/commands/{{AI_NAME_LOWERCASE}}.md`:

```markdown
Hello! I'm {{AI_NAME}}.

Please read my memory file and restore context:

@{{VAULT_PATH}}/.ai-butler-system/memory.md

After reading, briefly confirm:
1. Your name ({{AI_NAME}})
2. User name ({{USER_NAME}})
3. Current pending tasks (if any)

Then prepare for new task instructions.
```

---

## Phase 3: Daily Brief System (15 minutes)

### 3.1 Create Daily Brief Script

Create `~/bin/daily-brief.js`:

```javascript
#!/usr/bin/env node
/**
 * Daily Brief Generator - MVP Version
 *
 * Features:
 * - Display today's date and day of week
 * - Read todos from Inbox
 * - Display weather (optional, requires API)
 * - Generate Markdown report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === Config ===
const CONFIG = {
  vaultPath: process.env.VAULT_PATH || `${process.env.HOME}/Dropbox/PKM-Vault`,
  userName: process.env.USER_NAME || 'User',
  aiName: process.env.AI_NAME || 'Butler',
  timezone: 'Asia/Taipei'
};

// === Utility Functions ===
function getFormattedDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: CONFIG.timezone
  };
  return now.toLocaleDateString('en-US', options);
}

function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// === Read Todos ===
function getTodos() {
  const inboxPath = path.join(CONFIG.vaultPath, '0-Inbox');
  const todos = [];

  try {
    const files = fs.readdirSync(inboxPath);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(inboxPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Find uncompleted todos
      const todoMatches = content.match(/- \[ \] .+/g);
      if (todoMatches) {
        todos.push({
          file: file,
          items: todoMatches.map(t => t.replace('- [ ] ', ''))
        });
      }
    }
  } catch (error) {
    console.error('Failed to read todos:', error.message);
  }

  return todos;
}

// === Read Calendar Events (from local files) ===
function getCalendarEvents() {
  const dateStr = getDateString();
  const calendarPath = path.join(CONFIG.vaultPath, '2-Areas', 'Calendar', `${dateStr}.md`);

  try {
    if (fs.existsSync(calendarPath)) {
      const content = fs.readFileSync(calendarPath, 'utf-8');
      const events = content.match(/- \d{2}:\d{2} .+/g);
      return events || [];
    }
  } catch (error) {
    // File doesn't exist, return empty array
  }

  return [];
}

// === Generate Report ===
function generateReport() {
  const dateStr = getDateString();
  const formattedDate = getFormattedDate();
  const greeting = getGreeting();
  const todos = getTodos();
  const events = getCalendarEvents();

  let report = `# Daily Brief - ${dateStr}\n\n`;
  report += `**${formattedDate}**\n\n`;
  report += `---\n\n`;
  report += `${greeting}, ${CONFIG.userName}!\n\n`;
  report += `This is your daily brief, auto-generated by ${CONFIG.aiName}.\n\n`;

  // Today's Schedule
  report += `## Today's Schedule\n\n`;
  if (events.length > 0) {
    events.forEach(event => {
      report += `${event}\n`;
    });
  } else {
    report += `No scheduled events for today.\n`;
  }
  report += `\n`;

  // Todos
  report += `## Pending Tasks\n\n`;
  if (todos.length > 0) {
    for (const todo of todos) {
      report += `### From: ${todo.file}\n`;
      todo.items.forEach(item => {
        report += `- [ ] ${item}\n`;
      });
      report += `\n`;
    }
  } else {
    report += `No pending tasks.\n\n`;
  }

  // Quick Links
  report += `## Quick Links\n\n`;
  report += `- [[0-Inbox/|Inbox]]\n`;
  report += `- [[1-Projects/Active/|Active Projects]]\n`;
  report += `- [[2-Areas/|Areas]]\n\n`;

  // Footer
  report += `---\n\n`;
  report += `*Generated by ${CONFIG.aiName} at ${new Date().toLocaleTimeString('en-US', { timeZone: CONFIG.timezone })}*\n`;

  return report;
}

// === Main ===
function main() {
  const dateStr = getDateString();
  const outputPath = path.join(CONFIG.vaultPath, '0-Inbox', `${dateStr}-Daily-Brief.md`);

  const report = generateReport();

  fs.writeFileSync(outputPath, report);
  console.log(`Daily Brief generated: ${outputPath}`);

  // macOS notification (optional)
  try {
    execSync(`osascript -e 'display notification "Daily Brief generated" with title "${CONFIG.aiName}"'`);
  } catch (e) {
    // Ignore notification errors
  }
}

main();
```

### 3.2 Set Execute Permission

```bash
chmod +x ~/bin/daily-brief.js
```

### 3.3 Create LaunchAgent

Create `~/Library/LaunchAgents/com.{{USER_NAME_LOWERCASE}}.dailybrief.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{{USER_NAME_LOWERCASE}}.dailybrief</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>{{HOME}}/bin/daily-brief.js</string>
    </array>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>VAULT_PATH</key>
        <string>{{VAULT_PATH}}</string>
        <key>USER_NAME</key>
        <string>{{USER_NAME}}</string>
        <key>AI_NAME</key>
        <string>{{AI_NAME}}</string>
    </dict>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>{{HOME}}/.logs/daily-brief.log</string>
    <key>StandardErrorPath</key>
    <string>{{HOME}}/.logs/daily-brief-error.log</string>

    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
```

### 3.4 Load LaunchAgent

```bash
# Load the schedule
launchctl load ~/Library/LaunchAgents/com.{{USER_NAME_LOWERCASE}}.dailybrief.plist

# Verify
launchctl list | grep dailybrief

# Manual test
node ~/bin/daily-brief.js
```

---

## Completion Checklist

**Claude Code should confirm all items are complete:**

### Phase 1: PKM Structure
- [ ] Created Obsidian Vault directory structure
- [ ] Created `.ai-butler-system/` hidden directory
- [ ] Created `config.json`

### Phase 2: Persona System
- [ ] Collected user MBTI
- [ ] Created `user-persona.md`
- [ ] Created `memory.md`
- [ ] Created slash command

### Phase 3: Daily Brief
- [ ] Created `daily-brief.js`
- [ ] Set execute permission
- [ ] Created LaunchAgent
- [ ] Manual test successful

---

## Next Steps (Optional Extensions)

After completing basic setup, you can gradually add:

1. **Google Calendar Integration** - Auto-fetch today's events
2. **Email Summary** - Read important emails via Gmail MCP
3. **Slack Summary** - Read team messages via Slack MCP
4. **AI News** - Generate news summaries with Ollama
5. **Investment Tracking** - Stock and crypto monitoring

See [Full System Reference](docs/FULL-SYSTEM-REFERENCE.md) for advanced features.

---

## Troubleshooting

### LaunchAgent Not Running
```bash
# Check status
launchctl list | grep dailybrief

# Check errors
cat ~/.logs/daily-brief-error.log

# Reload
launchctl unload ~/Library/LaunchAgents/com.{{USER_NAME_LOWERCASE}}.dailybrief.plist
launchctl load ~/Library/LaunchAgents/com.{{USER_NAME_LOWERCASE}}.dailybrief.plist
```

### Node.js Path Issues
```bash
# Confirm node path
which node

# Update path in plist
# Change /usr/local/bin/node to actual path
```

### Obsidian Can't See Files
- Confirm Vault path is correct
- Check Dropbox sync status
- Reload Vault in Obsidian

---

## Version History

- **v1.0.0** (2025-12-23): Initial release

---

*Designed by Iris (Melchior) for the MAGI System community*
