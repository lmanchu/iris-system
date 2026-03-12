#!/usr/bin/env node

/**
 * MAGI Memory - Unified Memory Service for MAGI Automation System
 *
 * 統一的記憶服務層,讓 80+ 自動化任務能夠:
 * 1. 共享執行狀態和上下文
 * 2. 存取使用者人格資料 (Mnemosyne)
 * 3. 累積和查詢知識洞察
 * 4. 從對話中學習使用者偏好
 *
 * Usage:
 *   const magi = require('../lib/magi-memory');
 *
 *   // 任務執行追蹤
 *   const exec = magi.startExecution('daily-brief');
 *   // ... 執行任務 ...
 *   await exec.end({ status: 'success', output: '/path/to/output.md' });
 *
 *   // 取得任務上下文
 *   const ctx = await magi.getTaskContext('daily-brief', 'investment analysis');
 *
 *   // 取得人格摘要
 *   const persona = await magi.getPersonaSummary();
 *
 *   // 新增洞察
 *   await magi.addInsight({
 *     category: 'preferences',
 *     insight: '使用者偏好簡潔的報告格式',
 *     source: 'daily-brief'
 *   });
 *
 * @module magi-memory
 * @version 1.0.0
 */

const memoryService = require('./memory-service');

// Re-export all methods from memory-service
module.exports = memoryService;

// CLI entry point for testing
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  async function runCLI() {
    console.log('\n🧠 MAGI Memory Service CLI\n');

    switch (command) {
      case 'status':
        const health = await memoryService.getSystemHealth();
        console.log('System Health:');
        console.log(JSON.stringify(health, null, 2));
        break;

      case 'tasks':
        const tasks = await memoryService.getAllTasksStatus();
        console.log('Task Status:');
        console.log(JSON.stringify(tasks, null, 2));
        break;

      case 'today':
        const summary = await memoryService.getTodaySummary();
        console.log('Today Summary:');
        console.log(JSON.stringify(summary, null, 2));
        break;

      case 'persona':
        const persona = await memoryService.getPersona();
        console.log('Persona:');
        console.log(JSON.stringify(persona, null, 2));
        break;

      case 'sync':
        const result = await memoryService.syncPersona();
        console.log('Sync Result:');
        console.log(JSON.stringify(result, null, 2));
        break;

      case 'context':
        const query = args[1] || 'work';
        const ctx = await memoryService.getContext(query);
        console.log(`Context for "${query}":`);
        console.log(JSON.stringify(ctx, null, 2));
        break;

      case 'search':
        const searchQuery = args[1] || '';
        if (!searchQuery) {
          console.log('Usage: node index.js search <query>');
          break;
        }
        const results = await memoryService.searchKnowledge(searchQuery);
        console.log(`Search results for "${searchQuery}":`);
        console.log(JSON.stringify(results, null, 2));
        break;

      case 'add-insight':
        const insight = args[1];
        const category = args[2] || 'general';
        if (!insight) {
          console.log('Usage: node index.js add-insight <insight> [category]');
          break;
        }
        const added = await memoryService.addInsight({
          insight,
          category,
          source: 'cli'
        });
        console.log('Added insight:');
        console.log(JSON.stringify(added, null, 2));
        break;

      case 'help':
      default:
        console.log('Commands:');
        console.log('  status        - Show system health');
        console.log('  tasks         - Show all tasks status');
        console.log('  today         - Show today\'s summary');
        console.log('  persona       - Show persona data');
        console.log('  sync          - Sync persona from file');
        console.log('  context <q>   - Get context for query');
        console.log('  search <q>    - Search knowledge base');
        console.log('  add-insight <text> [category] - Add insight');
        console.log('  help          - Show this help');
        break;
    }
  }

  runCLI().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
