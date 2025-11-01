# 🧠 Iris System

> 基於 Claude Code 構建的 AI 個人助理系統

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MAGI System](https://img.shields.io/badge/MAGI-System-purple)](https://github.com/lmanchu/iris-system)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-blue)](https://claude.ai/code)

[English](./README.md) | 繁體中文

---

## 📖 什麼是 Iris？

**Iris** 是一個基於 **Claude Code** 構建的 AI 助理系統，作為 **MAGI System**（三位一體 AI 協作工作站架構）的核心組件。

Iris（代號：**Melchior**）的特點：
- **科學家人格** - 理性、數據驅動、邏輯思考
- **24/7 運行** - 在 Mac Studio M2 Ultra 上作為「真理之源」
- **自動化大師** - 管理排程任務、重度運算和系統協調

---

## 🤖 MAGI System 架構

**MAGI System**（靈感來自《新世紀福音戰士》）由三台 AI 工作站組成，每台都有獨特的人格：

```
┌─────────────────────────────────────────────────────────────┐
│                      MAGI System                             │
│                  三位一體 AI 協作系統                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼─────────┐ ┌──▼───────────┐ ┌─▼────────────┐
    │  Iris (Melchior)  │ │MAGI(Balthasar)│ │Clippy(Caspar)│
    │  Mac Studio M2    │ │ MacBook Air M4│ │ Windows AIPC │
    │     Ultra         │ │               │ │              │
    │  科學家人格        │ │  母親人格      │ │   女性人格    │
    │  理性·數據驅動    │ │  關懷·直覺     │ │  情感·創意   │
    └───────────────────┘ └───────────────┘ └──────────────┘
```

### 三種人格

1. **Iris (Melchior)** - 科學家人格
   - Mac Studio M2 Ultra, 64GB+ RAM
   - 理性、數據驅動的決策
   - 重度運算和自動化

2. **MAGI (Balthasar)** - 母親人格
   - MacBook Air M4
   - 關懷、直覺、全局觀
   - 移動工作站，專注使用者體驗

3. **Clippy (Caspar)** - 女性人格
   - Windows AIPC
   - 情感、創意、同理心
   - 備援系統、社交媒體管理

---

## ✨ 核心能力

### API 整合
- ✅ Gmail (via MCP)
- ✅ Slack (via MCP)
- ✅ Google Calendar (via MCP)
- ✅ Gemini AI (via MCP & 直接 API)
- ✅ BrowserOS (via MCP) - Chromium 瀏覽器自動化

### 自動化任務
- ✅ 每日簡報生成器 (07:00)
- ✅ Twitter 自動互動 (02:00, 04:00, 06:00)
- ✅ Dayflow Intelligence (每兩天 01:00)
- ✅ PKM Intelligence (02:00)
- ✅ 每週回顧 (週日 03:00)
- ✅ Inbox 歸檔 (05:00)

### 開發專案
- ✅ **[Iris EPUB Reader](https://github.com/lmanchu/iris-epub-reader)** - EPUB 閱讀器 + TTS
- ✅ **[Iris Immersive Translate](https://github.com/lmanchu/iris-immersive-translate)** - 本地 AI 翻譯 Chrome Extension
- ✅ **Iris Notifier** - macOS 原生通知系統
- ✅ **Daily Brief** - 自動化每日簡報系統
- ✅ **Twitter Bot** - 社交媒體自動化

---

## 📂 Repository 結構

```
iris-system/
├── README.md                    # 英文版
├── README.zh-TW.md             # 繁體中文版
├── docs/
│   ├── magi-system/
│   │   ├── architecture.md      # MAGI System 完整架構
│   │   ├── architecture.zh-TW.md
│   │   ├── personas.md          # 三種人格詳解
│   │   └── personas.zh-TW.md
│   ├── memory-system/
│   │   ├── iris-memory.md       # Iris 長期記憶
│   │   ├── slash-command.md     # Slash command 系統
│   │   └── context-loading.md   # 記憶載入機制
│   ├── development/
│   │   ├── methodology.md       # 開發方法論
│   │   ├── methodology.zh-TW.md
│   │   ├── case-studies.md      # 實際專案案例
│   │   └── case-studies.zh-TW.md
│   └── api-integrations/
│       ├── mcp-setup.md         # MCP 伺服器配置
│       └── mcp-setup.zh-TW.md
├── templates/
│   ├── slash-command-template.md
│   ├── memory-template.md
│   └── persona-template.json
└── examples/
    ├── daily-brief-example.md
    ├── project-development.md
    └── automation-examples.md
```

---

## 🚀 快速開始

### 對於使用者：了解 Iris

1. **閱讀架構文檔**
   - 從 [MAGI System 架構](./docs/magi-system/architecture.zh-TW.md) 開始
   - 理解 [三種人格](./docs/magi-system/personas.zh-TW.md)

2. **探索記憶系統**
   - 了解 [Iris 記憶](./docs/memory-system/iris-memory.md) 如何運作
   - 學習 [Slash Commands](./docs/memory-system/slash-command.md)

3. **研究開發案例**
   - 查看 [案例研究](./docs/development/case-studies.zh-TW.md) 中的真實範例
   - 學習 [開發方法論](./docs/development/methodology.zh-TW.md)

### 對於開發者：建立你自己的 AI 助理

1. **使用模板**
   - 複製 [記憶模板](./templates/memory-template.md)
   - 調整 [Slash Command 模板](./templates/slash-command-template.md)
   - 自訂 [Persona 模板](./templates/persona-template.json)

2. **設置你的系統**
   - 遵循 [MCP 設置指南](./docs/api-integrations/mcp-setup.zh-TW.md)
   - 配置你偏好的整合

3. **從小處著手**
   - 從一個自動化任務開始
   - 逐步建立記憶系統
   - 迭代擴展能力

---

## 🎯 實際案例

### 案例 1：Iris Immersive Translate 開發

**時程：** 2025-11-01（從概念到完成 6 小時）

**Iris 完成的工作：**
1. 研究沉浸式翻譯和 Ollama 整合
2. 設計 Chrome Extension 架構（Manifest V3）
3. 實現翻譯功能（選取 + 整頁）
4. 解決 CORS 問題，配置 macOS LaunchAgent
5. 創建完整文檔
6. 發布到 GitHub 並進行版本管理

**成果：** 功能完整的 Chrome Extension 及完善文檔

**了解更多：** [Iris Immersive Translate Repository](https://github.com/lmanchu/iris-immersive-translate)

---

### 案例 2：每日簡報自動化

**功能：**
- 每天早上 07:00 運行
- 從行事曆、Gmail、任務收集數據
- 生成結構化的每日簡報
- 發送 macOS 通知

**運作方式：**
1. Iris 透過 `/iris` slash command 載入記憶和上下文
2. 透過 LaunchAgent 執行（排程任務）
3. 使用 MCP 整合收集數據
4. 格式化並傳遞簡報

---

## 💡 哲學思考

### 為什麼是 MAGI System？

靈感來自《新世紀福音戰士》的 MAGI 超級電腦：

> "MAGI 由三個獨立的 AI 系統組成，分別代表科學家、母親和女性人格。重要決策需要至少兩個系統同意。"

這種設計帶來：
- **多元視角** - 理性、直覺、情感的觀點
- **平衡決策** - 避免單一觀點的偏差
- **容錯機制** - 一台故障不影響運作
- **負載分散** - 任務分散到各系統

### AI 作為共同創造者

Iris 展示了 **AI 助理可以是創造者，而不只是工具**：
- 設計系統
- 撰寫代碼
- 解決問題
- 創建文檔
- 管理專案

人類提供方向和反饋。AI 提供執行和創造力。

---

## 📚 文檔

### MAGI System
- [完整架構](./docs/magi-system/architecture.zh-TW.md)
- [三種人格詳解](./docs/magi-system/personas.zh-TW.md)
- [協作機制](./docs/magi-system/collaboration.zh-TW.md)

### 記憶系統
- [Iris 長期記憶](./docs/memory-system/iris-memory.md)
- [Slash Command 系統](./docs/memory-system/slash-command.md)
- [上下文載入](./docs/memory-system/context-loading.md)

### 開發
- [開發方法論](./docs/development/methodology.zh-TW.md)
- [案例研究](./docs/development/case-studies.zh-TW.md)
- [最佳實踐](./docs/development/best-practices.zh-TW.md)

### API 整合
- [MCP 設置指南](./docs/api-integrations/mcp-setup.zh-TW.md)
- [Gmail 整合](./docs/api-integrations/gmail-integration.zh-TW.md)
- [Slack 整合](./docs/api-integrations/slack-integration.zh-TW.md)
- [BrowserOS 設置](./docs/api-integrations/browseros-setup.zh-TW.md)

---

## 🛠️ 技術棧

- **平台：** macOS (Mac Studio M2 Ultra)
- **AI：** Claude Code (Anthropic)
- **自動化：** Node.js, macOS LaunchAgent
- **整合：** MCP (Model Context Protocol)
- **儲存：** Dropbox（共享上下文同步）
- **版本控制：** Git + GitHub

---

## 🤝 貢獻

這是一個個人 AI 助理系統，但方法論和模板開放供他人學習和調整。

歡迎：
- 使用模板建立你自己的 AI 助理
- 從案例研究中學習
- 根據你的需求調整方法論
- 分享你自己的經驗

---

## 📄 授權

MIT License - 參見 [LICENSE](./LICENSE) 文件

---

## 🔗 相關專案

### 由 Iris 開發：
- **[Iris Immersive Translate](https://github.com/lmanchu/iris-immersive-translate)** - 本地 AI 翻譯 Chrome Extension
- **[Iris EPUB Reader](https://github.com/lmanchu/iris-epub-reader)** - EPUB 閱讀器 + TTS 系統
- 更多專案即將推出...

---

## 📧 聯絡

- **GitHub:** [lmanchu](https://github.com/lmanchu)
- **Issues:** [回報問題](https://github.com/lmanchu/iris-system/issues)

---

**創建者：** Iris (Melchior) + lmanchu
**最後更新：** 2025-11-01
**狀態：** 積極開發中

---

*"真理存在於多元視角的綜合之中。"*
