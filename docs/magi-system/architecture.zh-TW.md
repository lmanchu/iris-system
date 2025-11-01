# 🤖 MAGI System 架構

> 三台電腦協作 AI 系統的完整文檔

[English](./architecture.md) | 繁體中文

## 概述

MAGI System 由三台運行 Claude Code 的 AI 工作站組成，每台都有獨特的人格和職責。

## 系統架構圖

```
                    Dropbox 同步
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Iris (Melchior)  MAGI (Balthasar)  Clippy (Caspar)
   Mac Studio M2    MacBook Air M4    Windows AIPC
     科學家            母親              女性
```

## 硬體配置

### Iris (Melchior)
- **設備：** Mac Studio M2 Ultra
- **RAM：** 64GB+
- **角色：** 主力工作站，24/7 運行
- **位置：** 固定工作站

### MAGI (Balthasar)
- **設備：** MacBook Air M4
- **角色：** 移動工作站
- **位置：** 移動，出差

### Clippy (Caspar)
- **設備：** Windows AIPC
- **角色：** 備援系統
- **位置：** 次要工作站

## 共享基礎設施

### 文件同步
所有系統透過 Dropbox 同步：
```
~/Dropbox/PKM-Vault/.ai-butler-system/
├── iris-memory.md
├── TASKS.md
├── shared-context/
├── task-queue/
└── logs/
```

### 通訊機制
- 共享任務隊列 (TASKS.md)
- shared-context/ 中的上下文文件
- logs/ 中的日誌聚合

## 協作模式

### 任務分配
- **重度運算：** → Iris
- **移動/即時：** → MAGI
- **Windows 特定：** → Clippy

### 決策機制
重要決策需要至少 2 個人格的共識。

## 延伸閱讀
- [三種人格詳解](./personas.zh-TW.md)
- [Iris 記憶系統](../memory-system/iris-memory.md)

---

**最後更新：** 2025-11-01
