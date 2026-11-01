# Changelog

All notable changes to the Iris System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-06-23

### Changed
- Refocused the repo as a public onboarding guide — removed the private system implementation (dashboard, automation scripts, vision tools, full-system reference) that was specific to one user's machine.
- QUICK-START rewritten to v3.0: now works with **Claude Code or Codex** (dual-engine substitution table).

### Removed
- Personal paths, emails, and internal names from all public-facing files.

## [3.1.0] - 2026-02-16

### Changed
- QUICK-START rewritten to v2.0 with a 5-layer architecture overview (User → Agent → Memory → Model → Runtime) and clearer phased setup.

### Added
- 3-layer memory infrastructure setup, model router instructions, and local RAG (BM25 + vector + reranking) search.
- Growth Path table (L1→L4) and improved troubleshooting with health checks.

## [3.0.0] - 2025-12-06

### Added
- Persistent cross-session memory concept for the agent: an AI-curated memory layer with session priming and importance weighting, surfaced through Claude Code hooks (`SessionStart`, `UserPromptSubmit`, `PreCompact`, `Stop`).

## [2.7.0] - 2025-11-23

### Added
- Documented a dual-AI development workflow (Claude Code for backend/debugging/deployment, a generative IDE for UI/rapid prototyping) and applied it to a sample side project.

## [2.6.0] - 2025-11-21

### Added
- Cross-machine task collaboration via a shared file queue with auto-execution and status tracking. (Removed in 4.0.0.)

## [2.5.0] - 2025-11-17

### Added
- Semantic memory layer using vector search for fast cross-session retrieval. (Removed in 4.0.0.)

## [2.1.0] - 2025-11-01

### Added
- Vision tools letting the agent capture and analyze the screen for proactive assistance. (Removed in 4.0.0.)

## [2.0.0] - 2025-11-01

### Added
- One-click installer (`iris-install.sh`) that turns Iris from a personal setup into a distributable package: system requirement checks, interactive configuration, and MCP server auto-installation.
- Module system with a registry and module manager for selecting which components to install.
- Templates (memory, slash command) and an installation guide.

### Changed
- **Breaking:** major version bump (1.5.0 → 2.0.0) — Iris becomes a complete installable system rather than a collection of scripts.

## [1.5.0] - 2025-11-01

### Added
- Browser automation capabilities through MCP, enabling form filling, content extraction, and web-based workflows. (Removed in 4.0.0.)

## [1.1.0] - 2025-11-01

### Added
- Web dashboard and control panel for monitoring and scheduling automation tasks. (Removed in 4.0.0.)

## [1.0.0] - 2025-11-01

### Added
- Initial release: MAGI System architecture documentation, the three personas (Melchior, Balthasar, Caspar), memory system docs, the slash command system, and API integration guides (MCP, Gmail, Slack, Calendar).
- Templates (slash command, memory, persona) and worked examples (daily brief, automation).

---

## Format

### Types of Changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities
