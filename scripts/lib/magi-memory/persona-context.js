#!/usr/bin/env node

/**
 * MAGI Persona Context Module
 * 整合 Mnemosyne 人格資料,提供上下文感知能力
 *
 * Features:
 * - 讀取並解析 Deep Persona Profile
 * - 快取人格資料到 memory storage
 * - 提供上下文查詢 API
 * - 支援人格偏好提取
 */

const fs = require('fs');
const path = require('path');
const storage = require('./storage');

// Persona 檔案路徑
const PERSONA_FILE = path.join(
  process.env.HOME,
  'Dropbox/PKM-Vault/0-Inbox/Lman-Deep-Persona-Profile.md'
);

// Persona 快取 TTL (30 分鐘)
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * 讀取 Persona Profile 原始內容
 */
function readPersonaFile() {
  try {
    if (!fs.existsSync(PERSONA_FILE)) {
      console.warn('[MAGI] Persona file not found:', PERSONA_FILE);
      return null;
    }
    return fs.readFileSync(PERSONA_FILE, 'utf-8');
  } catch (error) {
    console.error('[MAGI] Error reading persona file:', error.message);
    return null;
  }
}

/**
 * 從 Persona Markdown 提取結構化資料
 */
function parsePersonaProfile(content) {
  if (!content) return null;

  const persona = {
    name: 'Lman',
    version: null,
    lastUpdated: null,
    confidence: 0,
    core: {},
    workStyle: {},
    mbti: {},
    interests: {},
    communication: {},
    tools: [],
    keywords: []
  };

  // 提取版本
  const versionMatch = content.match(/\*\*版本\*\*:\s*v([\d.]+)/);
  if (versionMatch) persona.version = versionMatch[1];

  // 提取最後更新時間
  const updateMatch = content.match(/\*\*最後更新\*\*:\s*(.+)/);
  if (updateMatch) persona.lastUpdated = updateMatch[1];

  // 提取信心分數
  const confidenceMatch = content.match(/\*\*信心分數\*\*:\s*([\d.]+)/);
  if (confidenceMatch) persona.confidence = parseFloat(confidenceMatch[1]);

  // 提取核心定位
  const coreMatch = content.match(/\*\*核心定位\*\*:\s*(.+)/);
  if (coreMatch) {
    persona.core.positioning = coreMatch[1];
  }

  // 提取 MBTI
  const mbtiSection = content.match(/## 🧠 MBTI 人格類型分析[\s\S]*?(?=\n## |$)/);
  if (mbtiSection) {
    const typeMatch = mbtiSection[0].match(/\*\*推測類型\*\*:\s*(\w+)/);
    if (typeMatch) persona.mbti.type = typeMatch[1];

    const confidenceMatch = mbtiSection[0].match(/\*\*信心度\*\*:\s*([\d.]+)/);
    if (confidenceMatch) persona.mbti.confidence = parseFloat(confidenceMatch[1]);
  }

  // 提取工作風格
  const workStyleSection = content.match(/## 🎯 工作風格[\s\S]*?(?=\n## |$)/);
  if (workStyleSection) {
    const focusMatch = workStyleSection[0].match(/\*\*專注度評分\*\*:\s*(\d+)\/100/);
    if (focusMatch) persona.workStyle.focusScore = parseInt(focusMatch[1]);

    const workMatch = workStyleSection[0].match(/\*\*工作強度\*\*:.*?(\d+\.?\d*)%/);
    if (workMatch) persona.workStyle.workPercentage = parseFloat(workMatch[1]);

    const avgDurationMatch = workStyleSection[0].match(/\*\*平均專注時長\*\*:\s*(\d+)/);
    if (avgDurationMatch) persona.workStyle.avgFocusDuration = parseInt(avgDurationMatch[1]);
  }

  // 提取常用工具
  const toolsMatch = content.matchAll(/\d+\.\s+\*\*(.+?)\*\*\s+\((\d+)\s+次\)/g);
  persona.tools = Array.from(toolsMatch).map(m => ({
    name: m[1],
    count: parseInt(m[2])
  }));

  // 提取關鍵詞
  const keywordsSection = content.match(/\*\*高頻關鍵詞\*\*[\s\S]*?(?=\n\n|\n\*\*)/);
  if (keywordsSection) {
    const keywords = keywordsSection[0].match(/`([^`]+)`/g);
    if (keywords) {
      persona.keywords = keywords.map(k => k.replace(/`/g, ''));
    }
  }

  // 提取興趣（動漫等）
  const interestsSection = content.match(/## 🎬 娛樂興趣[\s\S]*?(?=\n## |$)/);
  if (interestsSection) {
    const animeMatches = interestsSection[0].matchAll(/\d+\.\s+\*\*(.+?)\*\*(?:\s*\([^)]*\))?/g);
    persona.interests.anime = Array.from(animeMatches)
      .slice(0, 10)
      .map(m => m[1]);
  }

  return persona;
}

