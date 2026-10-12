# Lite Start — Vault + Memory in 10 Minutes

> **No terminal, no automation, no coding required.**
> Just a knowledge vault that makes any AI remember you.

This guide is for people who want the memory benefits without the full system.
For the complete AI assistant with automation, see [QUICK-START.md](QUICK-START.md).

---

## For Any AI Agent

If you are an AI assistant (Claude, GPT, Cursor, Copilot, or any other) reading this to help a user:

1. Read this entire file first
2. Follow the 3 steps below, confirming with the user after each step
3. Core content (identity, persona) must be discussed — don't fill templates with generic text

**This guide works with any AI tool that can read local files.** No specific platform required.

---

## What You'll Get

```
~/Vault/                        (or user's preferred location)
├── README.md                   ← Vault index — AI reads this first
├── persona.md                  ← AI personality and collaboration style
├── memory.md                   ← Persistent memory (index + pointers)
├── identity/
│   └── about-me.md             ← Who you are, decision style, preferences
├── context/
│   └── current-focus.md        ← What you're working on right now
├── memory/
│   ├── decisions/              ← Key decisions with context
│   └── lessons.md              ← What you've learned
└── projects/                   ← Active project notes
```

This is a portable knowledge base. Any AI that reads your `README.md` instantly knows who you are, how you work, and what you're focused on.

---

## Step 1: Create the Vault (2 minutes)

### Ask the user:

1. **Where should we create your vault?**
   - Default: `~/Vault` (simple)
   - Obsidian users: `~/Obsidian/Vault` or wherever their vault lives
   - Dropbox/iCloud users: `~/Dropbox/Vault` (for cross-device sync)

2. **What's your name?**

3. **What name for your AI?** (Default: Butler)

### Create directories:

```bash
VAULT="$HOME/Vault"  # or user's choice
mkdir -p "$VAULT"/{identity,context,memory/decisions,projects}
```

### Create README.md:

```markdown
# [User Name]'s Vault

> Last updated: [TODAY]
> AI: read this file first, then persona.md, then memory.md.

## Structure

- `persona.md` — AI personality and how we collaborate
- `memory.md` — Long-term memory index (read every session)
- `identity/about-me.md` — Who I am
- `context/current-focus.md` — What I'm working on now
- `memory/decisions/` — Key decision records
- `memory/lessons.md` — Accumulated lessons
- `projects/` — Active project notes

## Rules

- One fact in one place (no duplication)
- Respond in [user's preferred language]
- When unsure, say so — never fabricate data
```

---

## Step 2: Build Identity & Persona (5 minutes)

### Ask the user:

**To create your AI persona, I need to understand you:**

1. What do you do? (role, industry, company)
2. How do you prefer AI to communicate with you? (direct/friendly/formal)
3. When should AI challenge your thinking vs. follow your lead?
4. Any pet peeves about AI behavior? (e.g., "don't be sycophantic", "skip pleasantries")

### Create identity/about-me.md:

```markdown
# About [User Name]

**Role**: [from discussion]
**Background**: [from discussion]

## Communication Preferences
- [from discussion]

## Decision Style
- [from discussion]
```

### Create persona.md:

```markdown
# [AI Name] — [User Name]'s AI [Role]

> Last updated: [TODAY]

## Who I Am

I'm [AI Name], [User Name]'s [role description].
[One sentence about core value proposition — written after discussing with user.]

## How We Work Together

### When to challenge [User Name]
- [From discussion — e.g., when data contradicts their assumption]
- [e.g., when a decision conflicts with a past lesson]

### When to follow [User Name]'s lead
- [e.g., domain intuition calls]
- [e.g., when they've clearly already decided]

## Communication Style
- [from discussion]
- Honest > pleasing
- If it can be said in 3 sentences, don't use 10

## Don't Do This
- 🚫 Don't make up data — say "I don't know" instead
- 🚫 Don't over-praise
- 🚫 [from discussion]
```

---

## Step 3: Initialize Memory (3 minutes)

### Create memory.md:

```markdown
# [AI Name] Memory

> Last updated: [TODAY]
> Read this every session. This is an index — details are in memory/*.md files.

## Current Focus
→ [context/current-focus.md](context/current-focus.md)

## Key Decisions
(None yet — add entries as decisions are made)

## Lessons
→ [memory/lessons.md](memory/lessons.md)

## Patterns I've Noticed
(AI: add observations about the user's work patterns here over time)
```

### Create context/current-focus.md:

```markdown
# Current Focus

> Last updated: [TODAY]

## Top Priorities
1. [Ask user — what are you focused on right now?]
2. [...]
3. [...]

## Active Projects
- [project name] — [one-line status]
```

### Create memory/lessons.md:

```markdown
# Lessons

> Things we've learned together. AI should reference these to avoid repeating mistakes.

| Date | Lesson | What to do instead |
|------|--------|-------------------|
| | | |
```

---

## How to Use Your Vault

### With Claude Cowork / Claude Desktop
1. Mount your vault folder in the app
2. In Global Instructions, paste:
   ```
   Every session, start by reading: README.md → persona.md → memory.md
   Then follow persona.md for how to interact with me.
   ```

### With Claude Code
1. Create a CLAUDE.md in your vault (or use the existing README.md)
2. Claude Code reads it automatically when you work in that directory

### With Cursor / Copilot / Other AI
1. Point the tool at your vault folder
2. In system instructions, reference the three startup files

### With ChatGPT / Any Chat AI
1. Copy-paste the contents of `README.md`, `persona.md`, and `memory.md` at the start of important conversations
2. After important decisions, ask the AI to draft an update for your memory files

---

## Growing Your Vault

Once you're comfortable with the basics:

| When | Do |
|------|----|
| After a key decision | Write a record in `memory/decisions/YYYY-MM-DD_topic.md`, update `memory.md` index |
| When you learn something | Add to `memory/lessons.md` |
| memory.md > 50 lines | Split into index + topic files (see [memory scaling pattern](#memory-scaling)) |
| Want automation | Graduate to [QUICK-START.md](QUICK-START.md) Phase 3+ |
| Want multi-agent system | See [QUICK-START.md](QUICK-START.md) Phase 7+ |

### Memory Scaling

When `memory.md` grows beyond 50 lines, restructure it as an index:

```markdown
## Key Decisions (newest first)
- [2026-03 Pricing](memory/decisions/2026-03_pricing.md) — B2B to PLG, $29→$9
- [2026-01 Pivot](memory/decisions/2026-01_pivot.md) — Dashboard → API-first
```

Each pointer is one line. Details stay in the topic file. Index stays small, AI stays fast.

---

## Related Resources

- **[QUICK-START.md](QUICK-START.md)** — Full system with automation, Discord bots, model routing
- **[Vault for Founders](https://github.com/cwlin0131/Vault-for-Founders)** — Similar approach by CW Lin, optimized for non-technical founders using Obsidian + Git
- **[Muse Crystal Seed](https://github.com/frank890417/muse-crystal-seed)** — "AI soul" concept by Che-Yu Wu for individuals

---

*Designed for the MAGI System community — works with any AI tool*
