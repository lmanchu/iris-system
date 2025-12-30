#!/usr/bin/env node

/**
 * MAGI Memory Service
 * 統一的記憶服務層,整合執行追蹤、人格上下文、知識庫
 *
 * 提供給其他 MAGI 腳本使用的高階 API
 */

const storage = require('./storage');
const registry = require('./execution-registry');
const persona = require('./persona-context');

// ==========================================
// Execution Tracking
// ==========================================

/**
 * 開始追蹤任務執行
 * @param {string} taskName - 任務名稱
 * @param {object} metadata - 額外的 metadata
 * @returns {object} 執行上下文物件,包含 end() 和 fail() 方法
 */
function startExecution(taskName, metadata = {}) {
  return registry.startExecution(taskName, metadata);
}

/**
 * 記錄任務執行結果
 */
async function recordExecution(taskName, options) {
  return registry.recordExecution(taskName, options);
}

/**
 * 取得任務最後執行結果
 */
async function getLastExecution(taskName) {
  return registry.getLastExecution(taskName);
}

/**
 * 取得任務執行歷史
 */
async function getExecutionHistory(taskName, limit = 10) {
  return registry.getExecutionHistory(taskName, limit);
}

/**
 * 檢查任務今天是否已執行
 */
async function hasRunToday(taskName) {
  return registry.hasRunToday(taskName);
}

/**
 * 取得今日任務執行摘要
 */
async function getTodaySummary() {
  return registry.getTodaySummary();
}

// ==========================================
// Persona & Context
// ==========================================

/**
 * 取得完整人格資料
 */
async function getPersona() {
  return persona.getPersona();
}

/**
 * 取得人格摘要（適合 AI 使用）
 */
async function getPersonaSummary() {
  return persona.getPersonaSummary();
}

/**
 * 取得與查詢相關的上下文
 */
async function getContext(query) {
  return persona.getContext(query);
}

/**
 * 取得使用者偏好設定
 */
async function getPreferences() {
  return persona.getPreferences();
}

/**
 * 同步人格資料到 memory storage
 */
async function syncPersona() {
  return persona.syncPersona();
}

// ==========================================
// Knowledge Base
// ==========================================

/**
 * 新增洞察到知識庫
 * @param {object} insight - { insight, category?, source? }
 */
async function addInsight(insight) {
  return storage.addInsight(insight);
}

/**
 * 搜尋知識庫
 */
async function searchKnowledge(query, options = {}) {
  return storage.searchKnowledge(query, options);
}

/**
 * 取得特定類別的洞察
 */
async function getInsightsByCategory(category, limit = 20) {
  return storage.getInsightsByCategory(category, limit);
}

// ==========================================
// Conversation Learning
// ==========================================

/**
 * 儲存對話學習紀錄
 */
async function saveConversationLearning(learning) {
  return storage.saveConversationLearning(learning);
}

/**
 * 取得今日對話學習
 */
async function getTodayLearnings() {
  return storage.getTodayLearnings();
}

/**
 * 取得最近 N 天的對話學習
 */
async function getRecentLearnings(days = 7) {
  return storage.getRecentLearnings(days);
}

// ==========================================
// Convenience Methods
// ==========================================

/**
 * 取得任務執行時的完整上下文
 * 這是主要的任務啟動 API,提供前次執行資訊 + 人格上下文
 */
async function getTaskContext(taskName, query = null) {
  const [lastRun, personaData, relevantContext] = await Promise.all([
    getLastExecution(taskName),
    getPersonaSummary(),
    query ? getContext(query) : null
  ]);

  return {
    taskName,
    lastRun,
    persona: personaData,
    context: relevantContext,
    timestamp: new Date().toISOString()
  };
}

/**
 * 一次性取得所有任務狀態
 */
async function getAllTasksStatus() {
  const tasks = await registry.listAllTasks();
  return registry.getTasksStatus(tasks);
}

/**
 * 取得系統整體健康狀態
 */
async function getSystemHealth() {
  const summary = await getTodaySummary();
  const persona = await getPersonaSummary();

  return {
    date: summary.date,
    tasksRun: summary.totalTasks,
    successRate: summary.totalTasks > 0
      ? Math.round((summary.successCount / summary.totalTasks) * 100)
      : 100,
    failedTasks: summary.tasks.filter(t => t.status === 'failed'),
    personaVersion: persona?.version || null,
    personaType: persona?.type || null,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  // Execution
  startExecution,
  recordExecution,
  getLastExecution,
  getExecutionHistory,
  hasRunToday,
  getTodaySummary,

  // Persona
  getPersona,
  getPersonaSummary,
  getContext,
  getPreferences,
  syncPersona,

  // Knowledge
  addInsight,
  searchKnowledge,
  getInsightsByCategory,

  // Conversation Learning
  saveConversationLearning,
  getTodayLearnings,
  getRecentLearnings,

  // Convenience
  getTaskContext,
  getAllTasksStatus,
  getSystemHealth,

  // Expose sub-modules for advanced usage
  storage,
  registry,
  persona
};
