# MAGI System Installation Guide

**版本**: v2025-11-16
**生成時間**: 2025-11-15T16:30:05.226Z
**記憶檔案版本**: 2025-11-15 (v1.9.1 - 硬體規格修正)

---

## 📋 系統概述

這是 MAGI System (Iris/Melchior) 的完整安裝指南。此文件由系統每週日半夜自動生成，包含當前所有系統配置、自動化腳本和依賴項的完整快照。

### 系統角色

- **Iris (Melchior)** - Mac Studio M2 Max
  - 主力工作站，負責重度運算和自動化排程
  - 24/7 運行，作為「真理之源」(Source of Truth)
  - 運行所有定時任務和自動化腳本

---

## 💻 硬體資訊

```
Model Name: Mac Studio
      Model Identifier: Mac14,13
      Model Number: Z17Z0019PTA/A
      Chip: Apple M2 Max
      Memory: 96 GB
```

**macOS 版本**: 26.2

---

## 🔧 軟體環境

### 核心運行環境

- **Node.js**: v24.10.0
- **npm**: 11.6.1
- **Shell**: bash/zsh (macOS 預設)

### 必要工具

- **Homebrew**: 套件管理器
- **Claude Code CLI**: AI 助手整合
- **Dropbox**: 文件同步（MAGI System 協作核心）
- **Obsidian**: PKM 系統（可選）

---

## 🤖 LaunchAgents 清單

共 42 個定時任務：

### 1. com.lman.appstore-monitor.plist

**檔案**: `com.lman.appstore-monitor.plist`
**排程**: 每日 20:00


### 2. com.lman.chrome-extension-monitor

**檔案**: `com.lman.chrome-extension-monitor.plist`
**排程**: 每日 21:00


### 3. com.lman.daily-investment-evening

**檔案**: `com.lman.daily-investment-evening.plist`
**排程**: 每日 17:00


### 4. com.lman.daily-investment-morning

**檔案**: `com.lman.daily-investment-morning.plist`
**排程**: 每日 5:00


### 5. com.lman.dailybrief

**檔案**: `com.lman.dailybrief.plist`
**排程**: 每日 6:30


### 6. com.lman.dayflow-archiver

**檔案**: `com.lman.dayflow-archiver.plist`
**排程**: 每日 3:00


### 7. com.lman.dayflow-intelligence

**檔案**: `com.lman.dayflow-intelligence.plist`
**排程**: 每日 1:00


### 8. com.lman.gdocs-sync.plist

**檔案**: `com.lman.gdocs-sync.plist`
**排程**: 每日 9:00


### 9. com.lman.inbox-archiver

**檔案**: `com.lman.inbox-archiver.plist`
**排程**: 每日 5:00


### 10. com.lman.investment-analyst

**檔案**: `com.lman.investment-analyst.plist`
**排程**: Unknown


### 11. com.lman.investment-archiver

**檔案**: `com.lman.investment-archiver.plist`
**排程**: 每日 6:00


### 12. com.lman.iris-cleanup

**檔案**: `com.lman.iris-cleanup.plist`
**排程**: 每日 3:00


### 13. com.lman.iris-pkm-archive

**檔案**: `com.lman.iris-pkm-archive.plist`
**排程**: 每日 23:30


### 14. com.lman.iris-vision-daemon

**檔案**: `com.lman.iris-vision-daemon.plist`
**排程**: Unknown


### 15. com.lman.irisgo-docs-sync

**檔案**: `com.lman.irisgo-docs-sync.plist`
**排程**: 每 72 小時


### 16. com.lman.linkedin-curator-09

**檔案**: `com.lman.linkedin-curator-09.plist`
**排程**: 每日 9:00


### 17. com.lman.linkedin-curator-17

**檔案**: `com.lman.linkedin-curator-17.plist`
**排程**: 每日 17:00


### 18. com.lman.linkedin-curator-post-0

**檔案**: `com.lman.linkedin-curator-post-0.plist`
**排程**: 每日 9:30


### 19. com.lman.linkedin-curator-post-1

**檔案**: `com.lman.linkedin-curator-post-1.plist`
**排程**: 每日 14:45


