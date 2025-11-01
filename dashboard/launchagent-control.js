/**
 * LaunchAgent Control Module
 * 管理 macOS LaunchAgent plist 檔案的讀寫和重新載入
 */

const fs = require('fs').promises;
const path = require('path');
const plist = require('plist');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const LAUNCH_AGENTS_DIR = path.join(process.env.HOME, 'Library', 'LaunchAgents');

/**
 * 獲取所有 Iris 相關的 LaunchAgent
 */
async function getAllLaunchAgents() {
  try {
    const files = await fs.readdir(LAUNCH_AGENTS_DIR);
    const irisAgents = files.filter(file =>
      file.startsWith('com.lman.') || file.startsWith('com.dayflow.')
    );

    const agents = [];
    for (const file of irisAgents) {
      const agent = await getLaunchAgent(file.replace('.plist', ''));
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  } catch (error) {
    console.error('Error getting LaunchAgents:', error);
    return [];
  }
}

/**
 * 獲取單個 LaunchAgent 的詳細資訊
 */
async function getLaunchAgent(label) {
  try {
    const plistPath = path.join(LAUNCH_AGENTS_DIR, `${label}.plist`);
    const plistContent = await fs.readFile(plistPath, 'utf8');
    const plistData = plist.parse(plistContent);

    // 解析執行時間
    const schedules = parseSchedules(plistData.StartCalendarInterval);

    // 獲取運行狀態
    const status = await getLaunchAgentStatus(label);

    // 解析腳本路徑
    const scriptPath = plistData.ProgramArguments && plistData.ProgramArguments.length > 1
      ? plistData.ProgramArguments[1]
      : null;

    return {
      label,
      name: formatName(label),
      plistPath,
      schedules,
      status,
      scriptPath,
      enabled: !plistData.Disabled,
      environmentVars: plistData.EnvironmentVariables || {},
      runAtLoad: plistData.RunAtLoad || false,
      standardOutPath: plistData.StandardOutPath,
      standardErrorPath: plistData.StandardErrorPath
    };
  } catch (error) {
    console.error(`Error getting LaunchAgent ${label}:`, error);
    return null;
  }
}

/**
 * 解析排程時間
 */
function parseSchedules(startCalendarInterval) {
  if (!startCalendarInterval) {
    return [];
  }

  // 單一時間
  if (!Array.isArray(startCalendarInterval)) {
    return [formatSchedule(startCalendarInterval)];
  }

  // 多個時間
  return startCalendarInterval.map(formatSchedule);
}

/**
 * 格式化排程時間
 */
function formatSchedule(schedule) {
  const hour = schedule.Hour !== undefined ? schedule.Hour : '*';
  const minute = schedule.Minute !== undefined ? schedule.Minute : 0;
  const day = schedule.Day;
  const weekday = schedule.Weekday;

  return {
    hour,
    minute,
    day,
    weekday,
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    cron: buildCronExpression(minute, hour, day, weekday)
  };
}

/**
 * 建立 cron 表達式
 */
function buildCronExpression(minute, hour, day, weekday) {
  const m = minute !== undefined ? minute : 0;
  const h = hour !== undefined ? hour : '*';
  const d = day !== undefined ? day : '*';
  const w = weekday !== undefined ? weekday : '*';

  return `${m} ${h} ${d} * ${w}`;
}

/**
 * 更新 LaunchAgent 的排程時間
 */
async function updateLaunchAgentSchedule(label, schedules) {
  try {
    const plistPath = path.join(LAUNCH_AGENTS_DIR, `${label}.plist`);
    const plistContent = await fs.readFile(plistPath, 'utf8');
    const plistData = plist.parse(plistContent);

    // 更新排程
    if (schedules.length === 1) {
      plistData.StartCalendarInterval = {
        Hour: parseInt(schedules[0].hour),
        Minute: parseInt(schedules[0].minute)
      };

      if (schedules[0].day) {
        plistData.StartCalendarInterval.Day = parseInt(schedules[0].day);
      }
      if (schedules[0].weekday) {
        plistData.StartCalendarInterval.Weekday = parseInt(schedules[0].weekday);
      }
    } else {
      plistData.StartCalendarInterval = schedules.map(s => {
        const interval = {
          Hour: parseInt(s.hour),
          Minute: parseInt(s.minute)
        };
        if (s.day) interval.Day = parseInt(s.day);
        if (s.weekday) interval.Weekday = parseInt(s.weekday);
        return interval;
      });
    }

    // 寫回 plist
    const newPlistContent = plist.build(plistData);
    await fs.writeFile(plistPath, newPlistContent);

    // 重新載入 LaunchAgent
    await reloadLaunchAgent(label);

    return { success: true, message: `Updated schedule for ${label}` };
  } catch (error) {
    console.error(`Error updating LaunchAgent ${label}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 啟用/停用 LaunchAgent
 */
async function toggleLaunchAgent(label, enabled) {
  try {
    if (enabled) {
      await execPromise(`launchctl load -w ${LAUNCH_AGENTS_DIR}/${label}.plist`);
    } else {
      await execPromise(`launchctl unload -w ${LAUNCH_AGENTS_DIR}/${label}.plist`);
    }

    return { success: true, message: `${enabled ? 'Enabled' : 'Disabled'} ${label}` };
  } catch (error) {
    console.error(`Error toggling LaunchAgent ${label}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 重新載入 LaunchAgent
 */
async function reloadLaunchAgent(label) {
  try {
    // 先 unload
    try {
      await execPromise(`launchctl unload ${LAUNCH_AGENTS_DIR}/${label}.plist`);
    } catch (e) {
      // 如果沒有載入，忽略錯誤
    }

    // 再 load
    await execPromise(`launchctl load ${LAUNCH_AGENTS_DIR}/${label}.plist`);

    return { success: true, message: `Reloaded ${label}` };
  } catch (error) {
    console.error(`Error reloading LaunchAgent ${label}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 獲取 LaunchAgent 運行狀態
 */
async function getLaunchAgentStatus(label) {
  try {
    const { stdout } = await execPromise(`launchctl list | grep ${label}`);

    if (stdout.trim().length > 0) {
      const parts = stdout.trim().split(/\s+/);
      const pid = parts[0];
      const status = parts[1];

      return {
        loaded: true,
        running: pid !== '-',
        pid: pid !== '-' ? pid : null,
        lastExitCode: status !== '-' ? parseInt(status) : null
      };
    }

    return { loaded: false, running: false };
  } catch (error) {
    return { loaded: false, running: false };
  }
}

/**
 * 手動觸發 LaunchAgent 執行
 */
async function triggerLaunchAgent(label) {
  try {
    await execPromise(`launchctl start ${label}`);
    return { success: true, message: `Triggered ${label}` };
  } catch (error) {
    console.error(`Error triggering LaunchAgent ${label}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 格式化 LaunchAgent 名稱
 */
function formatName(label) {
  const nameMap = {
    'com.lman.inbox-archiver': 'Inbox Archiver',
    'com.lman.meeting-prep': 'Meeting Prep',
    'com.lman.pkm-intelligence': 'PKM Intelligence',
    'com.lman.twitter-bot': 'Twitter Auto-Engagement',
    'com.lman.twitter-curator': 'Twitter Curator',
    'com.lman.weekly-review': 'Weekly Review',
    'com.lman.dayflow-intelligence': 'Dayflow Intelligence',
    'com.lman.dayflow-archiver': 'Dayflow Archiver',
    'com.dayflow.obsidian.sync': 'Dayflow → Obsidian Sync'
  };

  return nameMap[label] || label.replace(/^com\.lman\./, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = {
  getAllLaunchAgents,
  getLaunchAgent,
  updateLaunchAgentSchedule,
  toggleLaunchAgent,
  reloadLaunchAgent,
  triggerLaunchAgent,
  getLaunchAgentStatus
};
