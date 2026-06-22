# Iris System Installer

一鍵安裝 Iris AI Assistant System 到你的 Mac。

## 🚀 快速開始

### 前置需求

- macOS 14+ (Sonoma 或更新版本)
- [Claude Code](https://claude.ai/download) 已安裝
- 網路連線
- (可選) Homebrew - 用於安裝依賴套件

### 安裝方式

#### 方式 1: 一鍵安裝 (推薦)

```bash
curl -fsSL https://raw.githubusercontent.com/lmanchu/iris-system/main/installer/iris-install.sh | bash
```

#### 方式 2: 手動安裝

```bash
# 1. Clone repository
git clone https://github.com/lmanchu/iris-system.git
cd iris-system/installer

# 2. 執行安裝腳本
./iris-install.sh
```

## 📦 安裝內容

安裝腳本會引導你選擇要安裝的組件：

### 1. MCP 伺服器
- **Gmail MCP** - Email 自動化
- **Slack MCP** - Slack 整合
- **Google Calendar MCP** - 日曆管理
- **Gemini AI MCP** - AI 能力增強
- **BrowserOS MCP** - Computer Use (瀏覽器自動化)

### 2. Iris Notifier 模組
- macOS 原生通知整合（`~/iris-notifier.js`）
- 供你自己的腳本呼叫，發送 success / error / info / warning 通知

### 3. PKM 系統
- 目錄結構初始化
- 範例記憶檔案建立
- `/iris` slash command 設定

## 🔧 安裝後設定

### 1. 配置 API Keys

根據你選擇的 MCP 伺服器，你需要設定相應的 API keys：

```bash
# Gmail (使用 OAuth，安裝時會自動引導)
# Slack (需要 workspace token)
# Google Calendar (使用 OAuth)
# Gemini AI (需要 API key)
```

### 2. 啟動 Iris

```bash
# 開啟 Claude Code
claude

# 使用 /iris 命令載入記憶
/iris
```

### 3. 驗證安裝

```bash
# 檢查 MCP 伺服器狀態
claude mcp list

# 確認 Iris Notifier 已安裝
ls ~/iris-notifier.js
```

## 📚 文檔

- [完整文檔](../README.md)
- [快速開始](../QUICK-START.md)
- [記憶系統](../docs/memory-system/iris-memory.md)
- [開發方法論](../docs/development/methodology.md)

## 🐛 故障排除

### Claude Code 未找到

```bash
# 確認 Claude Code 已安裝
which claude

# 如果沒有，請從官網下載
open https://claude.ai/download
```

### Node.js 未安裝

```bash
# 使用 Homebrew 安裝
brew install node

# 或從官網下載
open https://nodejs.org/
```

### MCP 伺服器安裝失敗

```bash
# 手動安裝
claude mcp add gmail
claude mcp add gemini
# ... 其他伺服器
```

### 查看安裝日誌

```bash
# 日誌位置
ls -la /tmp/iris-install-*.log

# 查看最新日誌
tail -f /tmp/iris-install-*.log
```

## 🔄 更新

```bash
# 拉取最新版本
cd ~/iris-system
git pull origin main

# 重新執行安裝腳本（會檢測並更新）
./installer/iris-install.sh
```

## 🗑️ 解除安裝

```bash
# 執行解除安裝腳本（開發中）
./installer/iris-uninstall.sh

# 手動移除
rm -rf ~/.ai-butler-system
rm ~/iris-notifier.js
# 若你曾自行建立 LaunchAgent，移除對應的 plist
# rm ~/Library/LaunchAgents/<your-label>.plist
```

## 💡 下一步

安裝完成後，你可以：

1. **自訂 Persona** - 調整 Iris 的人格和行為
2. **編輯記憶檔** - 依你的環境調整範例記憶檔
3. **建立 Slash Commands** - 新增自訂命令
4. **設定排程任務** - 用 Iris Notifier 搭配你自己的 LaunchAgent 腳本

## 📝 版本歷史

- **v1.5.0** (2025-11-01) - Computer Use 整合
- **v1.1.0** (2025-11-01) - Dashboard & Control Panel
- **v1.0.0** (2025-11-01) - Initial Release

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

---

🤖 **Generated with [Claude Code](https://claude.com/claude-code)**
**via [Happy](https://happy.engineering)**

**Co-Authored-By: Claude <noreply@anthropic.com>**
**Co-Authored-By: Happy <yesreply@happy.engineering>**