### 20. com.lman.linkedin-curator-post-2

**檔案**: `com.lman.linkedin-curator-post-2.plist`
**排程**: 每日 18:20


### 21. com.lman.linkedin-curator-reply-0

**檔案**: `com.lman.linkedin-curator-reply-0.plist`
**排程**: 每日 10:15


### 22. com.lman.linkedin-curator-reply-1

**檔案**: `com.lman.linkedin-curator-reply-1.plist`
**排程**: 每日 11:45


### 23. com.lman.linkedin-curator-reply-2

**檔案**: `com.lman.linkedin-curator-reply-2.plist`
**排程**: 每日 13:20


### 24. com.lman.linkedin-curator-reply-3

**檔案**: `com.lman.linkedin-curator-reply-3.plist`
**排程**: 每日 15:30


### 25. com.lman.linkedin-curator-reply-4

**檔案**: `com.lman.linkedin-curator-reply-4.plist`
**排程**: 每日 16:50


### 26. com.lman.linkedin-curator-reply-5

**檔案**: `com.lman.linkedin-curator-reply-5.plist`
**排程**: 每日 19:15


### 27. com.lman.magi-snapshot

**檔案**: `com.lman.magi-snapshot.plist`
**排程**: 每日 0:30


### 28. com.lman.magi-sync

**檔案**: `com.lman.magi-sync.plist`
**排程**: 每日 0:00


### 29. com.lman.meeting-prep

**檔案**: `com.lman.meeting-prep.plist`
**排程**: 每日 4:00


### 30. com.lman.persona-updater

**檔案**: `com.lman.persona-updater.plist`
**排程**: 每日 1:30


### 31. com.lman.pkm-intelligence

**檔案**: `com.lman.pkm-intelligence.plist`
**排程**: 每日 2:00


### 32. com.lman.scheduled-tasks-updater

**檔案**: `com.lman.scheduled-tasks-updater.plist`
**排程**: 每日 3:30


### 33. com.lman.slack-summary

**檔案**: `com.lman.slack-summary.plist`
**排程**: 每日 8:00


### 34. com.lman.social-media-tracker

**檔案**: `com.lman.social-media-tracker.plist`
**排程**: 每日 8:30


### 35. com.lman.stablecoin-arbitrage

**檔案**: `com.lman.stablecoin-arbitrage.plist`
**排程**: 每 0 小時


### 36. com.lman.twitter-bot

**檔案**: `com.lman.twitter-bot.plist`
**排程**: 每日 2:00


### 37. com.lman.twitter-curator-00

**檔案**: `com.lman.twitter-curator-00.plist`
**排程**: 每日 00:00


### 38. com.lman.twitter-curator-02

**檔案**: `com.lman.twitter-curator-02.plist`
**排程**: 每日 02:00


### 39. com.lman.twitter-curator-04

**檔案**: `com.lman.twitter-curator-04.plist`
**排程**: 每日 04:00


### 40. com.lman.twitter-curator-06

**檔案**: `com.lman.twitter-curator-06.plist`
**排程**: 每日 06:00


### 41. com.lman.weekly-investment-review

**檔案**: `com.lman.weekly-investment-review.plist`
**排程**: 每日 2:00


### 42. com.lman.weekly-review

**檔案**: `com.lman.weekly-review.plist`
**排程**: 每日 3:00



---

## 📜 自動化腳本清單

共 41 個腳本：

### ~/bin/ 目錄腳本

#### 1. generate-magi-snapshot.js

**大小**: 17 KB
**描述**: MAGI System Snapshot Generator


#### 2. generate-slack-summary.js

**大小**: 9 KB
**描述**: Iris - Slack Daily Summary Generator


#### 3. log-social-interaction.js

**大小**: 3 KB
**描述**: Social Media Interaction Logger


#### 4. track-social-media.js

**大小**: 7 KB
**描述**: IrisGo Social Media Tracker



### ~/Iris/scripts/automation/ 目錄腳本

#### 1. ai-news-scraper.js

**大小**: 8 KB
**描述**: AI News Scraper


#### 2. appstore-monitor.js

