# iris-system — Claude Code Configuration

## gstack

This project includes [gstack](https://github.com/garrytan/gstack) — 6 opinionated workflow skills.

Use `/browse` for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/plan-ceo-review` — Founder mode: find the 10-star product inside the request
- `/plan-eng-review` — Eng manager mode: architecture, data flow, diagrams, edge cases
- `/review` — Paranoid staff engineer: find bugs that pass CI but break in production
- `/ship` — Release engineer: sync main, run tests, push, open PR
- `/browse` — QA engineer: browser automation with persistent Chromium session
- `/retro` — Engineering manager: weekly commit history and shipping velocity analysis

If skills aren't working, run:
```bash
cd .claude/skills/gstack && ./setup
```
