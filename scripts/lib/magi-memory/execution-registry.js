#!/usr/bin/env node

/**
 * MAGI Execution Registry
 * 追蹤自動化任務的執行狀態,提供跨任務協調能力
 *
 * Features:
 * - 記錄任務執行結果
 * - 追蹤任務間的依賴關係
 * - 提供執行狀態查詢
 * - 支援任務協調 (coordination)
 */

const storage = require('./storage');

// 執行狀態常量
const STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  RUNNING: 'running'
};

/**
 * 建立執行紀錄物件
 */
function createExecutionRecord(taskName, options = {}) {
  return {
    taskName,
    status: options.status || STATUS.SUCCESS,
    startTime: options.startTime || new Date().toISOString(),
    endTime: options.endTime || new Date().toISOString(),
    duration: options.duration || 0,
    output: options.output || null,
    error: options.error || null,
    metadata: options.metadata || {},
    version: '1.0'
  };
}

/**
 * 記錄任務開始執行
 * @returns {object} 執行上下文,用於結束時傳入
 */
function startExecution(taskName, metadata = {}) {
  const startTime = Date.now();

  return {
    taskName,
    startTime,
    startTimeISO: new Date(startTime).toISOString(),
    metadata,

    // 便利方法:結束執行
    end: async function (result = {}) {
      return recordExecution(taskName, {
        ...result,
        startTime: this.startTimeISO,
        duration: Date.now() - this.startTime,
        metadata: { ...this.metadata, ...result.metadata }
      });
    },

    // 便利方法:標記失敗
    fail: async function (error, metadata = {}) {
      return recordExecution(taskName, {
        status: STATUS.FAILED,
        error: error?.message || String(error),
        startTime: this.startTimeISO,
        duration: Date.now() - this.startTime,
        metadata: { ...this.metadata, ...metadata }
      });
    }
  };
}

/**
 * 記錄任務執行結果
 */
async function recordExecution(taskName, options = {}) {
  const record = createExecutionRecord(taskName, options);
  const success = storage.saveExecution(taskName, record);

  if (success) {
    console.log(`[MAGI] Recorded execution: ${taskName} - ${record.status}`);
  }

  return success ? record : null;
}

/**
 * 取得任務最後執行結果
 */
async function getLastExecution(taskName) {
  return storage.getLastExecution(taskName);
}

/**
 * 取得任務執行歷史
 */
async function getExecutionHistory(taskName, limit = 10) {
  return storage.getExecutionHistory(taskName, limit);
}

/**
 * 檢查任務今天是否已執行
 */
async function hasRunToday(taskName) {
  const last = await getLastExecution(taskName);
  if (!last?.timestamp) return false;

  const today = new Date().toISOString().split('T')[0];
  const lastRunDate = last.timestamp.split('T')[0];

  return today === lastRunDate;
}

/**
 * 取得任務自從上次執行以來的時間(毫秒)
 */
async function timeSinceLastRun(taskName) {
  const last = await getLastExecution(taskName);
  if (!last?.timestamp) return Infinity;

  return Date.now() - new Date(last.timestamp).getTime();
}

/**
 * 列出所有已知任務
 */
async function listAllTasks() {
  return storage.listTasks();
}

/**
 * 取得多個任務的最後執行狀態
 */
async function getTasksStatus(taskNames) {
  const results = {};

  for (const name of taskNames) {
    const last = await getLastExecution(name);
    results[name] = {
      lastRun: last?.timestamp || null,
      status: last?.status || 'never_run',
      duration: last?.duration || 0
    };
  }

  return results;
}

/**
 * 取得今日所有任務執行摘要
 */
async function getTodaySummary() {
  const tasks = await listAllTasks();
  const today = new Date().toISOString().split('T')[0];
  const summary = {
    date: today,
    totalTasks: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    tasks: []
  };

  for (const taskName of tasks) {
    const last = await getLastExecution(taskName);
    if (!last?.timestamp) continue;

    const runDate = last.timestamp.split('T')[0];
    if (runDate !== today) continue;

    summary.totalTasks++;
    summary.tasks.push({
      name: taskName,
      status: last.status,
      time: last.timestamp,
      duration: last.duration
    });

    switch (last.status) {
      case STATUS.SUCCESS:
        summary.successCount++;
        break;
      case STATUS.FAILED:
        summary.failedCount++;
        break;
      case STATUS.SKIPPED:
        summary.skippedCount++;
        break;
    }
  }

  return summary;
}

/**
 * 取得任務執行統計
 */
async function getTaskStats(taskName, days = 30) {
  const history = await getExecutionHistory(taskName, days * 3); // 假設每天最多跑 3 次

  if (history.length === 0) {
    return null;
  }

  const stats = {
    taskName,
    totalRuns: history.length,
    successRate: 0,
    avgDuration: 0,
    lastRun: history[history.length - 1]?.timestamp,
    firstRun: history[0]?.timestamp
  };

  const successCount = history.filter(h => h.status === STATUS.SUCCESS).length;
  stats.successRate = Math.round((successCount / history.length) * 100);

  const durations = history.filter(h => h.duration > 0).map(h => h.duration);
  if (durations.length > 0) {
    stats.avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  return stats;
}

module.exports = {
  STATUS,
  startExecution,
  recordExecution,
  getLastExecution,
  getExecutionHistory,
  hasRunToday,
  timeSinceLastRun,
  listAllTasks,
  getTasksStatus,
  getTodaySummary,
  getTaskStats
};