**大小**: 13 KB
**描述**: App Store Monitor - Side Project 靈感來源


#### 3. bidirectional-sync.js

**大小**: 14 KB
**描述**: 雙向同步：Markdown ↔ Google Docs ↔ Git


#### 4. chrome-extension-monitor-puppeteer.js

**大小**: 18 KB
**描述**: Chrome Extension Monitor - Puppeteer Version


#### 5. chrome-extension-monitor-v2.js

**大小**: 15 KB
**描述**: Chrome Extension Monitor V2 - 精選擴充追蹤


#### 6. chrome-extension-monitor.js

**大小**: 16 KB
**描述**: Chrome Extension Monitor - Chrome Web Store 趨勢追蹤


#### 7. chrome-extension-scraper.js

**大小**: 7 KB
**描述**: Chrome Extension Scraper - 使用 BrowserOS MCP


#### 8. crypto-monitor.js

**大小**: 20 KB
**描述**: Crypto Portfolio Monitor


#### 9. daily-brief.js

**大小**: 38 KB
**描述**: Daily Brief Generator


#### 10. daily-investment-generator.js

**大小**: 12 KB
**描述**: Daily Investment Analysis Generator


#### 11. dayflow-archiver.js

**大小**: 5 KB
**描述**: Dayflow Database Archiver


#### 12. dayflow-intelligence.js

**大小**: 18 KB
**描述**: DayFlow Intelligence Analyzer


#### 13. gdocs-sync-with-git.sh

**大小**: 1 KB
**描述**: No description


#### 14. gdocs-to-md-sync.js

**大小**: 12 KB
**描述**: Google Docs to Markdown Sync


#### 15. gemini-file-uploader-v2.js

**大小**: 7 KB
**描述**: Gemini File Uploader V2 - 使用 REST API


#### 16. gemini-file-uploader.js

**大小**: 9 KB
**描述**: Gemini File Uploader


#### 17. gemini-kb-query.js

**大小**: 5 KB
**描述**: Gemini Knowledge Base Query Tool


#### 18. google-calendar-auth.js

**大小**: 4 KB
**描述**: Google Calendar OAuth Authentication


#### 19. hn-scraper.js

**大小**: 3 KB
**描述**: Hacker News Scraper (使用 ii-agent browser)


#### 20. inbox-archiver.js

**大小**: 4 KB
**描述**: Inbox Archiver


#### 21. investment-archiver.js

**大小**: 5 KB
**描述**: Investment Reports Archiver


#### 22. md-to-gdocs.js

**大小**: 8 KB
**描述**: Markdown to Google Docs Converter


#### 23. meeting-prep.js

**大小**: 10 KB
**描述**: Meeting Intelligence Prep System


#### 24. news-sources.js

**大小**: 11 KB
**描述**: News Sources Module


#### 25. pkm-intelligence.js

**大小**: 10 KB
**描述**: PKM Vault Intelligence System


#### 26. scheduled-tasks-updater.js

**大小**: 5 KB
**描述**: Scheduled Tasks Overview Auto-Updater


#### 27. setup-appstore-monitor.sh

**大小**: 2 KB
**描述**: No description


#### 28. setup-gdocs-sync.sh

**大小**: 2 KB
**描述**: No description


#### 29. social-media-summary.js

**大小**: 11 KB
**描述**: Social Media Activity Summary Generator


#### 30. social-media-tracker.js

**大小**: 4 KB
**描述**: Social Media Tracker


#### 31. stablecoin-arbitrage-monitor.js

**大小**: 11 KB
**描述**: Stablecoin Arbitrage Monitor


#### 32. test-drive-api.js

**大小**: 2 KB
**描述**: No description


#### 33. twitter-curator.js

**大小**: 11 KB
**描述**: Twitter Content Curator


#### 34. update-gdoc.js

**大小**: 3 KB
**描述**: Update existing Google Doc with Markdown content


#### 35. upload-to-gemini.sh

**大小**: 3 KB
**描述**: No description


#### 36. weekly-investment-review.js

**大小**: 9 KB
**描述**: Weekly Investment Review Generator


#### 37. weekly-review.js

**大小**: 12 KB
**描述**: Weekly Review Generator



