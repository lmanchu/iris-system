#!/usr/bin/env node

/**
 * MAGI Memory Storage Layer
 * 統一的持久化存儲層,管理執行紀錄、人格資料、知識庫等
 *
 * Storage locations:
 * - ~/.magi-memory/executions/   - 任務執行歷史
 * - ~/.magi-memory/persona/      - 人格上下文快取
 * - ~/.magi-memory/knowledge/    - 累積的洞察
 * - ~/.magi-memory/conversations/ - 對話學習
 */

const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = path.join(process.env.HOME, '.magi-memory');

// Storage subdirectories
const PATHS = {
  executions: path.join(STORAGE_ROOT, 'executions'),
  persona: path.join(STORAGE_ROOT, 'persona'),
  knowledge: path.join(STORAGE_ROOT, 'knowledge'),
  conversations: path.join(STORAGE_ROOT, 'conversations')
};

/**
 * 確保所有存儲目錄存在
 */
function ensureStorageExists() {
  Object.values(PATHS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * 讀取 JSON 檔案,若不存在則返回預設值
 */
function readJSON(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
  return defaultValue;
}

/**
 * 寫入 JSON 檔案
 */
function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 追加到 JSON 陣列檔案
 */
function appendToJSONArray(filePath, item, maxItems = 1000) {
  const arr = readJSON(filePath, []);
  arr.push(item);

  // 限制最大項目數
  while (arr.length > maxItems) {
    arr.shift();
  }

  return writeJSON(filePath, arr);
}

// === Execution Storage ===

/**
 * 取得任務執行檔案路徑
 */
function getExecutionPath(taskName) {
  return path.join(PATHS.executions, `${taskName}.json`);
}

/**
 * 儲存任務執行紀錄
 */
function saveExecution(taskName, execution) {
  ensureStorageExists();
  const filePath = getExecutionPath(taskName);
  const history = readJSON(filePath, { taskName, history: [] });

  history.history.push({
    ...execution,
    timestamp: new Date().toISOString()
  });

  // 保留最近 100 次執行
  while (history.history.length > 100) {
    history.history.shift();
  }

  history.lastRun = execution;
  history.lastRun.timestamp = new Date().toISOString();

  return writeJSON(filePath, history);
}

/**
 * 取得任務最後執行紀錄
 */
function getLastExecution(taskName) {
  const filePath = getExecutionPath(taskName);
  const data = readJSON(filePath);
  return data?.lastRun || null;
}

/**
 * 取得任務執行歷史
 */
function getExecutionHistory(taskName, limit = 10) {
  const filePath = getExecutionPath(taskName);
  const data = readJSON(filePath);
  if (!data?.history) return [];
  return data.history.slice(-limit);
}

/**
 * 列出所有有執行紀錄的任務
 */
function listTasks() {
  ensureStorageExists();
  try {
    const files = fs.readdirSync(PATHS.executions);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    return [];
  }
}

// === Persona Storage ===

/**
 * 儲存人格上下文
 */
function savePersona(persona) {
  ensureStorageExists();
  const filePath = path.join(PATHS.persona, 'current.json');
  return writeJSON(filePath, {
    ...persona,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * 取得人格上下文
 */
function getPersona() {
  const filePath = path.join(PATHS.persona, 'current.json');
  return readJSON(filePath);
}

// === Knowledge Storage ===

/**
 * 取得知識庫檔案路徑
 */
function getKnowledgePath() {
  return path.join(PATHS.knowledge, 'insights.json');
}

/**
 * 新增洞察到知識庫
 */
function addInsight(insight) {
  ensureStorageExists();
  const filePath = getKnowledgePath();
  const knowledge = readJSON(filePath, { insights: [], categories: {} });

  const entry = {
    id: `insight_${Date.now()}`,
    ...insight,
    createdAt: new Date().toISOString()
  };

  knowledge.insights.push(entry);

  // 按類別索引
  const category = insight.category || 'general';
  if (!knowledge.categories[category]) {
    knowledge.categories[category] = [];
  }
  knowledge.categories[category].push(entry.id);

  // 限制最大項目數
  while (knowledge.insights.length > 500) {
    const removed = knowledge.insights.shift();
    // 從類別索引中移除
    Object.keys(knowledge.categories).forEach(cat => {
      knowledge.categories[cat] = knowledge.categories[cat]
        .filter(id => id !== removed.id);
    });
  }

  return writeJSON(filePath, knowledge) ? entry : null;
}

/**
 * 搜尋知識庫
 */
function searchKnowledge(query, options = {}) {
  const filePath = getKnowledgePath();
  const knowledge = readJSON(filePath, { insights: [] });

  const queryLower = query.toLowerCase();
  const { category, limit = 10 } = options;

  let results = knowledge.insights.filter(insight => {
    // 類別過濾
    if (category && insight.category !== category) return false;

    // 簡單文字匹配
    const text = `${insight.insight || ''} ${insight.source || ''} ${insight.category || ''}`.toLowerCase();
    return text.includes(queryLower);
  });

  // 最新的優先
  results = results.reverse().slice(0, limit);

  return results;
}

/**
 * 取得特定類別的洞察
 */
function getInsightsByCategory(category, limit = 20) {
  const filePath = getKnowledgePath();
  const knowledge = readJSON(filePath, { insights: [], categories: {} });

  const ids = knowledge.categories[category] || [];
  return knowledge.insights
    .filter(i => ids.includes(i.id))
    .slice(-limit);
}

// === Conversation Storage ===

/**
 * 取得對話學習檔案路徑(按日期)
 */
function getConversationPath(date = null) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  return path.join(PATHS.conversations, `${dateStr}.json`);
}

/**
 * 儲存對話學習紀錄
 */
function saveConversationLearning(learning) {
  ensureStorageExists();
  const filePath = getConversationPath();
  return appendToJSONArray(filePath, {
    ...learning,
    timestamp: new Date().toISOString()
  }, 200);
}

/**
 * 取得今日對話學習
 */
function getTodayLearnings() {
  const filePath = getConversationPath();
  return readJSON(filePath, []);
}

/**
 * 取得最近 N 天的對話學習
 */
function getRecentLearnings(days = 7) {
  ensureStorageExists();
  const learnings = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const filePath = getConversationPath(dateStr);
    const dayLearnings = readJSON(filePath, []);
    learnings.push(...dayLearnings);
  }

  return learnings;
}

module.exports = {
  // Core
  PATHS,
  ensureStorageExists,
  readJSON,
  writeJSON,

  // Execution
  saveExecution,
  getLastExecution,
  getExecutionHistory,
  listTasks,

  // Persona
  savePersona,
  getPersona,

  // Knowledge
  addInsight,
  searchKnowledge,
  getInsightsByCategory,

  // Conversations
  saveConversationLearning,
  getTodayLearnings,
  getRecentLearnings
};
