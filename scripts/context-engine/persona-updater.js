#!/usr/bin/env node

/**
 * Persona Profile Updater
 * 定期更新 Lman 的 Deep Persona Profile
 *
 * 功能：
 * 1. 讀取最新 DayFlow Intelligence 報告
 * 2. 更新 Persona Profile
 * 3. 版本號遞增
 * 4. 歸檔舊版本
 * 5. 通知更新完成
 */

const fs = require('fs');
const path = require('path');
const notify = require('../../scripts/notifier');
const magi = require('../lib/magi-memory');

// 路徑配置
const INBOX_DIR = path.join(process.env.HOME, 'Dropbox/PKM-Vault/0-Inbox');
const PERSONA_FILE = path.join(INBOX_DIR, 'Lman-Deep-Persona-Profile.md');
const ARCHIVE_DIR = path.join(process.env.HOME, 'Dropbox/PKM-Vault/2-Areas/Context-Engine/Persona-History');
const DAYFLOW_PATTERN = /^\d{4}-\d{2}-\d{2}-DayFlow-Intelligence\.md$/;

// 確保目錄存在
function ensureDirectories() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

// 獲取格式化日期
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 讀取最新的 DayFlow Intelligence 報告
function getLatestDayFlowReport() {
  const files = fs.readdirSync(INBOX_DIR);
  const dayflowFiles = files
    .filter(f => DAYFLOW_PATTERN.test(f))
    .sort()
    .reverse();

  if (dayflowFiles.length === 0) {
    console.log('  ⚠️  No DayFlow Intelligence report found');
    return null;
  }

  const latestFile = dayflowFiles[0];
  const filePath = path.join(INBOX_DIR, latestFile);
  return {
    filename: latestFile,
    path: filePath,
    content: fs.readFileSync(filePath, 'utf-8')
  };
}