/**
 * 取得人格資料（帶快取）
 */
async function getPersona(forceRefresh = false) {
  // 檢查快取
  const cached = storage.getPersona();
  const now = Date.now();

  if (!forceRefresh && cached?.cachedAt) {
    const age = now - new Date(cached.cachedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return cached;
    }
  }

  // 重新讀取並解析
  const content = readPersonaFile();
  if (!content) {
    return cached || null;
  }

  const persona = parsePersonaProfile(content);
  if (persona) {
    persona.cachedAt = new Date().toISOString();
    storage.savePersona(persona);
  }

  return persona;
}

/**
 * 取得用於 AI 的人格摘要
 */
async function getPersonaSummary() {
  const persona = await getPersona();
  if (!persona) return null;

  return {
    name: persona.name,
    type: persona.mbti?.type || 'Unknown',
    positioning: persona.core?.positioning || '',
    workStyle: {
      focusScore: persona.workStyle?.focusScore,
      avgFocusDuration: persona.workStyle?.avgFocusDuration
    },
    topInterests: persona.interests?.anime?.slice(0, 5) || [],
    topKeywords: persona.keywords?.slice(0, 8) || []
  };
}

/**
 * 取得上下文（根據查詢返回相關人格資料）
 */
async function getContext(query) {
  const persona = await getPersona();
  if (!persona) {
    return { persona: null, relevant: [] };
  }

  const queryLower = query.toLowerCase();
  const relevant = [];

  // 工作相關查詢
  if (queryLower.includes('work') || queryLower.includes('focus') ||
      queryLower.includes('工作') || queryLower.includes('專注')) {
    relevant.push({
      type: 'work_style',
      data: persona.workStyle
    });
  }

  // 興趣相關查詢
  if (queryLower.includes('interest') || queryLower.includes('anime') ||
      queryLower.includes('hobby') || queryLower.includes('動漫') ||
      queryLower.includes('興趣')) {
    relevant.push({
      type: 'interests',
      data: persona.interests
    });
  }

  // 性格相關查詢
  if (queryLower.includes('personality') || queryLower.includes('mbti') ||
      queryLower.includes('性格') || queryLower.includes('人格')) {
    relevant.push({
      type: 'mbti',
      data: persona.mbti
    });
  }

  // 工具相關查詢
  if (queryLower.includes('tool') || queryLower.includes('app') ||
      queryLower.includes('工具') || queryLower.includes('應用')) {
    relevant.push({
      type: 'tools',
      data: persona.tools.slice(0, 10)
    });
  }

  // 搜尋知識庫中的相關洞察
  const insights = storage.searchKnowledge(query, { limit: 5 });
  if (insights.length > 0) {
    relevant.push({
      type: 'knowledge',
      data: insights
    });
  }

  return {
    persona: getPersonaSummary(),
    relevant
  };
}

/**
 * 取得偏好設定
 */
async function getPreferences() {
  const persona = await getPersona();
  if (!persona) return {};

  // 從知識庫取得使用者偏好洞察
  const styleInsights = storage.getInsightsByCategory('communication_style', 10);
  const preferenceInsights = storage.getInsightsByCategory('preferences', 10);

  return {
    communication: {
      style: persona.mbti?.type === 'INTJ' ? 'concise' : 'balanced',
      format: 'bullet_points', // 可從洞察中覆蓋
      language: 'zh-TW',
      ...extractPreferencesFromInsights(styleInsights)
    },
    work: {
      bestTime: 'morning',
      focusPreference: 'deep_work',
      ...persona.workStyle
    },
    interests: persona.interests,
    learned: preferenceInsights
  };
}

/**
 * 從洞察中提取偏好
 */
function extractPreferencesFromInsights(insights) {
  const prefs = {};

  for (const insight of insights) {
    const text = (insight.insight || '').toLowerCase();

    if (text.includes('bullet') || text.includes('列點')) {
      prefs.format = 'bullet_points';
    }
    if (text.includes('paragraph') || text.includes('段落')) {
      prefs.format = 'paragraphs';
    }
    if (text.includes('concise') || text.includes('簡潔')) {
      prefs.style = 'concise';
    }
    if (text.includes('detailed') || text.includes('詳細')) {
      prefs.style = 'detailed';
    }
  }

  return prefs;
}

/**
 * 同步人格資料到 memory storage（供外部腳本調用）
 */
async function syncPersona() {
  const content = readPersonaFile();
  if (!content) {
    return { success: false, error: 'Persona file not found' };
  }

  const persona = parsePersonaProfile(content);
  if (!persona) {
    return { success: false, error: 'Failed to parse persona' };
  }

  persona.cachedAt = new Date().toISOString();
  const success = storage.savePersona(persona);

  return {
    success,
    version: persona.version,
    cachedAt: persona.cachedAt
  };
}

module.exports = {
  getPersona,
  getPersonaSummary,
  getContext,
  getPreferences,
  syncPersona,
  parsePersonaProfile
};