---

## 📁 關鍵系統路徑

### PKM 系統
- **主 Vault**: `~/Dropbox/PKM-Vault/`
- **Inbox**: `~/Dropbox/PKM-Vault/0-Inbox/`
- **Active Projects**: `~/Dropbox/PKM-Vault/1-Projects/Active/`
- **Wishlist**: `~/Dropbox/PKM-Vault/1-Projects/Active/wish list.md`

### MAGI System
- **系統根目錄**: `~/Dropbox/PKM-Vault/.ai-butler-system/`
- **文檔**: `~/Dropbox/PKM-Vault/.ai-butler-system/docs/`
- **Personas**: `~/Dropbox/PKM-Vault/.ai-butler-system/personas/`
- **共享 Context**: `~/Dropbox/PKM-Vault/.ai-butler-system/shared-context/`
- **記憶檔案**: `~/Dropbox/PKM-Vault/.ai-butler-system/iris-memory.md`

### Iris 專案目錄
- **專案根目錄**: `~/Iris/`
- **自動化腳本**: `~/Iris/scripts/automation/`
- **通知模組**: `~/Iris/scripts/notifier.js`
- **文檔**: `~/Iris/docs/`

### 腳本與配置
- **系統腳本**: `~/bin/`
- **LaunchAgents**: `~/Library/LaunchAgents/`
- **MCP 配置**: `~/.mcp.json` (如存在)
- **Ollama 模型**: 本地運行 (gpt-oss:20b, qwen2.5vl:3b)

---

## 🚀 重裝步驟

### 1. 基礎環境設置

```bash
# 安裝 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安裝 Node.js
brew install node

# 安裝 Dropbox
brew install --cask dropbox
# 登入並同步 ~/Dropbox/PKM-Vault

# 安裝 Claude Code CLI
npm install -g @anthropic-ai/claude-cli
# 或按照官方文檔安裝
```

### 2. 恢復自動化腳本

```bash
# 創建 bin 目錄
mkdir -p ~/bin

# 從備份恢復腳本（假設已透過 Dropbox 同步）
# 或從此文件下方的「腳本清單」手動重建

# 設置執行權限
chmod +x ~/bin/*.js
chmod +x ~/bin/*.sh
```

### 3. 恢復 LaunchAgents

```bash
# LaunchAgents 應該已在 ~/Library/LaunchAgents/
# 如果需要重新載入：

cd ~/Library/LaunchAgents
for plist in com.lman.*.plist; do
  launchctl load "$plist"
done

# 驗證載入狀態
launchctl list | grep com.lman
```

### 4. 配置 MCP Servers

```bash
# Gmail MCP
claude mcp add --name gmail gmail

# Google Calendar MCP
claude mcp add --name google-calendar google-calendar

# Gemini AI MCP
claude mcp add --name gemini gemini

# Gamma MCP
claude mcp add --name gamma @raydeck/gamma-app-mcp

# BrowserOS MCP
claude mcp add --transport http browseros http://127.0.0.1:9100/mcp

# Slack MCP
claude mcp add --name slack @korotovsky/slack-mcp-server

# 驗證配置
claude mcp list
```

### 5. 恢復記憶檔案

```bash
# 記憶檔案應已透過 Dropbox 同步
cat ~/Dropbox/PKM-Vault/.ai-butler-system/iris-memory.md

# 在 Claude Code 中使用 /iris 載入記憶
```

### 6. 驗證系統

```bash
# 檢查 LaunchAgents 狀態
launchctl list | grep com.lman

# 檢查腳本執行權限
ls -la ~/bin/*.js

# 手動執行一個腳本測試
node ~/bin/generate-slack-summary.js --test

# 檢查 Dropbox 同步狀態
```

---

## 💹 投資分析系統 (Investment Analysis System)

### 系統架構

自動化投資分析系統，每日兩次分析英文財經與科技新聞，提供投資建議。

### 核心組件

1. **news-sources.js** - 多源新聞聚合器
   - Yahoo Finance, TechCrunch, The Verge, Hacker News 等
   - 關鍵字預過濾 + AI 評分（節省 70% 處理時間）
   - 自動去重與排序

