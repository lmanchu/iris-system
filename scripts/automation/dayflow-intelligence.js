#!/usr/bin/env node

/**
 * DayFlow Intelligence Analyzer
 * 每兩天執行一次 - 深度分析你的工作模式和習慣
 *
 * 功能：
 * 1. 分析工作模式和時間分配
 * 2. 識別最常用的工具和平台
 * 3. 發現高效工作時段
 * 4. 提取關鍵詞和興趣領域
 * 5. 生成個性化洞察和建議
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const magi = require('../lib/magi-memory');

// 配置
const DAYFLOW_DB = '/Users/lman/Library/Application Support/Dayflow/chunks.sqlite';
const OUTPUT_PATH = '/Users/lman/Dropbox/PKM-Vault/0-Inbox';
const ANALYSIS_DAYS = 2; // 分析過去 N 天

// 獲取當前日期
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    filename: `${year}-${month}-${day}-DayFlow-Intelligence.md`
  };
}

// 執行 SQL 查詢
function query(sql) {
  try {
    const result = execSync(
      `sqlite3 "${DAYFLOW_DB}" "${sql}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    return result.trim();
  } catch (error) {
    console.error('Query error:', error.message);
    return '';
  }
}

// 1. 獲取基礎統計數據
function getBasicStats() {
  const sql = `
    SELECT
      COUNT(*) as total_activities,
      COUNT(DISTINCT day) as days_tracked,
      SUM(CASE WHEN category = 'Work' THEN 1 ELSE 0 END) as work_count,
      SUM(CASE WHEN category = 'Personal' THEN 1 ELSE 0 END) as personal_count,
      SUM(CASE WHEN category = 'Distraction' THEN 1 ELSE 0 END) as distraction_count,
      SUM(CASE WHEN category = 'Work' THEN end_ts - start_ts ELSE 0 END) as work_seconds,
      SUM(CASE WHEN category = 'Personal' THEN end_ts - start_ts ELSE 0 END) as personal_seconds,
      SUM(CASE WHEN category = 'Distraction' THEN end_ts - start_ts ELSE 0 END) as distraction_seconds,
      SUM(end_ts - start_ts) as total_seconds
    FROM timeline_cards
    WHERE is_deleted = 0
      AND day >= date('now', '-${ANALYSIS_DAYS} days')
  `;

  const result = query(sql);
  const [total, days, work, personal, distraction, workSec, personalSec, distractSec, totalSec] = result.split('|').map(Number);

  return {
    totalActivities: total,
    daysTracked: days,
    workCount: work,
    personalCount: personal,
    distractionCount: distraction,
    workSeconds: workSec,
    personalSeconds: personalSec,
    distractionSeconds: distractSec,
    totalSeconds: totalSec
  };
}

// 2. 分析每日模式
function analyzeDailyPatterns() {
  const sql = `
    SELECT
      day,
      COUNT(*) as activities,
      SUM(CASE WHEN category = 'Work' THEN end_ts - start_ts ELSE 0 END) as work_sec,
      SUM(CASE WHEN category = 'Distraction' THEN end_ts - start_ts ELSE 0 END) as dist_sec,
      AVG(end_ts - start_ts) as avg_duration
    FROM timeline_cards
    WHERE is_deleted = 0
      AND day >= date('now', '-${ANALYSIS_DAYS} days')
    GROUP BY day
    ORDER BY day DESC
  `;

  const result = query(sql);
  return result.split('\n').filter(line => line.trim()).map(line => {
    const [day, activities, workSec, distSec, avgDur] = line.split('|').map((v, i) => i === 0 ? v : Number(v));
    return { day, activities, workSec, distSec, avgDur };
  });
}

// 3. 提取關鍵詞和工具
function extractKeywords() {
  const sql = `
    SELECT title, category, summary
    FROM timeline_cards
    WHERE is_deleted = 0
      AND day >= date('now', '-${ANALYSIS_DAYS} days')
    ORDER BY start_ts DESC
  `;

  const result = query(sql);
  const lines = result.split('\n').filter(line => line.trim());

  // 提取關鍵詞
  const keywords = {};
  const tools = {};
  const topics = {};

  // 常見工具和平台列表
  const toolPatterns = [
    'Claude', 'ChatGPT', 'Slack', 'Gmail', 'Chrome', 'Safari', 'VS Code', 'Terminal',
    'Obsidian', 'Notion', 'Dropbox', 'GitHub', 'Zoom', 'Meet', 'Teams', 'Calendar',
    'WhatsApp', 'Messenger', 'Facebook', 'Twitter', 'LinkedIn', 'Instagram',
    'Excel', 'Google Docs', 'Sheets', 'Drive', 'Figma', 'Sketch'
  ];

  lines.forEach(line => {
    const parts = line.split('|');
    const title = parts[0] || '';
    const category = parts[1] || '';
    const summary = parts[2] || '';
    const text = `${title} ${summary}`.toLowerCase();

    // 提取工具
    toolPatterns.forEach(tool => {
      if (text.includes(tool.toLowerCase())) {
        tools[tool] = (tools[tool] || 0) + 1;
      }
    });

    // 提取關鍵詞（簡單版本）
    const words = text.match(/\b[a-z]{4,}\b/gi) || [];
    words.forEach(word => {
      const w = word.toLowerCase();
      if (!['with', 'from', 'this', 'that', 'have', 'been', 'more', 'some', 'time'].includes(w)) {
        keywords[w] = (keywords[w] || 0) + 1;
      }
    });

    // 按類別統計主題
    if (!topics[category]) topics[category] = [];
    topics[category].push(title);
  });

  // 排序並取 Top 項目
  const sortedTools = Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const sortedKeywords = Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 20);

  return { tools: sortedTools, keywords: sortedKeywords, topics };
}

// 4. 分析時間段效率
function analyzeTimeEfficiency() {
  const sql = `
    SELECT
      CASE
        WHEN CAST(substr(start, 1, instr(start, ':') - 1) AS INTEGER) < 9 THEN 'Early Morning (6-9am)'
        WHEN CAST(substr(start, 1, instr(start, ':') - 1) AS INTEGER) < 12 THEN 'Morning (9am-12pm)'
        WHEN CAST(substr(start, 1, instr(start, ':') - 1) AS INTEGER) < 15 THEN 'Early Afternoon (12-3pm)'
        WHEN CAST(substr(start, 1, instr(start, ':') - 1) AS INTEGER) < 18 THEN 'Late Afternoon (3-6pm)'
        WHEN CAST(substr(start, 1, instr(start, ':') - 1) AS INTEGER) < 21 THEN 'Evening (6-9pm)'
        ELSE 'Night (9pm+)'
      END as time_period,
      COUNT(*) as activities,
      SUM(CASE WHEN category = 'Work' THEN 1 ELSE 0 END) as work_activities,
      SUM(CASE WHEN category = 'Distraction' THEN 1 ELSE 0 END) as distraction_activities,
      AVG(end_ts - start_ts) as avg_duration
    FROM timeline_cards
    WHERE is_deleted = 0
      AND day >= date('now', '-${ANALYSIS_DAYS} days')
      AND start NOT LIKE '%PM%' OR (CAST(substr(start, 1, instr(start, ':') - 1) AS INTEGER) != 12)
    GROUP BY time_period
    ORDER BY work_activities DESC
  `;

  const result = query(sql);
  return result.split('\n').filter(line => line.trim()).map(line => {
    const [period, activities, work, distraction, avgDur] = line.split('|');
    return {
      period,
      activities: Number(activities),
      work: Number(work),
      distraction: Number(distraction),
      avgDuration: Number(avgDur)
    };
  });
}

// 5. 設備使用分析
function analyzeDeviceUsage() {
  // 通過活動內容推斷設備使用
  const sql = `
    SELECT
      title,
      COUNT(*) as frequency,
      SUM(end_ts - start_ts) as total_duration
    FROM timeline_cards
    WHERE is_deleted = 0
      AND day >= date('now', '-${ANALYSIS_DAYS} days')
    GROUP BY title
    ORDER BY frequency DESC
    LIMIT 20
  `;

  const result = query(sql);
  const activities = result.split('\n').filter(line => line.trim()).map(line => {
    const parts = line.split('|');
    return {
      title: parts[0],
      frequency: Number(parts[1]),
      duration: Number(parts[2])
    };
  });

  // 識別設備相關的活動
  const mobileKeywords = ['iphone', 'ios', 'mobile', 'phone', 'whatsapp', 'messenger'];
  const desktopKeywords = ['terminal', 'chrome', 'safari', 'code', 'slack', 'obsidian'];

  let mobileCount = 0;
  let desktopCount = 0;

  activities.forEach(act => {
    const title = act.title.toLowerCase();
    if (mobileKeywords.some(k => title.includes(k))) mobileCount += act.frequency;
    if (desktopKeywords.some(k => title.includes(k))) desktopCount += act.frequency;
  });

  return { mobileCount, desktopCount, topActivities: activities };
}

// 格式化時間
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// 生成 Markdown 報告
function generateReport(stats, patterns, keywords, timeEfficiency, deviceUsage) {
  const { date } = getFormattedDate();

  let markdown = `# 🧠 DayFlow Intelligence Report - ${date}\n\n`;
  markdown += `> **分析期間**: 過去 ${ANALYSIS_DAYS} 天\n`;
  markdown += `> *Generated at ${new Date().toLocaleString('zh-TW')}*\n\n`;
  markdown += `---\n\n`;

  // 概覽
  markdown += `## 📊 活動概覽\n\n`;
  markdown += `- **總活動數**: ${stats.totalActivities}\n`;
  markdown += `- **追蹤天數**: ${stats.daysTracked}\n`;
  markdown += `- **總時間**: ${formatTime(stats.totalSeconds)}\n`;
  markdown += `- **每日平均活動**: ${Math.round(stats.totalActivities / stats.daysTracked)}\n\n`;

  // 時間分配
  markdown += `## ⏱️ 時間分配分析\n\n`;
  const workPct = ((stats.workSeconds / stats.totalSeconds) * 100).toFixed(1);
  const personalPct = ((stats.personalSeconds / stats.totalSeconds) * 100).toFixed(1);
  const distractPct = ((stats.distractionSeconds / stats.totalSeconds) * 100).toFixed(1);

  markdown += `| 類別 | 時間 | 百分比 | 活動數 |\n`;
  markdown += `|------|------|--------|--------|\n`;
  markdown += `| 🟢 工作 | ${formatTime(stats.workSeconds)} | ${workPct}% | ${stats.workCount} |\n`;
  markdown += `| 🟡 個人 | ${formatTime(stats.personalSeconds)} | ${personalPct}% | ${stats.personalCount} |\n`;
  markdown += `| 🔴 分心 | ${formatTime(stats.distractionSeconds)} | ${distractPct}% | ${stats.distractionCount} |\n\n`;

  // 效率評分
  const focusScore = Math.round(workPct * 0.8 - distractPct * 0.8 + 30);
  markdown += `### 🎯 專注度評分: ${Math.max(0, Math.min(100, focusScore))}/100\n\n`;

  if (focusScore >= 75) {
    markdown += `> 💪 **優秀！** 你的專注度很高，繼續保持！\n\n`;
  } else if (focusScore >= 60) {
    markdown += `> 👍 **不錯** 還有提升空間，試著減少分心時間。\n\n`;
  } else {
    markdown += `> ⚠️ **需要改進** 分心時間較多，建議調整工作環境或方法。\n\n`;
  }

  markdown += `---\n\n`;

  // 每日模式
  markdown += `## 📈 每日工作模式\n\n`;
  markdown += `| 日期 | 活動數 | 工作時間 | 分心時間 | 平均活動時長 |\n`;
  markdown += `|------|--------|----------|----------|-------------|\n`;
  patterns.forEach(p => {
    markdown += `| ${p.day} | ${p.activities} | ${formatTime(p.workSec)} | ${formatTime(p.distSec)} | ${Math.round(p.avgDur / 60)}min |\n`;
  });
  markdown += `\n---\n\n`;

  // 最常用的工具
  markdown += `## 🛠️ 常用工具和平台\n\n`;
  if (keywords.tools.length > 0) {
    markdown += `你最常使用的工具：\n\n`;
    keywords.tools.forEach(([tool, count], index) => {
      markdown += `${index + 1}. **${tool}** - ${count} 次\n`;
    });
  } else {
    markdown += `*無法識別常用工具*\n`;
  }
  markdown += `\n---\n\n`;

  // 高頻關鍵詞
  markdown += `## 🔑 關鍵詞分析\n\n`;
  markdown += `從你的活動中提取的高頻關鍵詞：\n\n`;
  keywords.keywords.slice(0, 15).forEach(([word, count]) => {
    markdown += `- **${word}** (${count})\n`;
  });
  markdown += `\n---\n\n`;

  // 時段效率
  markdown += `## ⏰ 高效時段分析\n\n`;
  if (timeEfficiency.length > 0) {
    markdown += `| 時段 | 總活動 | 工作活動 | 分心活動 | 效率比 |\n`;
    markdown += `|------|--------|----------|----------|--------|\n`;
    timeEfficiency.forEach(t => {
      const efficiency = t.activities > 0 ? ((t.work / t.activities) * 100).toFixed(0) : 0;
      markdown += `| ${t.period} | ${t.activities} | ${t.work} | ${t.distraction} | ${efficiency}% |\n`;
    });
    markdown += `\n`;

    // 找出最高效的時段
    const mostEfficient = timeEfficiency.reduce((max, t) =>
      (t.work / (t.activities || 1)) > (max.work / (max.activities || 1)) ? t : max
    );
    markdown += `> 💡 **最高效時段**: ${mostEfficient.period}\n\n`;
  }
  markdown += `---\n\n`;

  // 設備使用
  markdown += `## 💻 設備使用模式\n\n`;
  const totalDevice = deviceUsage.mobileCount + deviceUsage.desktopCount;
  if (totalDevice > 0) {
    const mobilePct = ((deviceUsage.mobileCount / totalDevice) * 100).toFixed(1);
    const desktopPct = ((deviceUsage.desktopCount / totalDevice) * 100).toFixed(1);
    markdown += `- 🖥️ **桌面設備**: ${desktopPct}% (${deviceUsage.desktopCount} 活動)\n`;
    markdown += `- 📱 **行動設備**: ${mobilePct}% (${deviceUsage.mobileCount} 活動)\n\n`;

    if (deviceUsage.mobileCount > deviceUsage.desktopCount) {
      markdown += `> 你更常使用行動設備進行工作和溝通。\n\n`;
    } else {
      markdown += `> 你的主要工作環境是桌面設備。\n\n`;
    }
  }
  markdown += `---\n\n`;

  // 個性化洞察
  markdown += `## 💡 智能洞察\n\n`;
  markdown += `### ✅ 優勢\n\n`;

  if (workPct > 60) {
    markdown += `- 工作時間佔比高達 ${workPct}%，展現出色的專注力\n`;
  }
  if (stats.totalActivities / stats.daysTracked > 30) {
    markdown += `- 每日活動豐富（平均 ${Math.round(stats.totalActivities / stats.daysTracked)} 項），生產力高\n`;
  }
  if (keywords.tools.length > 10) {
    markdown += `- 熟練使用多種工具（${keywords.tools.length} 種），工作流程多樣化\n`;
  }

  markdown += `\n### ⚠️ 需要注意\n\n`;

  if (distractPct > 20) {
    markdown += `- 分心時間佔 ${distractPct}%，建議設定專注時段\n`;
  }
  if (stats.distractionCount > stats.workCount * 0.3) {
    markdown += `- 分心活動數量偏高，可能影響工作效率\n`;
  }

  markdown += `\n### 🎯 建議行動\n\n`;

  // 根據數據生成建議
  if (timeEfficiency.length > 0) {
    const bestTime = timeEfficiency.reduce((max, t) =>
      (t.work / (t.activities || 1)) > (max.work / (max.activities || 1)) ? t : max
    );
    markdown += `- 在 **${bestTime.period}** 安排重要工作（這是你的高效時段）\n`;
  }

  if (distractPct > 15) {
    markdown += `- 使用番茄工作法或時間鎖定來減少分心\n`;
  }

  if (keywords.tools.some(([tool]) => ['Slack', 'Email', 'Gmail'].includes(tool))) {
    markdown += `- 設定特定時段處理通訊（郵件/Slack），避免頻繁打斷\n`;
  }

  markdown += `\n---\n\n`;

  // 為 AI 助理的學習
  markdown += `## 🤖 為 Claude 的洞察\n\n`;
  markdown += `通過這 ${ANALYSIS_DAYS} 天的觀察，我了解到：\n\n`;

  markdown += `**你的工作風格**:\n`;
  if (workPct > 65) {
    markdown += `- 你是一個高度專注的工作者，工作時間佔比很高\n`;
  }
  markdown += `- 每天平均有 ${Math.round(stats.totalActivities / stats.daysTracked)} 個不同的活動或任務切換\n`;
  markdown += `- 平均每個活動持續約 ${Math.round(stats.totalSeconds / stats.totalActivities / 60)} 分鐘\n\n`;

  markdown += `**常用工具和平台**:\n`;
  keywords.tools.slice(0, 5).forEach(([tool]) => {
    markdown += `- 經常使用 ${tool}\n`;
  });
  markdown += `\n`;

  markdown += `**工作主題**:\n`;
  const topKeywords = keywords.keywords.slice(0, 8).map(([word]) => word);
  markdown += `- 關注: ${topKeywords.join(', ')}\n\n`;

  markdown += `這些資訊幫助我更好地理解你的工作模式，未來我可以：\n`;
  markdown += `- 在你的高效時段提供更重要的資訊\n`;
  markdown += `- 根據你的常用工具提供相關建議\n`;
  markdown += `- 識別你的工作重點並提供相關支援\n\n`;

  markdown += `---\n\n`;
  markdown += `*🤖 Generated by DayFlow Intelligence System*\n`;
  markdown += `*Powered by Claude Code via Happy Engineering*\n`;

  return markdown;
}

// 主函數
async function main() {
  console.log('🧠 DayFlow Intelligence Analyzer');
  console.log('================================\n');

  // 開始執行追蹤
  const exec = magi.startExecution('dayflow-intelligence', { source: 'launchagent' });

  // 取得前次執行資訊
  const lastRun = await magi.getLastExecution('dayflow-intelligence');
  if (lastRun) {
    console.log(`📋 Last run: ${lastRun.timestamp} (${lastRun.status})\n`);
  }

  try {
    // 檢查資料庫
    if (!fs.existsSync(DAYFLOW_DB)) {
      console.error('❌ DayFlow database not found');
      console.error(`   Expected: ${DAYFLOW_DB}`);
      await exec.fail(new Error('DayFlow database not found'));
      process.exit(1);
    }

    const startTime = Date.now();

    console.log(`📊 Analyzing past ${ANALYSIS_DAYS} days...\n`);

    console.log('1️⃣  Getting basic statistics...');
    const stats = getBasicStats();

    console.log('2️⃣  Analyzing daily patterns...');
    const patterns = analyzeDailyPatterns();

    console.log('3️⃣  Extracting keywords and tools...');
    const keywords = extractKeywords();

    console.log('4️⃣  Analyzing time efficiency...');
    const timeEfficiency = analyzeTimeEfficiency();

    console.log('5️⃣  Analyzing device usage...');
    const deviceUsage = analyzeDeviceUsage();

    console.log('\n📝 Generating intelligence report...');
    const markdown = generateReport(stats, patterns, keywords, timeEfficiency, deviceUsage);

    // 確保輸出目錄存在
    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }

    // 寫入文件
    const { filename } = getFormattedDate();
    const filePath = path.join(OUTPUT_PATH, filename);
    fs.writeFileSync(filePath, markdown, 'utf-8');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Intelligence report generated successfully!`);
    console.log(`📁 File: ${filePath}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Analyzed ${stats.totalActivities} activities over ${stats.daysTracked} days`);
    console.log(`\n🧠 New insights discovered!\n`);

    // 計算專注度評分
    const workPct = stats.totalSeconds > 0 ? (stats.workSeconds / stats.totalSeconds) * 100 : 0;
    const distractPct = stats.totalSeconds > 0 ? (stats.distractionSeconds / stats.totalSeconds) * 100 : 0;
    const focusScore = Math.max(0, Math.min(100, Math.round(workPct * 0.8 - distractPct * 0.8 + 30)));

    // 記錄成功執行到 MAGI Memory
    await exec.end({
      status: 'success',
      output: filePath,
      metadata: {
        totalActivities: stats.totalActivities,
        daysTracked: stats.daysTracked,
        workPercentage: workPct.toFixed(1),
        focusScore,
        topTools: keywords.tools.slice(0, 5).map(([tool]) => tool),
        duration: parseFloat(duration)
      }
    });

    // 將重要洞察存入知識庫
    console.log('💾 Saving insights to knowledge base...');

    // 存入工作風格洞察
    await magi.addInsight({
      category: 'work_habits',
      insight: `專注度評分 ${focusScore}/100，工作時間佔比 ${workPct.toFixed(1)}%`,
      source: 'dayflow-intelligence'
    });

    // 存入高效時段洞察
    if (timeEfficiency.length > 0) {
      const bestTime = timeEfficiency.reduce((max, t) =>
        (t.work / (t.activities || 1)) > (max.work / (max.activities || 1)) ? t : max
      );
      await magi.addInsight({
        category: 'work_habits',
        insight: `最高效工作時段: ${bestTime.period}`,
        source: 'dayflow-intelligence'
      });
    }

    // 存入常用工具洞察
    if (keywords.tools.length > 0) {
      const topTools = keywords.tools.slice(0, 5).map(([tool, count]) => `${tool}(${count}次)`).join(', ');
      await magi.addInsight({
        category: 'preferences',
        insight: `常用工具: ${topTools}`,
        source: 'dayflow-intelligence'
      });
    }

    console.log('✅ Insights saved to MAGI Memory\n');

  } catch (error) {
    console.error('\n❌ Error generating intelligence report:', error);
    console.error(error.stack);

    // 記錄失敗執行到 MAGI Memory
    await exec.fail(error);

    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main();
}

module.exports = { main, getBasicStats, extractKeywords, generateReport };