// 從 DayFlow 報告提取洞察
function extractInsights(dayflowContent) {
  const insights = {
    focusScore: 0,
    workPercentage: 0,
    distractionPercentage: 0,
    avgActivitiesPerDay: 0,
    avgDuration: 0,
    topTools: [],
    topKeywords: [],
    bestTimeSlot: '',
    devicePreference: ''
  };

  // 提取專注度評分
  const focusMatch = dayflowContent.match(/專注度評分:\s*(\d+)\/100/);
  if (focusMatch) {
    insights.focusScore = parseInt(focusMatch[1]);
  }

  // 提取時間分配百分比
  const workMatch = dayflowContent.match(/🟢 工作.*?(\d+\.?\d*)%/);
  const distractMatch = dayflowContent.match(/🔴 分心.*?(\d+\.?\d*)%/);
  if (workMatch) insights.workPercentage = parseFloat(workMatch[1]);
  if (distractMatch) insights.distractionPercentage = parseFloat(distractMatch[1]);

  // 提取每日平均活動
  const avgActivitiesMatch = dayflowContent.match(/每日平均活動:\s*(\d+)/);
  if (avgActivitiesMatch) {
    insights.avgActivitiesPerDay = parseInt(avgActivitiesMatch[1]);
  }

  // 提取平均活動時長
  const avgDurationMatch = dayflowContent.match(/平均活動持續約\s*(\d+)\s*分鐘/);
  if (avgDurationMatch) {
    insights.avgDuration = parseInt(avgDurationMatch[1]);
  }

  // 提取常用工具（前5個）
  const toolsSection = dayflowContent.match(/## 🛠️ 常用工具和平台[\s\S]*?(?=\n---|\n##|$)/);
  if (toolsSection) {
    const toolMatches = toolsSection[0].matchAll(/\d+\.\s+\*\*(.+?)\*\*\s+-\s+(\d+)\s+次/g);
    insights.topTools = Array.from(toolMatches)
      .slice(0, 5)
      .map(m => ({ name: m[1], count: parseInt(m[2]) }));
  }

  // 提取高頻關鍵詞（前8個）
  const keywordsSection = dayflowContent.match(/## 🔑 關鍵詞分析[\s\S]*?(?=\n---|\n##|$)/);
  if (keywordsSection) {
    const keywordMatches = keywordsSection[0].matchAll(/-\s+\*\*(.+?)\*\*\s+\((\d+)\)/g);
    insights.topKeywords = Array.from(keywordMatches)
      .slice(0, 8)
      .map(m => ({ word: m[1], count: parseInt(m[2]) }));
  }

  // 提取最高效時段
  const bestTimeMatch = dayflowContent.match(/最高效時段\*\*:\s*(.+?)\n/);
  if (bestTimeMatch) {
    insights.bestTimeSlot = bestTimeMatch[1];
  }

  // 提取設備偏好
  if (dayflowContent.includes('你的主要工作環境是桌面設備')) {
    insights.devicePreference = 'Desktop';
  } else if (dayflowContent.includes('你更常使用行動設備')) {
    insights.devicePreference = 'Mobile';
  }

  return insights;
}

// 讀取當前 Persona Profile
function getCurrentPersona() {
  if (!fs.existsSync(PERSONA_FILE)) {
    console.log('  ⚠️  Persona file not found, will create new one');
    return null;
  }

  const content = fs.readFileSync(PERSONA_FILE, 'utf-8');

  // 提取當前版本號
  const versionMatch = content.match(/\*\*版本\*\*:\s*v([\d.]+)/);
  const currentVersion = versionMatch ? versionMatch[1] : '0.0';

  return {
    content,
    version: currentVersion
  };
}

/**
 * 解析語意化版本號
 * @param {string} version - 格式: "1.2", "1.405" 或 "v1.2", "v1.405"
 * @returns {number[]} - [major, minor, patch]
 *
 * 支援兩種格式：
 * - 兩位數: "1.2" → [1, 2, 0]
 * - 三位數: "1.405" → [1, 4, 5]
 */
function parseVersion(version) {
  const cleaned = version.replace(/^v/, '');

  // 先嘗試三位數格式 (1.405)
  const threeDigitMatch = cleaned.match(/^(\d+)\.(\d)(\d{2})$/);
  if (threeDigitMatch) {
    return [
      parseInt(threeDigitMatch[1], 10),  // major
      parseInt(threeDigitMatch[2], 10),  // minor (single digit)
      parseInt(threeDigitMatch[3], 10)   // patch (two digits)
    ];
  }

  // 嘗試兩位數格式 (1.2)
  const twoDigitMatch = cleaned.match(/^(\d+)\.(\d+)$/);
  if (twoDigitMatch) {
    return [
      parseInt(twoDigitMatch[1], 10),  // major
      parseInt(twoDigitMatch[2], 10),  // minor
      0                                 // patch (default 0)
    ];
  }

  throw new Error(`Invalid version format: ${version}. Expected "1.2" or "1.405"`);
}

/**
 * 比較兩個版本號
 * @param {string} v1 - 第一個版本
 * @param {string} v2 - 第二個版本
 * @returns {number} - -1 (v1 < v2), 0 (v1 == v2), 1 (v1 > v2)
 */
function compareVersions(v1, v2) {
  const [major1, minor1, patch1] = parseVersion(v1);
  const [major2, minor2, patch2] = parseVersion(v2);

  if (major1 !== major2) return major1 > major2 ? 1 : -1;
  if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
  if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
  return 0;
}

/**
 * 生成新版本號
 * @param {string} currentVersion - 當前版本 (e.g., "1.2", "1.405" 或 "v1.2", "v1.405")
 * @param {string} incrementType - "major" | "minor" | "patch" (default: "patch")
 * @returns {string} - 下一個版本號 (without 'v' prefix)
 *
 * 版本號語義：
 * - patch (1.405 → 1.406): 日常數據更新 (DayFlow)
 * - minor (1.405 → 1.5): 功能新增或較具體改變
 * - major (1.405 → 2.0): 重大架構變更
 *
 * 輸出格式：
 * - 如果有 patch > 0: 輸出三位數 (e.g., "1.405")
 * - 如果 patch = 0: 輸出兩位數 (e.g., "1.5")
 */
function getNextVersion(currentVersion, incrementType = "patch") {
  let [major, minor, patch] = parseVersion(currentVersion);

  switch (incrementType) {
    case "major":
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor += 1;
      patch = 0;
      break;
    case "patch":
      patch += 1;
      break;
    default:
      throw new Error(`Invalid increment type: ${incrementType}. Expected "major", "minor", or "patch".`);
  }

  // 輸出格式決策：
  // - 如果 patch > 0，使用三位數格式: "1.405"
  // - 如果 patch = 0，使用兩位數格式: "1.5"
  if (patch > 0) {
    const patchStr = patch.toString().padStart(2, '0');
    return `${major}.${minor}${patchStr}`;
  } else {
    return `${major}.${minor}`;
  }
}

// 更新 Persona Profile
function updatePersonaProfile(insights) {
  const currentPersona = getCurrentPersona();
  const today = getFormattedDate();
  const newVersion = currentPersona ? getNextVersion(currentPersona.version) : '0.1';

  if (!currentPersona) {
    console.log('  ℹ️  No existing persona found. Please use the initial template.');
    return false;
  }

  let updatedContent = currentPersona.content;

  // 更新版本信息
  updatedContent = updatedContent.replace(
    /\*\*最後更新\*\*:.+/,
    `**最後更新**: ${new Date().toISOString()}`
  );
  updatedContent = updatedContent.replace(
    /\*\*版本\*\*:\s*v[\d.]+/,
    `**版本**: v${newVersion}`
  );

  // 更新信心分數（隨著數據增加而提升）
  const newConfidence = Math.min(0.95, 0.75 + (parseInt(newVersion.split('.')[1]) * 0.02));
  updatedContent = updatedContent.replace(
    /\*\*信心分數\*\*:\s*[\d.]+/,
    `**信心分數**: ${newConfidence.toFixed(2)}`
  );

  // 更新工作風格數據
  updatedContent = updatedContent.replace(
    /\*\*工作強度\*\*:.+/,
    `**工作強度**: 高度專注 (工作時間佔比 ${insights.workPercentage}%)`
  );
  updatedContent = updatedContent.replace(
    /\*\*專注度評分\*\*:.+/,
    `**專注度評分**: ${insights.focusScore}/100 (${insights.focusScore >= 80 ? '優秀' : insights.focusScore >= 60 ? '良好' : '需改善'})`
  );
  updatedContent = updatedContent.replace(
    /\*\*任務切換頻率\*\*:.+/,
    `**任務切換頻率**: 每天平均 ${insights.avgActivitiesPerDay} 個活動/任務`
  );
  updatedContent = updatedContent.replace(
    /\*\*平均專注時長\*\*:.+/,
    `**平均專注時長**: ${insights.avgDuration} 分鐘/任務`
  );

  // 更新常用工具
  if (insights.topTools.length > 0) {
    const toolsList = insights.topTools.map((t, i) => `${i + 1}. **${t.name}** (${t.count} 次)`).join('\n');
    updatedContent = updatedContent.replace(
      /(\*\*主要溝通工具\*\* \(依使用頻率\):[\s\S]*?)(\n\n\*\*溝通特徵)/,
      `**主要溝通工具** (依使用頻率):\n${toolsList}$2`
    );
  }

  // 更新高頻關鍵詞
  if (insights.topKeywords.length > 0) {
    const keywordsList = insights.topKeywords.map(k => `\`${k.word}\``).join(', ');
    updatedContent = updatedContent.replace(
      /\*\*高頻關鍵詞\*\* \(從活動中提取\):[\s\S]*?(?=\n\n\*\*推測)/,
      `**高頻關鍵詞** (從活動中提取):\n- ${keywordsList}\n`
    );
  }

  // 更新最高效時段
  if (insights.bestTimeSlot) {
    updatedContent = updatedContent.replace(
      /⭐ \*\*Morning \(9am-12pm\)\*\*:.+/,
      `⭐ **${insights.bestTimeSlot}**: **最高效時段**`
    );
  }

  // 更新版本歷史
  const versionEntry = `- **v${newVersion}** (${today}): 整合 DayFlow Intelligence 數據更新 (專注度 ${insights.focusScore}/100)`;
  updatedContent = updatedContent.replace(
    /(## 📊 版本歷史[\s\S]*?)(---)/,
    `$1\n${versionEntry}\n\n$2`
  );

  // 更新更新日誌
  const changelogEntry = `### v${newVersion} - ${today}
- 📊 更新 DayFlow Intelligence 數據
- 🎯 專注度評分: ${insights.focusScore}/100
- ⏱️ 工作時間佔比: ${insights.workPercentage}%
- 🛠️ 更新常用工具列表 (Top ${insights.topTools.length})
- 🔑 更新關鍵詞分析 (Top ${insights.topKeywords.length})

`;
  updatedContent = updatedContent.replace(
    /(## 📚 更新日誌\n\n)/,
    `$1${changelogEntry}`
  );

  return {
    content: updatedContent,
    version: newVersion
  };
}

// 歸檔舊版本
function archiveOldVersion(version) {
  const today = getFormattedDate();
  const archivePath = path.join(ARCHIVE_DIR, `Lman-Persona-v${version}-${today}.md`);

  if (fs.existsSync(PERSONA_FILE)) {
    fs.copyFileSync(PERSONA_FILE, archivePath);
    console.log(`  ✅ Archived v${version}: ${archivePath}`);
    return true;
  }
  return false;
}

// 主函數
async function main() {
  console.log('\n🤖 Persona Profile Updater');
  console.log('='.repeat(60));
  console.log('');

  // 開始執行追蹤
  const exec = magi.startExecution('persona-updater', { source: 'launchagent' });

  // 取得前次執行資訊
  const lastRun = await magi.getLastExecution('persona-updater');
  if (lastRun) {
    console.log(`📋 Last run: ${lastRun.timestamp} (${lastRun.status})\n`);
  }

  try {
    ensureDirectories();

    // 1. 讀取最新 DayFlow 報告
    console.log('📊 Step 1: Reading latest DayFlow Intelligence...');
    const dayflowReport = getLatestDayFlowReport();

    if (!dayflowReport) {
      console.log('  ❌ No DayFlow report found. Skipping update.');
      return;
    }

    console.log(`  ✅ Found: ${dayflowReport.filename}`);

    // 2. 提取洞察
    console.log('\n🔍 Step 2: Extracting insights...');
    const insights = extractInsights(dayflowReport.content);
    console.log(`  ✅ Focus Score: ${insights.focusScore}/100`);
    console.log(`  ✅ Work Percentage: ${insights.workPercentage}%`);
    console.log(`  ✅ Top Tools: ${insights.topTools.length}`);
    console.log(`  ✅ Keywords: ${insights.topKeywords.length}`);

    // 3. 讀取當前 Persona
    console.log('\n📖 Step 3: Reading current Persona Profile...');
    const currentPersona = getCurrentPersona();

    if (!currentPersona) {
      console.log('  ⚠️  No existing persona found. Please create initial version first.');
      return;
    }

    console.log(`  ✅ Current version: v${currentPersona.version}`);

    // 4. 歸檔舊版本
    console.log('\n📁 Step 4: Archiving old version...');
    archiveOldVersion(currentPersona.version);

    // 5. 更新 Persona
    console.log('\n✏️  Step 5: Updating Persona Profile...');
    const updatedPersona = updatePersonaProfile(insights);

    if (!updatedPersona) {
      console.log('  ❌ Update failed.');
      return;
    }

    // 6. 寫入新版本
    fs.writeFileSync(PERSONA_FILE, updatedPersona.content, 'utf-8');
    console.log(`  ✅ Updated to v${updatedPersona.version}`);

    // 7. 通知完成
    console.log('\n✨ Persona Profile updated successfully!');
    console.log(`📝 New version: v${updatedPersona.version}`);
    console.log(`📊 Focus Score: ${insights.focusScore}/100`);
    console.log(`📁 Archive: ${ARCHIVE_DIR}\n`);

    notify.success(
      'Persona Profile 更新完成',
      `v${updatedPersona.version} | 專注度 ${insights.focusScore}/100`
    );

    // 8. 同步 Persona 到 MAGI Memory
    console.log('💾 Syncing persona to MAGI Memory...');
    const syncResult = await magi.syncPersona();
    if (syncResult.success) {
      console.log(`  ✅ Persona synced: v${syncResult.version}`);
    } else {
      console.log(`  ⚠️  Sync failed: ${syncResult.error}`);
    }

    // 9. 記錄成功執行到 MAGI Memory
    await exec.end({
      status: 'success',
      output: PERSONA_FILE,
      metadata: {
        previousVersion: currentPersona.version,
        newVersion: updatedPersona.version,
        focusScore: insights.focusScore,
        workPercentage: insights.workPercentage,
        topToolsCount: insights.topTools.length
      }
    });

    // 10. 存入版本更新洞察
    await magi.addInsight({
      category: 'general',
      insight: `Persona 更新至 v${updatedPersona.version}，專注度 ${insights.focusScore}/100`,
      source: 'persona-updater'
    });

    console.log('✅ MAGI Memory updated\n');

  } catch (error) {
    console.error('\n❌ Error updating persona:', error);
    console.error(error.stack);

    notify.error(
      'Persona Profile 更新失敗',
      error.message.substring(0, 50)
    );

    // 記錄失敗執行到 MAGI Memory
    await exec.fail(error);

    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main();
}

module.exports = {
  main,
  extractInsights,
  updatePersonaProfile,
  parseVersion,
  compareVersions,
  getNextVersion
};
