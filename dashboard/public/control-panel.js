/**
 * Iris Control Panel - Frontend Logic
 * 管理所有自動化任務的前端控制邏輯
 */

let agents = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎛️ Iris Control Panel loaded');
  loadAgents();
});

// 載入所有 LaunchAgents
async function loadAgents() {
  try {
    showLoading();

    const response = await fetch('/api/launchagents');
    const data = await response.json();

    if (data.success) {
      agents = data.agents;
      renderAgents();
      hideLoading();
    } else {
      showError('載入失敗: ' + data.error);
    }
  } catch (error) {
    console.error('Error loading agents:', error);
    showError('無法連接到服務器');
  }
}

// 渲染所有 Agents
function renderAgents() {
  const container = document.getElementById('agentsContainer');
  container.innerHTML = '';

  agents.forEach(agent => {
    const card = createAgentCard(agent);
    container.appendChild(card);
  });
}

// 創建 Agent 卡片
function createAgentCard(agent) {
  const card = document.createElement('div');
  card.className = 'border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow';
  card.id = `agent-${agent.label}`;

  const statusClass = agent.status.running ? 'status-running' :
                      agent.status.loaded ? 'status-loaded' : 'status-stopped';
  const statusText = agent.status.running ? '🟢 運行中' :
                    agent.status.loaded ? '🔵 已載入' : '⚪ 已停止';

  card.innerHTML = `
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-xl font-bold text-gray-800">${agent.name}</h3>
        <p class="text-sm text-gray-500 mt-1">${agent.label}</p>
      </div>
      <div class="flex gap-2 items-center">
        <span class="status-badge ${statusClass}">${statusText}</span>
        <label class="toggle-switch">
          <input type="checkbox" ${agent.enabled ? 'checked' : ''}
                 onchange="toggleAgent('${agent.label}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- Schedules -->
    <div class="mb-4">
      <h4 class="text-sm font-semibold text-gray-700 mb-2">⏰ 執行時間</h4>
      <div id="schedules-${agent.label}" class="space-y-2">
        ${agent.schedules.map((schedule, index) => createScheduleInput(agent.label, schedule, index)).join('')}
      </div>
      <button onclick="addSchedule('${agent.label}')"
              class="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium">
        + 新增時間
      </button>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 flex-wrap">
      <button onclick="saveSchedules('${agent.label}')"
              class="btn btn-primary text-sm">
        💾 儲存
      </button>
      <button onclick="triggerAgent('${agent.label}')"
              class="btn btn-secondary text-sm">
        ▶️ 手動執行
      </button>
      <button onclick="reloadAgent('${agent.label}')"
              class="btn btn-secondary text-sm">
        🔄 重新載入
      </button>
      <button onclick="viewLogs('${agent.label}')"
              class="btn btn-secondary text-sm">
        📄 查看日誌
      </button>
    </div>

    <!-- Script Path -->
    ${agent.scriptPath ? `
      <div class="mt-4 text-xs text-gray-500">
        📁 ${agent.scriptPath}
      </div>
    ` : ''}
  `;

  return card;
}

// 創建時間輸入框
function createScheduleInput(label, schedule, index) {
  return `
    <div class="flex gap-2 items-center">
      <input type="number"
             class="time-input"
             id="${label}-hour-${index}"
             min="0" max="23"
             value="${schedule.hour}"
             placeholder="時">
      <span class="font-bold">:</span>
      <input type="number"
             class="time-input"
             id="${label}-minute-${index}"
             min="0" max="59"
             value="${schedule.minute}"
             placeholder="分">
      <span class="text-sm text-gray-600 ml-2">(${schedule.time})</span>
      ${index > 0 ? `
        <button onclick="removeSchedule('${label}', ${index})"
                class="ml-auto text-red-500 hover:text-red-700">
          🗑️
        </button>
      ` : ''}
    </div>
  `;
}

// 儲存排程
async function saveSchedules(label) {
  const agent = agents.find(a => a.label === label);
  if (!agent) return;

  const schedules = [];
  agent.schedules.forEach((schedule, index) => {
    const hourInput = document.getElementById(`${label}-hour-${index}`);
    const minuteInput = document.getElementById(`${label}-minute-${index}`);

    if (hourInput && minuteInput) {
      schedules.push({
        hour: parseInt(hourInput.value),
        minute: parseInt(minuteInput.value)
      });
    }
  });

  try {
    const response = await fetch(`/api/launchagents/${label}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules })
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ 排程已更新！', 'success');
      await loadAgents();
    } else {
      showToast('❌ 更新失敗: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error saving schedules:', error);
    showToast('❌ 儲存失敗', 'error');
  }
}

// 開關 Agent
async function toggleAgent(label, enabled) {
  try {
    const response = await fetch(`/api/launchagents/${label}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });

    const data = await response.json();

    if (data.success) {
      showToast(enabled ? '✅ 已啟用' : '⏸️ 已停用', 'success');
      await loadAgents();
    } else {
      showToast('❌ 操作失敗: ' + data.error, 'error');
      await loadAgents(); // Reload to reset toggle
    }
  } catch (error) {
    console.error('Error toggling agent:', error);
    showToast('❌ 操作失敗', 'error');
    await loadAgents();
  }
}

// 手動觸發 Agent
async function triggerAgent(label) {
  if (!confirm('確定要立即執行這個任務嗎？')) return;

  try {
    showToast('⏳ 正在執行...', 'info');

    const response = await fetch(`/api/launchagents/${label}/trigger`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ 任務已觸發', 'success');
    } else {
      showToast('❌ 執行失敗: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error triggering agent:', error);
    showToast('❌ 執行失敗', 'error');
  }
}

// 重新載入 Agent
async function reloadAgent(label) {
  try {
    showToast('⏳ 重新載入中...', 'info');

    const response = await fetch(`/api/launchagents/${label}/reload`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ 已重新載入', 'success');
      await loadAgents();
    } else {
      showToast('❌ 重新載入失敗: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error reloading agent:', error);
    showToast('❌ 重新載入失敗', 'error');
  }
}

// 查看日誌
function viewLogs(label) {
  const agent = agents.find(a => a.label === label);
  if (!agent) return;

  const logPath = agent.standardOutPath || agent.standardErrorPath;
  if (logPath) {
    alert(`日誌檔案位置：\n\n${logPath}\n${agent.standardErrorPath || ''}\n\n請在終端機使用以下命令查看：\ntail -f ${logPath}`);
  } else {
    alert('此任務沒有設定日誌檔案');
  }
}

// 新增排程時間
function addSchedule(label) {
  const agent = agents.find(a => a.label === label);
  if (!agent) return;

  agent.schedules.push({ hour: 12, minute: 0 });
  const card = document.getElementById(`agent-${label}`);
  const container = card.querySelector(`#schedules-${label}`);

  const newSchedule = createScheduleInput(label, { hour: 12, minute: 0 }, agent.schedules.length - 1);
  const div = document.createElement('div');
  div.innerHTML = newSchedule;
  container.appendChild(div.firstElementChild);
}

// 移除排程時間
function removeSchedule(label, index) {
  const agent = agents.find(a => a.label === label);
  if (!agent) return;

  agent.schedules.splice(index, 1);
  renderAgents();
}

// 刷新 Agents
async function refreshAgents() {
  await loadAgents();
  showToast('✅ 已刷新', 'success');
}

// UI 狀態管理
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('agentsList').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('agentsList').classList.remove('hidden');
}

function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('agentsList').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('errorMessage').textContent = message;
}

// Toast 通知
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  toastIcon.textContent = icons[type] || icons.info;
  toastMessage.textContent = message;

  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
