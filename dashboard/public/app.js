/**
 * Iris Dashboard - Frontend Application
 */

let ws = null;
let tasksData = null;
let currentCategory = 'all';
let activityLog = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌿 Iris Dashboard initialized');
  connectWebSocket();
  loadStatus();
  loadTasks();
  startPeriodicUpdates();
});

// WebSocket Connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    showToast('🔌 Connected to Iris Dashboard', 'success');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };

  ws.onclose = () => {
    console.log('❌ WebSocket disconnected, reconnecting...');
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
  console.log('📨 WebSocket message:', data);

  switch (data.type) {
    case 'task-updated':
    case 'task-toggled':
      loadTasks();
      addActivity(`Task updated: ${data.task.name}`);
      break;
    case 'task-started':
      addActivity(`⚡ Task started: ${data.task.name}`, 'info');
      loadTasks();
      break;
    case 'task-completed':
      addActivity(`✅ Task completed: ${data.task.name}`, 'success');
      showToast(`✅ ${data.task.name} completed`, 'success');
      loadTasks();
      break;
    case 'task-error':
      addActivity(`❌ Task failed: ${data.task.name}`, 'error');
      showToast(`❌ ${data.task.name} failed`, 'error');
      loadTasks();
      break;
  }
}

// Load system status
async function loadStatus() {
  try {
    const response = await fetch('/api/status');
    const status = await response.json();

    // Update stats
    document.getElementById('stat-total').textContent = status.tasks.total;
    document.getElementById('stat-running').textContent = status.tasks.running;
    document.getElementById('stat-enabled').textContent = status.tasks.enabled;
    document.getElementById('stat-uptime').textContent = formatUptime(status.uptime);

    // Update MAGI status
    if (status.magi) {
      renderMAGIStatus(status.magi);
    }
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

// Render MAGI System Status
function renderMAGIStatus(magi) {
  const container = document.getElementById('magi-status');

  const machines = [magi.melchior, magi.balthasar, magi.caspar];
  container.innerHTML = machines.map(machine => `
    <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold">${machine.name}</h3>
        <div class="w-2 h-2 ${machine.status === 'online' ? 'bg-green-500' : 'bg-gray-500'} rounded-full"></div>
      </div>
      <p class="text-sm text-gray-400 mb-2">${machine.machine}</p>
      <p class="text-xs text-gray-500 mb-3">${machine.role}</p>
      <div class="flex items-center space-x-2">
        <span class="text-xs text-gray-400">Tasks:</span>
        <span class="text-sm font-bold text-iris-500">${machine.tasks}</span>
      </div>
    </div>
  `).join('');
}

// Load tasks
async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    tasksData = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
    showToast('❌ Failed to load tasks', 'error');
  }
}

// Render tasks
function renderTasks() {
  if (!tasksData) return;

  const container = document.getElementById('tasks-container');
  const filteredTasks = currentCategory === 'all'
    ? tasksData.tasks
    : tasksData.tasks.filter(t => t.category === currentCategory);

  if (filteredTasks.length === 0) {
    container.innerHTML = '<div class="text-gray-400 text-center py-8">No tasks in this category</div>';
    return;
  }

  container.innerHTML = filteredTasks.map(task => `
    <div class="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-iris-500 transition-colors">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4 flex-1">
          <span class="text-3xl">${task.icon}</span>
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-1">
              <h3 class="font-bold text-lg">${task.name}</h3>
              <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(task.status)}">
                ${task.status.toUpperCase()}
              </span>
              ${task.enabled ? '<span class="text-green-500 text-xs">●  Enabled</span>' : '<span class="text-gray-500 text-xs">● Disabled</span>'}
            </div>
            <p class="text-sm text-gray-400 mb-2">${task.description}</p>
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span>📅 ${task.schedule}</span>
              ${task.lastRun ? `<span>🕐 Last: ${formatDate(task.lastRun)}</span>` : '<span>🕐 Never run</span>'}
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            onclick="toggleTask('${task.id}')"
            class="px-4 py-2 ${task.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} rounded-lg text-sm font-medium transition-colors"
          >
            ${task.enabled ? '⏸ Disable' : '▶️ Enable'}
          </button>
          <button
            onclick="runTask('${task.id}')"
            class="px-4 py-2 bg-iris-600 hover:bg-iris-700 rounded-lg text-sm font-medium transition-colors"
            ${task.status === 'running' ? 'disabled' : ''}
          >
            ${task.status === 'running' ? '⏳ Running...' : '▶️ Run Now'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Filter by category
function filterCategory(category) {
  currentCategory = category;

  // Update tab styles
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.remove('text-iris-500', 'border-b-2', 'border-iris-500');
    tab.classList.add('text-gray-400');
  });

  event.target.classList.remove('text-gray-400');
  event.target.classList.add('text-iris-500', 'border-b-2', 'border-iris-500');

  renderTasks();
}

// Toggle task
async function toggleTask(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/toggle`, {
      method: 'POST'
    });

    if (response.ok) {
      const data = await response.json();
      showToast(`✅ Task ${data.task.enabled ? 'enabled' : 'disabled'}`, 'success');
      loadTasks();
      loadStatus();
    }
  } catch (error) {
    console.error('Error toggling task:', error);
    showToast('❌ Failed to toggle task', 'error');
  }
}

// Run task manually
async function runTask(taskId) {
  try {
    showToast('⚡ Starting task...', 'info');

    const response = await fetch(`/api/tasks/${taskId}/run`, {
      method: 'POST'
    });

    if (response.ok) {
      const data = await response.json();
      showToast('✅ Task started successfully', 'success');
    } else {
      const data = await response.json();
      showToast(`❌ Task failed: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error running task:', error);
    showToast('❌ Failed to run task', 'error');
  }
}

// Refresh tasks
function refreshTasks() {
  loadTasks();
  loadStatus();
  showToast('🔄 Refreshed', 'info');
}

// Add activity to log
function addActivity(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('zh-TW');
  activityLog.unshift({ message, type, timestamp });

  if (activityLog.length > 20) {
    activityLog.pop();
  }

  renderActivityLog();
}

// Render activity log
function renderActivityLog() {
  const container = document.getElementById('activity-log');

  if (activityLog.length === 0) {
    container.innerHTML = '<div class="text-gray-400 text-sm">No recent activity</div>';
    return;
  }

  container.innerHTML = activityLog.map(activity => `
    <div class="text-sm flex items-center space-x-2 py-2 border-b border-gray-700 last:border-0">
      <span class="text-gray-500 text-xs">${activity.timestamp}</span>
      <span class="flex-1">${activity.message}</span>
    </div>
  `).join('');
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-message');

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  icon.textContent = icons[type] || icons.info;
  msg.textContent = message;

  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.transform = 'translateY(100%)';
  }, 3000);
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function getStatusBadgeClass(status) {
  const classes = {
    running: 'bg-blue-500 text-white',
    idle: 'bg-gray-600 text-gray-300',
    error: 'bg-red-500 text-white'
  };
  return classes[status] || classes.idle;
}

// Periodic updates
function startPeriodicUpdates() {
  // Update status every 10 seconds
  setInterval(loadStatus, 10000);

  // Refresh tasks every 30 seconds
  setInterval(loadTasks, 30000);
}
