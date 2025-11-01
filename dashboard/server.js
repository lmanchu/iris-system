/**
 * Iris Dashboard Server
 * 統一管理所有 Iris AI Butler 自動化任務
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const { exec } = require('child_process');
const util = require('util');
const launchAgentControl = require('./launchagent-control');

const execPromise = util.promisify(exec);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3030;
const CONFIG_PATH = path.join(__dirname, 'config', 'tasks.json');
const PKM_PATH = '/Users/lman/Dropbox/PKM-Vault/.ai-butler-system';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('✅ New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
    clients.delete(ws);
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Load tasks configuration
async function loadTasks() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading tasks:', error);
    return { tasks: [], categories: {} };
  }
}

// Save tasks configuration
async function saveTasks(config) {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving tasks:', error);
    return false;
  }
}

// Calculate next run time based on cron schedule
function getNextRun(cronSchedule) {
  try {
    const job = cron.schedule(cronSchedule, () => {}, { scheduled: false });
    // This is a placeholder - we'll implement proper next run calculation
    return new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
  } catch (error) {
    return null;
  }
}

// Get LaunchAgent status
async function getLaunchAgentStatus(taskId) {
  try {
    const { stdout } = await execPromise(`launchctl list | grep ${taskId}`);
    return stdout.trim().length > 0 ? 'running' : 'stopped';
  } catch (error) {
    return 'unknown';
  }
}

// Get MAGI system status
async function getMAGIStatus() {
  try {
    const tasksPath = path.join(PKM_PATH, 'shared-context', 'TASKS.md');
    const tasksContent = await fs.readFile(tasksPath, 'utf8');

    return {
      melchior: {
        name: 'Iris (Melchior)',
        machine: 'Mac Studio M2 Ultra',
        status: 'online',
        role: '主力工作站與中樞協調者',
        tasks: tasksContent.split('\n').filter(line => line.includes('Melchior')).length
      },
      balthasar: {
        name: 'MAGI (Balthasar)',
        machine: 'MacBook Air M4',
        status: 'online',
        role: '移動工作站',
        tasks: tasksContent.split('\n').filter(line => line.includes('Balthasar')).length
      },
      caspar: {
        name: 'Clippy (Caspar)',
        machine: 'Windows AIPC',
        status: 'standby',
        role: '備援系統',
        tasks: tasksContent.split('\n').filter(line => line.includes('Caspar')).length
      }
    };
  } catch (error) {
    console.error('Error getting MAGI status:', error);
    return null;
  }
}

// Get recent logs
async function getRecentLogs(limit = 20) {
  try {
    const logsDir = path.join(__dirname, 'logs');
    const files = await fs.readdir(logsDir);

    const logs = [];
    for (const file of files.slice(0, limit)) {
      const content = await fs.readFile(path.join(logsDir, file), 'utf8');
      logs.push({
        file,
        timestamp: file.match(/\d{4}-\d{2}-\d{2}/)?.[0],
        content: content.split('\n').slice(0, 10).join('\n')
      });
    }

    return logs;
  } catch (error) {
    return [];
  }
}

// API Routes

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  const config = await loadTasks();
  res.json(config);
});

// Get single task
app.get('/api/tasks/:id', async (req, res) => {
  const config = await loadTasks();
  const task = config.tasks.find(t => t.id === req.params.id);

  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  const config = await loadTasks();
  const taskIndex = config.tasks.findIndex(t => t.id === req.params.id);

  if (taskIndex !== -1) {
    config.tasks[taskIndex] = { ...config.tasks[taskIndex], ...req.body };
    await saveTasks(config);

    // Broadcast update to all clients
    broadcast({ type: 'task-updated', task: config.tasks[taskIndex] });

    res.json(config.tasks[taskIndex]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Toggle task enabled/disabled
app.post('/api/tasks/:id/toggle', async (req, res) => {
  const config = await loadTasks();
  const task = config.tasks.find(t => t.id === req.params.id);

  if (task) {
    task.enabled = !task.enabled;
    await saveTasks(config);

    broadcast({ type: 'task-toggled', task });

    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Manually trigger a task
app.post('/api/tasks/:id/run', async (req, res) => {
  const config = await loadTasks();
  const task = config.tasks.find(t => t.id === req.params.id);

  if (task) {
    try {
      // Update task status
      task.status = 'running';
      task.lastRun = new Date().toISOString();
      await saveTasks(config);

      broadcast({ type: 'task-started', task });

      // Execute the task
      const scriptPath = task.scriptPath.replace('~', process.env.HOME);
      const { stdout, stderr } = await execPromise(`node ${scriptPath}`);

      // Update task status
      task.status = 'idle';
      await saveTasks(config);

      broadcast({ type: 'task-completed', task, output: stdout });

      res.json({ success: true, output: stdout, error: stderr });
    } catch (error) {
      task.status = 'error';
      await saveTasks(config);

      broadcast({ type: 'task-error', task, error: error.message });

      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Get system status
app.get('/api/status', async (req, res) => {
  const config = await loadTasks();
  const magiStatus = await getMAGIStatus();

  const status = {
    timestamp: new Date().toISOString(),
    tasks: {
      total: config.tasks.length,
      enabled: config.tasks.filter(t => t.enabled).length,
      running: config.tasks.filter(t => t.status === 'running').length,
      idle: config.tasks.filter(t => t.status === 'idle').length
    },
    magi: magiStatus,
    uptime: process.uptime()
  };

  res.json(status);
});

// Get logs
app.get('/api/logs', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const logs = await getRecentLogs(limit);
  res.json(logs);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== LaunchAgent Control Panel API =====

// Get all LaunchAgents
app.get('/api/launchagents', async (req, res) => {
  try {
    const agents = await launchAgentControl.getAllLaunchAgents();
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single LaunchAgent
app.get('/api/launchagents/:label', async (req, res) => {
  try {
    const agent = await launchAgentControl.getLaunchAgent(req.params.label);
    if (agent) {
      res.json({ success: true, agent });
    } else {
      res.status(404).json({ success: false, error: 'Agent not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update LaunchAgent schedule
app.put('/api/launchagents/:label/schedule', async (req, res) => {
  try {
    const { schedules } = req.body;
    const result = await launchAgentControl.updateLaunchAgentSchedule(req.params.label, schedules);

    if (result.success) {
      broadcast({ type: 'launchagent-updated', label: req.params.label });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle LaunchAgent enabled/disabled
app.post('/api/launchagents/:label/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await launchAgentControl.toggleLaunchAgent(req.params.label, enabled);

    if (result.success) {
      broadcast({ type: 'launchagent-toggled', label: req.params.label, enabled });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reload LaunchAgent
app.post('/api/launchagents/:label/reload', async (req, res) => {
  try {
    const result = await launchAgentControl.reloadLaunchAgent(req.params.label);

    if (result.success) {
      broadcast({ type: 'launchagent-reloaded', label: req.params.label });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger LaunchAgent manually
app.post('/api/launchagents/:label/trigger', async (req, res) => {
  try {
    const result = await launchAgentControl.triggerLaunchAgent(req.params.label);

    if (result.success) {
      broadcast({ type: 'launchagent-triggered', label: req.params.label });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║   🌿 Iris Dashboard Server Running        ║
║                                            ║
║   📡 HTTP: http://localhost:${PORT}         ║
║   🔌 WebSocket: ws://localhost:${PORT}      ║
║                                            ║
║   📊 Dashboard: http://localhost:${PORT}    ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