2. **daily-investment-generator.js** - 每日投資分析
   - 每日 05:00 (早盤) 和 17:00 (晚盤) 執行
   - AI 分析新聞投資價值（繁體中文輸出）
   - 自動查詢股票即時價格
   - 生成 Markdown 報告至 Inbox

3. **weekly-investment-review.js** - 週報生成
   - 每週日 02:00 執行
   - 整合過去 7 天的分析
   - 生成趨勢分析與展望

4. **investment-archiver.js** - 自動歸檔
   - 每日 06:00 執行
   - Daily reports > 3 天 → Archive
   - Weekly reports > 7 天 → Archive

### 報告位置

- **當日報告**: `~/Dropbox/PKM-Vault/0-Inbox/YYYY-MM-DD-Investment-Morning.md`
- **每日歸檔**: `~/Dropbox/PKM-Vault/2-Areas/Investment/Daily-Reports/`
- **週報歸檔**: `~/Dropbox/PKM-Vault/2-Areas/Investment/Weekly-Reviews/`

### 依賴項

```bash
# 必須安裝 rss-parser
npm install rss-parser

# 必須運行 Ollama 本地模型
ollama pull gpt-oss:20b
```

### LaunchAgents 配置

需要配置 4 個 LaunchAgent：
- `com.lman.daily-investment-morning.plist` (05:00)
- `com.lman.daily-investment-evening.plist` (17:00)
- `com.lman.weekly-investment-review.plist` (週日 02:00)
- `com.lman.investment-archiver.plist` (06:00)

---

## 📊 系統能力總覽

### API & 整合
- ✅ Gmail (via MCP)
- ✅ Slack (via MCP)
- ✅ Google Calendar (via MCP)
- ✅ Gemini AI (via MCP & Direct API)
- ✅ Gamma (via MCP)
- ✅ BrowserOS (via MCP)

### 自動化任務

#### 每日例行任務
- Daily Brief Generator (07:00) - 每日工作摘要
- Daily Investment Analysis (05:00, 17:00) - 投資分析報告
- PKM Intelligence (02:00) - PKM 智能分析
- Dayflow Intelligence (每兩天 01:00) - 日常流程智能
- Inbox Archiver (05:00) - 收件匣自動歸檔
- Investment Archiver (06:00) - 投資報告自動歸檔
- Slack Daily Summary (08:00) - Slack 每日摘要

#### 社交媒體自動化
- Twitter Auto-Engagement (02:00, 04:00, 06:00) - 自動互動
- Social Media Tracker (08:30) - 社交媒體追蹤

#### 週報與快照
- Weekly Review (週日 03:00) - 週報生成
- Weekly Investment Review (週日 02:00) - 投資週報
- MAGI Snapshot (週日 00:30) - 系統快照 ⬅️ 本腳本

### 技術能力
- Node.js (Puppeteer, APIs, automation)
- Python scripting
- Shell scripting (bash)
- macOS LaunchAgent 管理
- SQLite 數據分析
- Git 版本控制
- macOS 通知系統
- Computer Use (透過 BrowserOS)
- Local AI (Ollama - gpt-oss:20b, qwen2.5vl:3b)
- RSS Feed 解析與聚合
- 股票市場數據查詢 (Yahoo Finance API)
- 新聞來源整合 (多源聚合、去重、AI 評分)

---

## 🔄 版本歷史

此文件會在每週日半夜自動生成新版本。舊版本會自動歸檔至：

`~/Dropbox/PKM-Vault/.ai-butler-system/docs/installation-archives/`

---

## 📝 備註

- **自動生成**: 此文件由 `~/bin/generate-magi-snapshot.js` 自動生成
- **更新頻率**: 每週日 00:30
- **最新版本**: 永遠放在 `~/Dropbox/PKM-Vault/0-Inbox/MAGI-Installation-Guide-Latest.md`
- **歸檔位置**: `~/Dropbox/PKM-Vault/.ai-butler-system/docs/installation-archives/`

---

*生成時間: 2025-11-15T16:30:05.226Z*
*生成器版本: v1.0.0*
*MAGI System - Iris (Melchior)*
