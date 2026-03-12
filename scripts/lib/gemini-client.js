#!/usr/bin/env node

/**
 * Gemini Client Library
 * 統一的 Gemini API 客戶端,支援多種模型
 *
 * 支援模型:
 * - gemini-2.5-flash: 快速回應,1M tokens
 * - gemini-2.5-pro: 高品質輸出,2M tokens
 * - gemini-2.0-flash: 快速回應,舊版
 *
 * Token 追蹤: 自動記錄所有 API 呼叫的 token 使用量
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// 從環境變數讀取 API keys (必須設定，無 fallback hardcoded key)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[gemini-client] Warning: GEMINI_API_KEY not set in environment');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * OpenAI Fallback - 當 Gemini 失敗時使用
 */
async function callOpenAI(prompt, options = {}) {
  const {
    temperature = 0.2,
    maxOutputTokens = 2048,
    taskName = 'unknown'
  } = options;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature,
      max_tokens: maxOutputTokens
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenAI API Error: ${data.error.message}`);
  }

  // Record token usage for OpenAI
  if (data.usage) {
    recordTokenUsage(
      taskName,
      data.usage.prompt_tokens || 0,
      data.usage.completion_tokens || 0,
      'gpt-4o-mini (fallback)'
    );
  }

  return data.choices[0].message.content;
}

// Token 追蹤器路徑
const TOKEN_TRACKER_PATH = path.join(
  process.env.HOME,
  'Dropbox/PKM-Vault/.ai-butler-system/token-usage/production-tokens.json'
);

/**
 * 記錄 Token 使用量到追蹤系統
 */
function recordTokenUsage(taskName, inputTokens, outputTokens, model) {
  try {
    // 確保目錄存在
    const dir = path.dirname(TOKEN_TRACKER_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 載入或初始化資料庫
    let db;
    if (fs.existsSync(TOKEN_TRACKER_PATH)) {
      db = JSON.parse(fs.readFileSync(TOKEN_TRACKER_PATH, 'utf-8'));
    } else {
      db = {
        schemaVersion: '1.0',
        trackingStartDate: new Date().toISOString().split('T')[0],
        note: 'Production environment scheduled tasks token usage. Automatically tracked by gemini-client.js',
        dailyUsage: [],
        monthlyStats: []
      };
    }

    const today = new Date().toISOString().split('T')[0];

    // 找到或創建今日記錄
    let todayRecord = db.dailyUsage.find(r => r.date === today);
    if (!todayRecord) {
      todayRecord = {
        date: today,
        tasks: {},
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0
      };
      db.dailyUsage.push(todayRecord);
    }

    // 記錄任務使用
    if (!todayRecord.tasks[taskName]) {
      todayRecord.tasks[taskName] = {
        count: 0,
        inputTokens: 0,
        outputTokens: 0,
        model: model,
        executions: []
      };
    }

    const taskRecord = todayRecord.tasks[taskName];
    taskRecord.count++;
    taskRecord.inputTokens += inputTokens;
    taskRecord.outputTokens += outputTokens;
    taskRecord.executions.push({
      timestamp: new Date().toISOString(),
      inputTokens,
      outputTokens
    });

    // 更新總計
    todayRecord.totalInputTokens += inputTokens;
    todayRecord.totalOutputTokens += outputTokens;

    // 計算成本 (Gemini 2.5 Flash 目前免費)
    const pricing = {
      'gemini-2.5-flash': { input: 0, output: 0 },
      'gemini-2.5-pro': { input: 0.00125 / 1000, output: 0.005 / 1000 },
      'gemini-2.0-flash-exp': { input: 0, output: 0 }
    };

    const modelPricing = pricing[model] || { input: 0, output: 0 };
    const cost = (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
    todayRecord.totalCost = (todayRecord.totalCost || 0) + cost;

    // 保留最近 90 天
    db.dailyUsage = db.dailyUsage
      .filter(r => {
        const date = new Date(r.date);
        const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 90;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    // 保存
    fs.writeFileSync(TOKEN_TRACKER_PATH, JSON.stringify(db, null, 2));

  } catch (error) {
    // Token 追蹤失敗不應影響主功能
    console.error(`[Token Tracker Warning] Failed to record usage: ${error.message}`);
  }
}

/**
 * 使用 Gemini 生成內容
 *
 * @param {string} prompt - 提示詞
 * @param {object} options - 選項
 * @param {string} options.model - 模型名稱 (預設: gemini-2.5-flash)
 * @param {number} options.temperature - 溫度 (0-1, 預設: 0.2)
 * @param {number} options.maxOutputTokens - 最大輸出 tokens
 * @param {boolean} options.useSearch - 是否使用 Google Search grounding
 * @param {array} options.images - 圖片陣列 (for multimodal)
 * @param {string} options.taskName - 任務名稱（用於 token 追蹤）
 * @returns {Promise<string>} 生成的內容
 */
async function generateContent(prompt, options = {}) {
  const {
    model = 'gemini-2.5-flash',
    temperature = 0.2,
    maxOutputTokens = 2048,
    useSearch = false,
    images = [],
    taskName = 'unknown'
  } = options;

  try {

    const geminiModel = genAI.getGenerativeModel({
      model: model,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
      }
    });

    // 構建內容部分
    const parts = [{ text: prompt }];

    // 如果有圖片,加入圖片
    if (images.length > 0) {
      images.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });
    }

    // 構建請求
    const request = {
      contents: [{ role: "user", parts }]
    };

    // 如果啟用 Google Search
    if (useSearch) {
      request.tools = [{ googleSearchRetrieval: {} }];
    }

    const result = await geminiModel.generateContent(request);
    const response = result.response;

    // 記錄 Token 使用量
    if (response.usageMetadata) {
      const usage = response.usageMetadata;
      recordTokenUsage(
        taskName,
        usage.promptTokenCount || 0,
        usage.candidatesTokenCount || 0,
        model
      );
    }

    return response.text();

  } catch (error) {
    console.error(`Gemini API Error: ${error.message}`);

    // Fallback to OpenAI
    if (OPENAI_API_KEY) {
      console.log(`  ↳ Falling back to OpenAI...`);
      try {
        return await callOpenAI(prompt, { temperature, maxOutputTokens, taskName });
      } catch (openaiError) {
        console.error(`OpenAI Fallback Error: ${openaiError.message}`);
        throw openaiError;
      }
    }

    throw error;
  }
}

/**
 * 使用 Gemini 評分郵件重要性
 * 專門用於 Daily Brief 的郵件評分
 *
 * @param {object} email - 郵件物件
 * @returns {Promise<object>} 評分結果
 */
async function scoreEmail(email) {
  const prompt = `You are an email importance analyzer for a startup executive. Analyze THIS specific email and provide a unique assessment.

Email to analyze:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
${email.snippet ? `Preview: ${email.snippet}` : ''}

Evaluation criteria (score 1-10):
**HIGH PRIORITY (7-10):**
- IrisGo team emails (@irisgo.ai domain)
- OEM partners: Acer, HP, Intel, ASUS, Lenovo
- Investors and funding opportunities
- Meeting invitations, partnership proposals
- Critical product issues or urgent deadlines

**MEDIUM PRIORITY (4-6):**
- Important industry news
- Professional networking
- Financial statements and bank notifications (score 3-4)

**LOW PRIORITY (1-3):**
- Promotional emails, newsletters, marketing
- Social media notifications
- Subscription confirmations
- Contest/giveaway emails (score 1-2)
- Automated system emails

**Key indicators for PROMOTIONS (score 1-2):**
- Words like: win, prize, offer, discount, sale, deal, promo, giveaway, contest
- Social media updates, newsletter digests
- Senders: noreply@, hello@, news@, digest@, marketing@

Categories: "OEM Partnership", "Internal Team", "Investment", "Product Issue", "Promotion", "Personal", "Finance", "Newsletter", "Other"

Respond with ONLY a JSON object analyzing THIS email specifically:
{"score": [1-10], "reason": "[specific reason for THIS email]", "category": "[appropriate category]"}`;

  try {
    const response = await generateContent(prompt, {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      maxOutputTokens: 300,
      taskName: 'daily-brief-email-scoring'
    });

    // 解析 JSON 回應
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const scoring = JSON.parse(jsonMatch[0]);
      return {
        ...email,
        aiScore: scoring.score || 5,
        aiReason: scoring.reason || 'No reason provided',
        aiCategory: scoring.category || 'Unknown',
        aiProvider: 'Gemini 2.5 Flash'
      };
    }

    // 如果無法解析 JSON,嘗試文本解析
    let score = 5;
    const scoreMatch = response.match(/score[:\s]*(\d+)/i);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1]);
    }

    return {
      ...email,
      aiScore: score,
      aiReason: 'Parsed from text response',
      aiCategory: 'Unknown',
      aiProvider: 'Gemini 2.5 Flash'
    };

  } catch (error) {
    console.error(`    ⚠️  Gemini scoring failed: ${error.message}`);
    // 降級到規則評分
    return fallbackScoring(email);
  }
}

/**
 * 使用 Gemini 生成文章中文摘要
 * 專門用於 AI 新聞摘要
 *
 * @param {string} articleContent - 文章內容
 * @param {string} title - 文章標題
 * @returns {Promise<string>} 中文摘要
 */
async function generateArticleSummary(articleContent, title) {
  const prompt = `You are a tech news summarizer. Read the following article and provide a concise Chinese summary (200-300 characters).

Article Title: ${title}

Article Content:
${articleContent.substring(0, 3000)}

Please provide a summary in Traditional Chinese that:
1. Highlights the main points
2. Is easy to read
3. Is 200-300 characters long

Respond with ONLY the Chinese summary, no other text.`;

  try {
    const response = await generateContent(prompt, {
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      maxOutputTokens: 400,
      taskName: 'daily-brief-article-summary'
    });

    // 清理輸出,移除引號和多餘空白
    return response
      .replace(/^["「『]+|["」』]+$/g, '')
      .trim();

  } catch (error) {
    console.error(`    ⚠️  Gemini summary failed: ${error.message}`);
    return '摘要生成失敗';
  }
}

/**
 * 降級評分邏輯(當 Gemini 失敗時)
 */
function fallbackScoring(email) {
  let score = 3;
  let category = 'Other';
  let reason = 'Rule-based scoring (Gemini unavailable)';

  const fromLower = email.from.toLowerCase();
  const subjectLower = email.subject.toLowerCase();
  const combinedText = `${fromLower} ${subjectLower}`.toLowerCase();

  // 檢查廣告/促銷
  const promoKeywords = ['win', 'prize', 'offer', 'discount', 'sale', 'deal', 'promo', 'giveaway'];
  if (promoKeywords.some(kw => combinedText.includes(kw))) {
    return { ...email, aiScore: 2, aiReason: 'Promotional email', aiCategory: 'Promotion', aiProvider: 'Fallback' };
  }

  // VIP 發件人
  if (fromLower.includes('@irisgo.ai')) {
    return { ...email, aiScore: 9, aiReason: 'IrisGo team member', aiCategory: 'Internal Team', aiProvider: 'Fallback' };
  }

  if (fromLower.includes('@acer.com') || fromLower.includes('@hp.com') ||
      fromLower.includes('@intel.com') || fromLower.includes('@asus.com')) {
    return { ...email, aiScore: 8, aiReason: 'OEM partner', aiCategory: 'OEM Partnership', aiProvider: 'Fallback' };
  }

  return { ...email, aiScore: score, aiReason: reason, aiCategory: category, aiProvider: 'Fallback' };
}

module.exports = {
  generateContent,
  scoreEmail,
  generateArticleSummary
};
