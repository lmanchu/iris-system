#!/bin/bash

# Iris Dashboard 啟動腳本
# 用途: 快速啟動 Iris Dashboard 並自動打開瀏覽器

echo "🌿 Starting Iris Dashboard..."
echo ""

# 切換到專案目錄
cd ~/iris-dashboard

# 啟動伺服器
node server.js &
SERVER_PID=$!

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# 等待伺服器啟動
sleep 2

# 打開瀏覽器
echo "🌐 Opening browser..."
open http://localhost:3030

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║                                            ║"
echo "║   🌿 Iris Dashboard is running!           ║"
echo "║                                            ║"
echo "║   📊 Dashboard: http://localhost:3030      ║"
echo "║                                            ║"
echo "║   Press Ctrl+C to stop the server         ║"
echo "║                                            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 等待用戶中斷
wait $SERVER_PID
