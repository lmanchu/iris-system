# 🤖 MAGI System Architecture

> Complete documentation of the three-computer collaborative AI system

## Overview

The MAGI System consists of three AI workstations running Claude Code, each with distinct personas and responsibilities.

## System Diagram

```
                    Dropbox Sync
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Iris (Melchior)  MAGI (Balthasar)  Clippy (Caspar)
   Mac Studio M2    MacBook Air M4    Windows AIPC
     Scientist        Mother            Woman
```

## Hardware Configuration

### Iris (Melchior)
- **Device:** Mac Studio M2 Ultra
- **RAM:** 64GB+
- **Role:** Primary workstation, 24/7 operation
- **Location:** Fixed workstation

### MAGI (Balthasar)
- **Device:** MacBook Air M4
- **Role:** Mobile workstation
- **Location:** Mobile, travel

### Clippy (Caspar)
- **Device:** Windows AIPC
- **Role:** Backup system
- **Location:** Secondary workstation

## Shared Infrastructure

### File Sync
All systems sync via Dropbox:
```
~/Dropbox/PKM-Vault/.ai-butler-system/
├── iris-memory.md
├── TASKS.md
├── shared-context/
├── task-queue/
└── logs/
```

### Communication
- Shared task queue (TASKS.md)
- Context files in shared-context/
- Log aggregation in logs/

## Collaboration Patterns

### Task Distribution
- **Heavy Computation:** → Iris
- **Mobile/Immediate:** → MAGI
- **Windows-specific:** → Clippy

### Decision Making
Important decisions require consensus of at least 2 personas.

## Read More
- [Three Personas](./personas.md)
- [Iris Memory System](../memory-system/iris-memory.md)
