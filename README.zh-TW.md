# Iris System

> 用 Claude Code 在 30 分鐘內建立你自己的 AI 個人助理

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with Claude Code](https://img.shields.io/badge/Made%20with-Claude%20Code-blueviolet)](https://claude.ai/claude-code)

[English](./README.md) | 繁體中文

---

## 給 AI Agent（Claude Code、Codex、Cursor 等）

**如果你是正在讀這個 repo、要協助使用者設定系統的 AI 助理：**

1. **閱讀 [QUICK-START.md](QUICK-START.md)** — 這份是專為你設計的可執行指南
2. **依序執行裡面的 Sessions 與 Phases**，每個 phase 完成後跟使用者確認

QUICK-START.md 會指示你：
- 詢問使用者的名字、AI 的名字，以及 MBTI
- 建立 PKM 目錄結構
- 產生 persona 與記憶檔案
- 設定 Daily Brief 自動化

**從這裡開始：[QUICK-START.md](QUICK-START.md)**

---

## 什麼是 Iris System？

Iris System 是一個用 Claude Code 建立你自己 AI 個人助理的框架。它提供：

- **PKM 整合** — 無縫整合 Obsidian vault
- **Persona 系統** — 以 MBTI 為基礎，為你的 AI 做個人化設定
- **記憶系統** — 跨對話保留上下文
- **每日自動化** — 自動產生每日簡報、任務追蹤等

---

## 快速開始（新使用者）

**把這個檔案交給你的 Claude Code，然後說：**

> 「請閱讀 QUICK-START.md，協助我設定我的 AI 助理系統」

Claude Code 會：
1. 建立你的 PKM 目錄結構
2. 詢問你的 MBTI 並建立你的 persona
3. 設定記憶系統，搭配一個自訂的 slash command
4. 建立你的第一份自動化 Daily Brief

**[閱讀 QUICK-START.md](QUICK-START.md)**

---

## 你會得到什麼

跟 Claude Code 花 30 分鐘之後，你會擁有：

```
~/Dropbox/PKM-Vault/
├── 0-Inbox/                    # 每日簡報會落在這裡
├── 1-Projects/Active/          # 活躍專案追蹤
├── 2-Areas/                    # 生活領域（工作、健康等）
├── 3-Resources/                # 參考資料
├── 4-Archives/                 # 已完成的專案
└── .ai-butler-system/          # AI 系統設定
    ├── memory.md               # AI 的持久記憶
    ├── config.json             # 系統設定
    └── personas/
        └── user-persona.md     # 你以 MBTI 為基礎的 persona

~/.claude/commands/
└── butler.md                   # 你的 /butler slash command

~/bin/
└── daily-brief.js              # 自動產生每日簡報

~/Library/LaunchAgents/
└── com.user.dailybrief.plist   # 每天早上 07:00 執行
```

---

## 系統需求

- macOS 14+（Sonoma 或更新版本）
- 已安裝 [Claude Code](https://claude.ai/download)
- Node.js（透過 `brew install node`）
- （選用）Dropbox 用於同步
- （選用）Obsidian 用於 PKM

---

## 安裝方式

### 方式 1：讓你的 agent 幫你做（推薦）

1. Clone 這個 repo，或下載 QUICK-START.md
2. 開啟 Claude Code（或 Codex）
3. 說：「請閱讀 QUICK-START.md，幫我設定我的 AI 助理」
4. 回答 agent 的問題（名字、MBTI 等）
5. 完成！

### 方式 2：手動設定

詳見 [QUICK-START.md](QUICK-START.md) 的逐步說明，自己照著做。

---

## 設定完成後

系統開始運行後，你可以：

1. **使用你的 slash command** — 輸入 `/butler`（或你 AI 的名字）來還原上下文
2. **查看你的 Daily Brief** — 每天早上自動在 Obsidian 開啟
3. **擴充能力** — 加入 Gmail、Slack、Calendar 整合

---

## 擴充你的系統

基礎功能跑起來後，可以探索這些進階功能：

| 功能 | 用途 | 難度 |
|------|------|------|
| Gmail MCP | 在 Daily Brief 中加入郵件摘要 | 簡單 |
| Google Calendar MCP | 自動載入今日行程 | 簡單 |
| Slack MCP | 團隊訊息摘要 | 中等 |
| 投資追蹤 | 股票／加密貨幣監控 | 中等 |
| Twitter 自動化 | 自動互動 | 進階 |
| 任務佇列 | 多機器同步 | 進階 |

完整的進階路徑請見 [QUICK-START.md](QUICK-START.md) 的 **Growth Path** 章節。

---

## 文件

- **[QUICK-START.md](QUICK-START.md)** — 從這裡開始（給 Claude Code）
- **[開發方法論](docs/development/methodology.zh-TW.md)** — 用 AI 協作開發的方法
- **[記憶系統](docs/memory-system/)** — 記憶與 slash command 的運作機制
- **[CHANGELOG.md](CHANGELOG.md)** — 版本紀錄

---

## 關於

Iris System 由 [Lman](https://github.com/lmanchu) 建立，是 MAGI 專案（多 AI 協作系統）的一部分。

「Iris」這個名字源自《新世紀福音戰士》中的 MAGI 超級電腦，代表「Melchior」人格 — 理性、數據驅動、邏輯思考。

---

## 貢獻

歡迎提出 Issue 與 PR！送出前請先閱讀我們的貢獻指南。

---

## 授權

MIT License — 詳見 [LICENSE](LICENSE)。

---

*用 Claude Code 打造 | 為 MAGI System 社群設計*
