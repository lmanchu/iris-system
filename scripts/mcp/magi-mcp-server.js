#!/usr/bin/env node

/**
 * MAGI Memory MCP Server
 * 提供 MCP 介面讓 AI 客戶端 (Claude Desktop, Cursor, Claude Code) 存取 MAGI 記憶服務
 *
 * Protocol: MCP (Model Context Protocol)
 * Transport: STDIO (標準輸入輸出)
 *
 * Tools:
 * - get_persona: 取得使用者人格資料
 * - get_context: 取得與查詢相關的上下文
 * - get_preferences: 取得使用者偏好設定
 * - get_task_history: 取得任務執行歷史
 * - add_insight: 新增洞察到知識庫
 * - search_knowledge: 搜尋知識庫
 * - get_system_status: 取得系統狀態
 */

const magi = require('../lib/magi-memory');

// MCP Protocol Handler
class MCPServer {
  constructor() {
    this.buffer = '';
    this.serverInfo = {
      name: 'magi-memory',
      version: '1.0.0'
    };
  }

  start() {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => this.handleInput(chunk));
    process.stdin.on('end', () => process.exit(0));

    // 設定 stdout 為非緩衝模式
    if (process.stdout._handle && process.stdout._handle.setBlocking) {
      process.stdout._handle.setBlocking(true);
    }

    this.log('MAGI Memory MCP Server started');
  }

  log(message) {
    // 寫入到 stderr 以免干擾 STDIO 協議
    process.stderr.write(`[MAGI-MCP] ${message}\n`);
  }

  handleInput(chunk) {
    this.buffer += chunk;

    // 處理多個訊息（用換行分隔）
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        this.processMessage(line.trim());
      }
    }
  }

  processMessage(line) {
    let request;
    try {
      request = JSON.parse(line);
    } catch (e) {
      this.sendError(null, -32700, 'Parse error');
      return;
    }

    this.handleRequest(request);
  }

  async handleRequest(request) {
    const { id, method, params } = request;

    try {
      let result;

      switch (method) {
        case 'initialize':
          result = this.handleInitialize(params);
          break;

        case 'tools/list':
          result = this.handleToolsList();
          break;

        case 'tools/call':
          result = await this.handleToolCall(params);
          break;

        case 'notifications/initialized':
          // 確認初始化完成
          return;

        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
          return;
      }

      this.sendResponse(id, result);
    } catch (error) {
      this.log(`Error handling ${method}: ${error.message}`);
      this.sendError(id, -32603, error.message);
    }
  }

  handleInitialize(params) {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: this.serverInfo
    };
  }

  handleToolsList() {
    return {
      tools: [
        {
          name: 'get_persona',
          description: '取得使用者人格資料,包含 MBTI 類型、工作風格、興趣等',
          inputSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'boolean',
                description: '是否只返回摘要 (預設: true)',
                default: true
              }
            }
          }
        },
        {
          name: 'get_context',
          description: '根據查詢取得相關的人格上下文和知識',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '查詢內容,例如 "investment analysis", "工作習慣"'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'get_preferences',
          description: '取得使用者偏好設定,包含溝通風格、工作偏好等',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_task_history',
          description: '取得 MAGI 自動化任務的執行歷史',
          inputSchema: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description: '任務名稱,例如 "daily-brief", "invest-analysis"'
              },
              limit: {
                type: 'number',
                description: '返回數量限制 (預設: 5)',
                default: 5
              }
            }
          }
        },
        {
          name: 'add_insight',
          description: '新增一條洞察到知識庫,用於記錄從對話中學到的資訊',
          inputSchema: {
            type: 'object',
            properties: {
              insight: {
                type: 'string',
                description: '洞察內容'
              },
              category: {
                type: 'string',
                description: '類別: preferences, communication_style, interests, work_habits, general',
                enum: ['preferences', 'communication_style', 'interests', 'work_habits', 'general']
              },
              source: {
                type: 'string',
                description: '來源說明 (預設: conversation)'
              }
            },
            required: ['insight']
          }
        },
        {
          name: 'search_knowledge',
          description: '搜尋知識庫中的洞察',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜尋關鍵字'
              },
              category: {
                type: 'string',
                description: '限定搜尋的類別'
              },
              limit: {
                type: 'number',
                description: '返回數量限制 (預設: 10)',
                default: 10
              }
            },
            required: ['query']
          }
        },
        {
          name: 'get_system_status',
          description: '取得 MAGI 系統狀態,包含今日任務執行摘要',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  }

  async handleToolCall(params) {
    const { name, arguments: args = {} } = params;

    this.log(`Tool call: ${name} with args: ${JSON.stringify(args)}`);

    let result;

    switch (name) {
      case 'get_persona':
        if (args.summary === false) {
          result = await magi.getPersona();
        } else {
          result = await magi.getPersonaSummary();
        }
        break;

      case 'get_context':
        result = await magi.getContext(args.query);
        break;

      case 'get_preferences':
        result = await magi.getPreferences();
        break;

      case 'get_task_history':
        if (args.task) {
          result = await magi.getExecutionHistory(args.task, args.limit || 5);
        } else {
          result = await magi.getTodaySummary();
        }
        break;

      case 'add_insight':
        result = await magi.addInsight({
          insight: args.insight,
          category: args.category || 'general',
          source: args.source || 'conversation'
        });
        break;

      case 'search_knowledge':
        result = await magi.searchKnowledge(args.query, {
          category: args.category,
          limit: args.limit || 10
        });
        break;

      case 'get_system_status':
        result = await magi.getSystemHealth();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    this.send(response);
  }

  sendError(id, code, message) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: { code, message }
    };
    this.send(response);
  }

  send(message) {
    const json = JSON.stringify(message);
    process.stdout.write(json + '\n');
  }
}

// 啟動伺服器
const server = new MCPServer();
server.start();
