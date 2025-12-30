#!/usr/bin/env node

/**
 * Daily Brief Generator
 * 每天早上 6:30 自動生成每日簡報到 PKM vault inbox
 *
 * 功能：
 * 1. 獲取最重要的三封郵件 (使用 Ollama gpt-oss:20b 評分, Gemini 作為備援)
 * 2. 獲取最近的會議 (使用 Google Calendar MCP)
 * 3. 獲取 QQQ 股價
 * 4. 獲取 AI 相關新聞並生成中文摘要 (使用 RSS + Ollama/Gemini)
 *
 * AI 架構: Ollama gpt-oss:20b 優先 (本地免費), Gemini 2.5 Flash 備援
 * 2025-12-04: 改為本地優先以節省 Gemini API 費用
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const notify = require('../notifier');
const cryptoMonitor = require('./crypto-monitor');
const socialMediaTracker = require('./social-media-tracker');
const arbitrageMonitor = require('./stablecoin-arbitrage-monitor');
const socialMediaSummary = require('./social-media-summary');
const geminiClient = require('../lib/gemini-client');
const magi = require('../lib/magi-memory');

// 配置
const VAULT_PATH = '/Users/lman/Dropbox/PKM-Vault/0-Inbox';

// 獲取當前日期格式化
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    weekday: weekday,
    filename: `${year}-${month}-${day}-Daily-Brief.md`
  };
}

// 使用 claude CLI 來調用 MCP 工具
async function callClaudeMCP(mcpCommand) {
  return new Promise((resolve, reject) => {
    const claude = spawn('claude', ['-e', mcpCommand]);
    let output = '';
    let error = '';

    claude.stdout.on('data', (data) => {
      output += data.toString();
    });

    claude.stderr.on('data', (data) => {
      error += data.toString();
    });

    claude.on('close', (code) => {
      if (code !== 0 || error) {
        reject(new Error(error || 'Command failed'));
      } else {
        resolve(output);
      }
    });

    setTimeout(() => {
      claude.kill();
      reject(new Error('Timeout'));
    }, 30000);
  });
}

// 過濾自動通知郵件（Calendar notifications, automated emails）
function shouldFilterEmail(email) {
  const subject = email.subject || '';
  const from = email.from || '';

  // 1. Calendar Notifications 模式檢查
  const calendarPatterns = [
    /^已接受[:：]/i,           // 已接受：會議名稱
    /^已拒絕[:：]/i,           // 已拒絕：會議名稱 ← 修正當前問題
    /^已取消[:：]/i,           // 已取消：會議名稱
    /^已更新[:：]/i,           // 已更新：會議名稱
    /^Accepted[:：]/i,         // Accepted: Meeting Title
    /^Declined[:：]/i,         // Declined: Meeting Title
    /^Cancelled[:：]/i,        // Cancelled: Meeting Title
    /^Updated[:：]/i,          // Updated: Meeting Title
    /^Invitation[:：]/i,       // Invitation: Meeting Title
    /calendar\s+notification/i,
    /meeting\s+(accepted|declined|cancelled|updated)/i
  ];

  if (calendarPatterns.some(pattern => pattern.test(subject))) {
    console.log(`    [FILTER] Skipping calendar notification: "${subject.substring(0, 50)}..."`);
    return true; // 過濾掉
  }

  // 2. Automated senders 檢查
  const automatedSenders = [
    'no-reply@',
    'noreply@',
    'calendar-notification@'
  ];

  if (automatedSenders.some(sender => from.toLowerCase().includes(sender))) {
    console.log(`    [FILTER] Skipping automated sender: ${from}`);
    return true; // 過濾掉
  }

  return false; // 不過濾
}

// 使用 Ollama 評估郵件重要性 (Gemini 作為備援) - 2025-12-04 改為本地優先以節省 API 費用
async function scoreEmailWithAI(email) {
  // 優先使用 Ollama (本地模型，免費)
  try {
    console.log(`    🤖 Scoring with Ollama (local)...`);

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

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss:20b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 300,
          top_p: 0.9
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.thinking || data.response;

      // 嘗試解析 JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const scoring = JSON.parse(jsonMatch[0]);
          console.log(`    ✓ Ollama scored: ${scoring.score}/10 (${scoring.category})`);
          return {
            ...email,
            aiScore: scoring.score || 5,
            aiReason: scoring.reason || 'No reason provided',
            aiCategory: scoring.category || 'Unknown',
            aiProvider: 'Ollama'
          };
        } catch (parseError) {
          // Continue to text parsing
        }
      }

      // 從文本提取評分
      if (aiResponse && aiResponse.length > 0) {
        let score = 5;
        let category = 'Unknown';
        let reason = 'AI analysis';

        const scorePatterns = [
          /(?:Score likely|Let's choose|choose|score:?\s*)\s*(\d+)/i,
          /(\d+)\s*\/10/,
          /(\d+)\s*out of 10/i
        ];

        for (const pattern of scorePatterns) {
          const match = aiResponse.match(pattern);
          if (match) {
            const parsedScore = parseInt(match[1]);
            if (parsedScore >= 1 && parsedScore <= 10) {
              score = parsedScore;
              break;
            }
          }
        }

        const categoryMatch = aiResponse.match(/Category:\s*["']([^"']+)["']/i);
        if (categoryMatch) {
          category = categoryMatch[1];
        }

        const reasonMatch = aiResponse.match(/Reason:\s*([^.]+(?:\.[^.]*)?)\./i);
        if (reasonMatch) {
          reason = reasonMatch[1].trim();
        }

        if (score !== 5 || category !== 'Unknown') {
          console.log(`    ✓ Ollama scored: ${score}/10`);
          return {
            ...email,
            aiScore: score,
            aiReason: reason,
            aiCategory: category,
            aiProvider: 'Ollama'
          };
        }
      }
    }

    throw new Error('Ollama scoring failed or returned invalid response');

  } catch (ollamaError) {
    console.error(`    ⚠️  Ollama failed: ${ollamaError.message}`);
    console.log(`    🔄 Falling back to Gemini...`);

    // 備援：使用 Gemini API
    try {
      const result = await geminiClient.scoreEmail(email);
      console.log(`    ✓ Gemini scored: ${result.aiScore}/10 (${result.aiCategory})`);
      return result;

    } catch (geminiError) {
      console.error(`    ⚠️  Gemini also failed: ${geminiError.message}`);
      console.log(`    🔧 Using rule-based scoring...`);

      // 最終降級到規則評分
      return fallbackRuleBasedScoring(email);
    }
  }
}

// 規則評分（當所有 AI 都失敗時）
function fallbackRuleBasedScoring(email) {
  let score = 3;
  let category = 'Other';
  let reason = 'Rule-based scoring (AI unavailable)';

  const fromLower = email.from.toLowerCase();
  const subjectLower = email.subject.toLowerCase();
  const combinedText = `${fromLower} ${subjectLower}`.toLowerCase();

  // 檢查廣告/促銷
  const promoKeywords = ['win', 'prize', 'offer', 'discount', 'sale', 'deal', 'promo', 'giveaway', 'contest',
                         'free', 'limited time', 'special offer', '優惠', '折扣', '抽獎', 'newsletter'];
  const promoSenders = ['noreply@', 'hello@digest', 'news@', 'marketing@', 'newsletter@', 'no-reply@'];

  if (promoKeywords.some(kw => combinedText.includes(kw)) ||
      promoSenders.some(sender => fromLower.includes(sender))) {
    score = 2;
    category = 'Promotion';
    reason = 'Promotional/marketing email';
    return { ...email, aiScore: score, aiReason: reason, aiCategory: category, aiProvider: 'Rules' };
  }

  // 檢查財務/銀行
  const financeKeywords = ['statement', 'bank', 'account', '對帳單', '帳單', 'transaction', 'payment'];
  if (financeKeywords.some(kw => combinedText.includes(kw))) {
    score = 3;
    category = 'Finance';
    reason = 'Financial statement or notification';
    return { ...email, aiScore: score, aiReason: reason, aiCategory: category, aiProvider: 'Rules' };
  }

  // VIP 發件人
  if (fromLower.includes('@irisgo.ai')) {
    score = 9;
    category = 'Internal Team';
    reason = 'Email from IrisGo team member';
  } else if (fromLower.includes('@acer.com') || fromLower.includes('@hp.com') ||
             fromLower.includes('@intel.com') || fromLower.includes('@asus.com') ||
             fromLower.includes('@lenovo.com')) {
    score = 8;
    category = 'OEM Partnership';
    reason = 'Email from OEM partner';
  }

  // 緊急關鍵字
  const urgentKeywords = ['urgent', 'asap', 'critical', 'meeting', 'partnership', 'funding', 'investor'];
  if (urgentKeywords.some(kw => subjectLower.includes(kw))) {
    score = Math.min(score + 2, 10);
    if (reason === 'Rule-based scoring (AI unavailable)') {
      reason = 'Contains urgent keywords';
    }
  }

  return { ...email, aiScore: score, aiReason: reason, aiCategory: category, aiProvider: 'Rules' };
}

// 獲取重要郵件（使用 AI 評分）
async function getImportantEmails() {
  try {
    console.log('  Searching for unread emails...');

    // 直接調用 Gmail MCP Server
    const { execSync } = require('child_process');
    const gmailMcpPath = '/Users/lman/Gmail-MCP-Server/dist/index.js';

    // 創建 JSON-RPC 請求 - 取得更多郵件用於 AI 評分
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_emails',
        arguments: {
          query: 'is:unread newer_than:3d',  // 取得過去 3 天的未讀郵件
          maxResults: 20  // 取得更多候選郵件
        }
      }
    };

    // 調用 MCP
    const result = execSync(
      `echo '${JSON.stringify(request)}' | node "${gmailMcpPath}"`,
      { encoding: 'utf-8', timeout: 15000, stdio: ['pipe', 'pipe', 'ignore'] }
    );

    // 解析響應
    const response = JSON.parse(result);

    if (response && response.result) {
      // 解析郵件列表
      const emailText = response.result.content?.[0]?.text || response.result;
      const lines = emailText.split('\n').filter(line => line.trim());

      const emails = [];
      let currentEmail = null;

      for (const line of lines) {
        if (line.startsWith('ID:')) {
          if (currentEmail && currentEmail.subject) {
            emails.push(currentEmail);
          }
          currentEmail = { id: line.replace('ID:', '').trim() };
        } else if (line.startsWith('Subject:') && currentEmail) {
          currentEmail.subject = line.replace('Subject:', '').trim();
        } else if (line.startsWith('From:') && currentEmail) {
          currentEmail.from = line.replace('From:', '').trim();
        } else if (line.startsWith('Date:') && currentEmail) {
          currentEmail.date = line.replace('Date:', '').trim();
        } else if (currentEmail && currentEmail.subject && !currentEmail.snippet && line.trim() && !line.startsWith('ID:')) {
          currentEmail.snippet = line.trim().substring(0, 150);
        }
      }

      if (currentEmail && currentEmail.subject) {
        emails.push(currentEmail);
      }

      if (emails.length === 0) {
        return [];
      }

      console.log(`    📩 Found ${emails.length} unread emails, scoring with AI...`);

      // 先過濾自動通知，再使用 AI 評分
      const scoredEmails = [];
      for (const email of emails) {
        // Step 1: 先檢查是否應該過濾
        if (shouldFilterEmail(email)) {
          continue; // 跳過此郵件，不評分
        }

        // Step 2: 對剩下的郵件進行 AI 評分
        const scored = await scoreEmailWithAI(email);
        scoredEmails.push(scored);
        console.log(`    ✓ ${email.subject.substring(0, 40)}... → Score: ${scored.aiScore}/10 (${scored.aiCategory})`);
      }

      // 按 AI 分數排序
      scoredEmails.sort((a, b) => b.aiScore - a.aiScore);

      // 只選擇分數 >= 6 的郵件，最多取 5 封
      const importantEmails = scoredEmails.filter(e => e.aiScore >= 6).slice(0, 5);

      if (importantEmails.length > 0) {
        console.log(`    🎯 ${importantEmails.length} important emails selected (score >= 6)`);
      } else {
        console.log(`    ℹ️  No high-priority emails found (all scores < 6)`);
      }

      return importantEmails;
    }

    return [];
  } catch (error) {
    console.error('  Error fetching emails:', error.message);
    // 返回空陣列而不是錯誤訊息
    return [];
  }
}

// 獲取最近的會議 - 從多個日曆
async function getUpcomingMeetings() {
  try {
    console.log('  Searching for upcoming meetings from Google Calendar...');

    const CREDENTIALS_PATH = '/Users/lman/.config/google-calendar-mcp/credentials.json';
    const TOKEN_PATH = '/Users/lman/.config/google-calendar-mcp/token.json';

    // 檢查憑證文件是否存在
    if (!fs.existsSync(TOKEN_PATH)) {
      console.log('    ⏭️  Google Calendar not authenticated, skipping...');
      return [];
    }

    // 讀取 token
    let token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));

    // 設置今天的時間範圍
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // 要讀取的日曆列表
    const calendars = ['primary', 'lman@irisgo.ai'];
    const allEvents = [];

    // Helper function to fetch events with token refresh
    async function fetchCalendarEvents(calendarId, accessToken) {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${now.toISOString()}` +
        `&timeMax=${endOfDay.toISOString()}` +
        `&singleEvents=true` +
        `&orderBy=startTime` +
        `&maxResults=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );
      return response;
    }

    // 從每個日曆獲取事件
    for (const calendarId of calendars) {
      try {
        let response = await fetchCalendarEvents(calendarId, token.access_token);

        // 如果 token 過期，刷新並重試
        if (response.status === 401 && token.refresh_token) {
          console.log(`    🔄 Access token expired, refreshing for ${calendarId}...`);
          const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
          const { client_id, client_secret } = credentials.web || credentials.installed;

          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: client_id,
              client_secret: client_secret,
              refresh_token: token.refresh_token,
              grant_type: 'refresh_token',
            }),
          });

          const newTokens = await tokenResponse.json();

          if (newTokens.error) {
            throw new Error(newTokens.error_description || newTokens.error);
          }

          // 更新 token
          token = {
            ...token,
            access_token: newTokens.access_token,
            expires_in: newTokens.expires_in,
          };
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));

          // 重試請求
          response = await fetchCalendarEvents(calendarId, token.access_token);
        }

        if (response.ok) {
          const data = await response.json();
          const events = data.items || [];
          allEvents.push(...events.map(e => ({ ...e, calendarId })));
          console.log(`    ✓ Found ${events.length} events in ${calendarId}`);
        } else {
          console.log(`    ⚠️  Could not fetch ${calendarId}: ${response.status}`);
        }
      } catch (err) {
        console.log(`    ⚠️  Error fetching ${calendarId}: ${err.message}`);
      }
    }

    // 按開始時間排序
    allEvents.sort((a, b) => {
      const timeA = new Date(a.start.dateTime || a.start.date);
      const timeB = new Date(b.start.dateTime || b.start.date);
      return timeA - timeB;
    });

    console.log(`    📅 Total: ${allEvents.length} upcoming events from all calendars`);

    return allEvents.map(event => ({
      summary: event.summary || 'No title',
      start: event.start.dateTime || event.start.date,
      location: event.location || '',
      calendar: event.calendarId
    })).slice(0, 10);

  } catch (error) {
    console.log(`    ⏭️  Could not access Google Calendar: ${error.message}`);
    // Calendar is optional - return empty array to continue
    return [];
  }
}
// 獲取 QQQ 股價
async function getQQQPrice() {
  try {
    console.log('  Fetching QQQ stock price...');
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/QQQ?interval=1d&range=1d');
    const data = await response.json();

    if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];

      // 計算前一天的收盤價
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        high: quote.high[quote.high.length - 1] || currentPrice,
        low: quote.low[quote.low.length - 1] || currentPrice,
        volume: quote.volume[quote.volume.length - 1] || 0,
        previousClose: previousClose
      };
    }

    return null;
  } catch (error) {
    console.error('  Error fetching QQQ price:', error.message);
    return null;
  }
}

// 使用 Gemini 生成文章中文摘要 (Ollama 作為備援)
async function generateArticleSummary(articleContent, title) {
  try {
    // 優先使用 Gemini
    console.log(`    🤖 Generating summary with Gemini...`);
    const summary = await geminiClient.generateArticleSummary(articleContent, title);

    if (summary && !summary.includes('失敗')) {
      console.log(`    ✓ Gemini summary: ${summary.substring(0, 50)}...`);
      return summary;
    }

    throw new Error('Gemini summary empty or failed');

  } catch (geminiError) {
    console.error(`    ⚠️  Gemini failed: ${geminiError.message}`);
    console.log(`    🔄 Falling back to Ollama...`);

    // 降級到 Ollama
    try {
      const prompt = `你是專業的科技新聞摘要生成器。請閱讀以下文章，並提供繁體中文摘要。

文章標題：${title}

文章內容：
${articleContent.substring(0, 3000)}

摘要要求：
1. 突出主要要點
2. 易於閱讀
3. 長度：200-300 字

**重要：請在第一行直接輸出繁體中文摘要，不要包含任何關鍵詞列表、不要輸出推理過程、不要使用引號包裹摘要。**

摘要：`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-oss:20b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 400,
            top_p: 0.9
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawOutput = (data.response || data.thinking || '').trim();

        // 輔助函數：計算中文密度和質量分數
        function scoreText(text) {
          const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
          const totalChars = text.length;
          const quotes = (text.match(/["「『"']/g) || []).length;
          const englishWords = (text.match(/[a-zA-Z]{3,}/g) || []).length;

          // 中文密度
          const chineseDensity = chineseChars / totalChars;

          // 懲罰過多引號（可能是關鍵詞列表）
          const quotePenalty = Math.min(quotes * 0.1, 0.5);

          // 懲罰英文單詞
          const englishPenalty = Math.min(englishWords * 0.05, 0.3);

          // 獎勵以句號結尾
          const endBonus = /[。！？]$/.test(text) ? 0.2 : 0;

          return chineseDensity - quotePenalty - englishPenalty + endBonus;
        }

        // 策略 1: 找所有 150+ 字符的中文段落，按質量評分
        const chineseParagraphs = rawOutput.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef，。！？、；：""''（）《》【】…─—·]{150,}/g);
        if (chineseParagraphs && chineseParagraphs.length > 0) {
          const scored = chineseParagraphs.map(p => ({
            text: p,
            score: scoreText(p)
          })).sort((a, b) => b.score - a.score);

          const best = scored[0].text.trim();
          const cleaned = best.replace(/^["「『"']+|["」』"']+$/g, '');
          console.log(`    ✓ Ollama summary generated`);
          return cleaned;
        }

        // 策略 2: 降低要求到 100+ 字符
        const shorterParagraphs = rawOutput.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef，。！？、；：""''（）《》【】…─—·]{100,}/g);
        if (shorterParagraphs && shorterParagraphs.length > 0) {
          const scored = shorterParagraphs.map(p => ({
            text: p,
            score: scoreText(p)
          })).sort((a, b) => b.score - a.score);

          const best = scored[0].text.trim();
          const cleaned = best.replace(/^["「『"']+|["」』"']+$/g, '');
          console.log(`    ✓ Ollama summary generated`);
          return cleaned;
        }
      }

      throw new Error('Ollama summary failed');

    } catch (ollamaError) {
      console.error(`    ⚠️  Ollama also failed: ${ollamaError.message}`);
      return '摘要生成失敗';
    }
  }
}

// 獲取 AI 相關新聞（使用 RSS + Ollama 摘要）
async function getAINews() {
  try {
    console.log('  Fetching AI news from multiple sources...');

    // 調用新的 AI news scraper
    const aiNewsScraper = require('./ai-news-scraper');

    // 設置 180 秒超時（生成摘要需要時間，每篇約 10-15 秒）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI news scraper timeout (180s)')), 180000);
    });

    const scraperPromise = aiNewsScraper.main();

    // Race between scraper and timeout
    const result = await Promise.race([scraperPromise, timeoutPromise]);

    if (result.success && result.data && result.data.articles) {
      const articles = result.data.articles;

      console.log(`    ✅ Fetched ${articles.length} AI news articles with summaries`);

      // 轉換格式以匹配現有的 Markdown 格式
      return articles.map(article => ({
        title: article.title,
        url: article.link,
        source: article.source,
        time: article.pubDate ? new Date(article.pubDate).toLocaleString('zh-TW') : '',
        summary: article.summary || '無摘要'
      }));
    } else {
      console.error(`    ❌ AI news scraper failed: ${result.error || 'Unknown error'}`);
      return [];
    }
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.error('  ⏱️  AI news scraper timed out, skipping AI news...');
    } else {
      console.error('  ⚠️  Error fetching AI news:', error.message);
    }
    return [];
  }
}

// 生成 Markdown 內容
function generateMarkdown(data) {
  const { date, time, weekday } = getFormattedDate();

  let markdown = `# 📅 Daily Brief - ${date} (${weekday})\n\n`;
  markdown += `> *Generated at ${time}*\n\n`;
  markdown += `---\n\n`;

  // 重要郵件（動態標題）
  const emailCount = data.emails && data.emails.length > 0 ? data.emails.length : 0;
  const emailTitle = emailCount > 0
    ? `## 📧 Important Emails (${emailCount}) - AI-Ranked\n\n`
    : `## 📧 Important Emails\n\n`;

  markdown += emailTitle;

  if (data.emails && data.emails.length > 0) {
    data.emails.forEach((email, index) => {
      const scoreEmoji = email.aiScore >= 8 ? '🔴' : email.aiScore >= 6 ? '🟡' : '🟢';
      markdown += `### ${index + 1}. ${email.subject}\n\n`;
      markdown += `- **From:** ${email.from}\n`;
      if (email.aiScore) {
        markdown += `- **Importance:** ${scoreEmoji} ${email.aiScore}/10 - *${email.aiReason}*\n`;
        if (email.aiCategory) {
          markdown += `- **Category:** ${email.aiCategory}\n`;
        }
      }
      if (email.snippet && email.snippet !== 'undefined') {
        markdown += `- **Preview:** ${email.snippet}\n`;
      }
      if (email.date) {
        markdown += `- **Date:** ${email.date}\n`;
      }
      markdown += `\n`;
    });
  } else {
    markdown += `*No important emails* ✨\n\n`;
    markdown += `> All emails scored below 6/10 importance threshold, or no unread emails found.\n\n`;
  }

  markdown += `---\n\n`;

  // HighlightAI 待辦事項
  if (data.highlightAI && data.highlightAI.hasActiveTasks) {
    markdown += `## ✅ 今日待辦事項 (來自 HighlightAI)\n\n`;
    markdown += `> 📋 **來源**: ${data.highlightAI.filename} (${data.highlightAI.date})\n\n`;

    // 將任務按類別分組
    const tasksByCategory = {
      'Partnership & Engagement': [],
      'Operational Coordination': [],
      'Administrative': [],
      'Translations': [],
      'Other': []
    };

    data.highlightAI.tasks.forEach(task => {
      const title = task.title;
      let category = 'Other';

      if (title.includes('partnership') || title.includes('partner') || title.includes('LinkedIn') || title.includes('profile')) {
        category = 'Partnership & Engagement';
      } else if (title.includes('meeting') || title.includes('sync') || title.includes('coordination') || title.includes('Reply') || title.includes('Respond')) {
        category = 'Operational Coordination';
      } else if (title.includes('budget') || title.includes('document') || title.includes('update')) {
        category = 'Administrative';
      } else if (title.includes('translation') || title.includes('Translate')) {
        category = 'Translations';
      }

      tasksByCategory[category].push(task);
    });

    // 顯示任務（中文標題）
    const categoryTitles = {
      'Partnership & Engagement': '### 🤝 合作夥伴與對外關係',
      'Operational Coordination': '### 📞 營運協調',
      'Administrative': '### 📋 行政事務',
      'Translations': '### 🌐 翻譯任務',
      'Other': '### 📌 其他事項'
    };

    Object.keys(tasksByCategory).forEach(category => {
      const tasks = tasksByCategory[category];
      if (tasks.length > 0) {
        markdown += `${categoryTitles[category]}\n\n`;
        tasks.forEach(task => {
          markdown += `- [ ] **${task.title}**${task.detail}\n`;
        });
        markdown += `\n`;
      }
    });

    markdown += `---\n\n`;
  }

  // 會議 - 只顯示今天上午的前兩個會議
  markdown += `## 📆 This Morning's Meetings\n\n`;

  // 篩選上午的會議（06:00 - 12:00 之間）
  const morningMeetings = [];
  if (data.meetings && data.meetings.length > 0) {
    const morningStart = new Date();
    morningStart.setHours(6, 0, 0, 0);

    const noon = new Date();
    noon.setHours(12, 0, 0, 0);

    for (const meeting of data.meetings) {
      const meetingTime = new Date(meeting.start);
      // 必須在 06:00 到 12:00 之間
      if (meetingTime >= morningStart && meetingTime < noon) {
        morningMeetings.push(meeting);
        if (morningMeetings.length >= 2) break; // 只取前兩個
      }
    }
  }

  if (morningMeetings.length > 0) {
    morningMeetings.forEach((meeting, index) => {
      const startTime = new Date(meeting.start).toLocaleString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      markdown += `### ${index + 1}. ${meeting.summary}\n\n`;
      markdown += `- **Time:** ${startTime}\n`;
      if (meeting.location) {
        markdown += `- **Location:** ${meeting.location}\n`;
      }
      markdown += `\n`;
    });

    // 如果還有更多會議，提示用戶查看日曆
    if (data.meetings.length > morningMeetings.length) {
      const remainingCount = data.meetings.length - morningMeetings.length;
      markdown += `> 💡 你今天還有 ${remainingCount} 個會議，請查看行事曆了解完整排程\n\n`;
    }
  } else {
    markdown += `*今天上午沒有會議* ☕\n\n`;

    // 如果下午有會議，提示一下
    if (data.meetings && data.meetings.length > 0) {
      markdown += `> 💡 你今天下午有 ${data.meetings.length} 個會議\n\n`;
    }
  }

  markdown += `---\n\n`;

  // QQQ 股價
  markdown += `## 📈 Market Update - QQQ (Invesco QQQ Trust)\n\n`;
  if (data.qqq) {
    const changeIcon = data.qqq.change >= 0 ? '📈' : '📉';
    const changeEmoji = data.qqq.change >= 0 ? '🟢' : '🔴';

    markdown += `${changeIcon} **Current Price:** $${data.qqq.price.toFixed(2)}\n\n`;
    markdown += `${changeEmoji} **Change:** ${data.qqq.change >= 0 ? '+' : ''}$${data.qqq.change.toFixed(2)} (${data.qqq.changePercent >= 0 ? '+' : ''}${data.qqq.changePercent.toFixed(2)}%)\n\n`;
    markdown += `- **Previous Close:** $${data.qqq.previousClose.toFixed(2)}\n`;
    markdown += `- **Day High:** $${data.qqq.high.toFixed(2)}\n`;
    markdown += `- **Day Low:** $${data.qqq.low.toFixed(2)}\n`;
    markdown += `- **Volume:** ${data.qqq.volume.toLocaleString()}\n\n`;

    // 簡單的市場解讀
    if (data.qqq.changePercent > 1) {
      markdown += `> 💪 **Strong gain today!** QQQ is up more than 1%.\n\n`;
    } else if (data.qqq.changePercent < -1) {
      markdown += `> ⚠️ **Market pullback** QQQ is down more than 1%.\n\n`;
    } else {
      markdown += `> 📊 **Steady trading** QQQ is relatively flat today.\n\n`;
    }
  } else {
    markdown += `*Market data unavailable* (市場可能未開盤)\n\n`;
  }

  markdown += `---\n\n`;

  // 加密貨幣投資組合
  if (data.crypto) {
    markdown += cryptoMonitor.formatMarkdown(data.crypto);
  }

  // 穩定幣套利監控
  if (data.arbitrage) {
    markdown += arbitrageMonitor.formatMarkdown(data.arbitrage);
  }

  // Slack 團隊溝通
  markdown += `## 💬 Team Communication (Slack)\n\n`;
  if (data.slack && data.slack.totalMessages > 0) {
    markdown += `**📊 Today's Activity:**\n\n`;
    markdown += `- 💬 Total messages: ${data.slack.totalMessages}\n`;
    markdown += `- 📢 Active channels: ${data.slack.activeChannels}\n\n`;

    if (data.slack.channels.length > 0) {
      markdown += `**Top Active Channels:**\n\n`;
      // 按訊息數量排序，取前 5 個
      data.slack.channels
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .forEach(ch => {
          markdown += `- **#${ch.name}**: ${ch.count} 條訊息\n`;
        });
      markdown += `\n`;
    }

    markdown += `> 📝 [View detailed summary →](${data.slack.filePath})\n\n`;
  } else {
    markdown += `*No Slack activity today* 😴\n\n`;
  }

  markdown += `---\n\n`;

  // 你的自動化社交媒體活動（昨晚發文/回文）
  if (data.personalSocialMedia && data.personalSocialMedia.stats.total > 0) {
    markdown += socialMediaSummary.formatMarkdown(data.personalSocialMedia);
  }

  // 社群媒體互動（個人 + IrisGo 公司）
  markdown += `## 🔥 Social Media & Community\n\n`;

  let hasActivity = false;

  // Iris AI 助手代表你的互動
  if (data.socialActivity && data.socialActivity.length > 0) {
    hasActivity = true;
    markdown += `### 🤖 Iris AI Interactions\n\n`;

    const byPlatform = {};
    data.socialActivity.forEach(i => {
      if (!byPlatform[i.platform]) byPlatform[i.platform] = [];
      byPlatform[i.platform].push(i);
    });

    Object.keys(byPlatform).forEach(platform => {
      markdown += `**${platform}:**\n\n`;
      byPlatform[platform].forEach(i => {
        const time = new Date(i.timestamp).toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const typeEmoji = {
          'reply': '💬',
          'comment': '💬',
          'like': '❤️',
          'share': '🔄',
          'post': '📝'
        }[i.type] || '📌';

        markdown += `- **${time}** ${typeEmoji} **${i.type}**: ${i.content}\n`;
        if (i.context && i.context !== 'No context provided') {
          markdown += `  - *${i.context}*\n`;
        }
        markdown += `  - [View →](${i.url})\n`;
      });
      markdown += `\n`;
    });

    markdown += `> 📊 **Total AI interactions:** ${data.socialActivity.length}\n\n`;
  }

  // IrisGo 公司社群媒體
  if (data.companySocial && data.companySocial.platforms) {
    const { linkedIn, twitter } = data.companySocial.platforms;

    if (linkedIn || twitter) {
      hasActivity = true;
      markdown += `### 🏢 IrisGo Company Updates\n\n`;

      if (linkedIn) {
        markdown += `**LinkedIn:**\n`;
        markdown += `- 📊 Status: ${linkedIn.note || 'Active'}\n`;
        markdown += `- 🔗 [Visit page →](${linkedIn.url})\n\n`;
      }

      if (twitter) {
        markdown += `**Twitter/X:**\n`;
        markdown += `- 📊 Status: ${twitter.note || 'Active'}\n`;
        markdown += `- 🐦 [Visit profile →](${twitter.url})\n\n`;
      }
    }
  }

  if (!hasActivity) {
    markdown += `*No social media activity today* 🤫\n\n`;
    markdown += `**IrisGo Social:**\n`;
    markdown += `- 🔗 [LinkedIn](https://www.linkedin.com/company/irixion/)\n`;
    markdown += `- 🐦 [Twitter/X](https://x.com/irisgoai)\n\n`;
  }

  markdown += `---\n\n`;

  // MAGI Task Queue - Yesterday's Automation
  markdown += `## 🤖 MAGI Task Queue - Yesterday's Automation\n\n`;
  if (data.magiTasks && data.magiTasks.totalTasks > 0) {
    markdown += `**📊 Activity Summary:**\n\n`;
    markdown += `- 🎯 Total tasks completed: ${data.magiTasks.totalTasks}\n`;
    markdown += `- ⚡ Auto-executed: ${data.magiTasks.autoExecutedTasks}\n`;
    markdown += `- 🏠 Iris tasks: ${data.magiTasks.irisTasks}\n`;
    markdown += `- 📱 Lucy tasks: ${data.magiTasks.lucyTasks}\n\n`;

    if (data.magiTasks.tasks.length > 0) {
      markdown += `**📋 Completed Tasks:**\n\n`;
      data.magiTasks.tasks.forEach((task, index) => {
        markdown += `### ${index + 1}. ${task.title}\n\n`;
        markdown += `- **ID**: ${task.id}\n`;
        markdown += `- **Executed by**: ${task.assignedTo}\n`;
        if (task.autoExecute) {
          markdown += `- **Mode**: ⚡ Auto-executed\n`;
        }
        if (task.command) {
          markdown += `- **Command**: \`${task.command}\`\n`;
        }
        if (task.results) {
          markdown += `- **Results**: ${task.results}\n`;
        }
        markdown += `\n`;
      });
    }
  } else {
    markdown += `*No automated tasks yesterday* 😴\n\n`;
    markdown += `> Your MAGI team (Iris & Lucy) had a rest day. Task queue is ready for new assignments!\n\n`;
  }

  markdown += `---\n\n`;

  // AI 新聞
  markdown += `## 🤖 AI News Highlights (While You Slept 🌙)\n\n`;
  if (data.news && data.news.length > 0) {
    data.news.forEach((article, index) => {
      markdown += `### ${index + 1}. ${article.title}\n\n`;

      // 顯示 AI 生成的中文摘要
      if (article.summary && !article.summary.includes('失敗') && article.summary !== '無摘要') {
        markdown += `**📝 摘要:**\n\n`;
        markdown += `${article.summary}\n\n`;
      }

      markdown += `- **來源:** ${article.source}\n`;
      if (article.time) {
        markdown += `- **發布時間:** ${article.time}\n`;
      }
      markdown += `- **原文連結:** [Read full article →](${article.url})\n\n`;
    });
  } else {
    markdown += `*No AI news available* 😴\n\n`;
    markdown += `**Recommended AI News Sources:**\n\n`;
    markdown += `- 🤖 [OpenAI Blog](https://openai.com/blog/)\n`;
    markdown += `- 🧠 [Google AI Blog](https://blog.google/technology/ai/)\n`;
    markdown += `- 🔬 [Anthropic News](https://www.anthropic.com/news)\n`;
    markdown += `- 🎯 [DeepMind Blog](https://deepmind.google/blog/)\n\n`;
  }

  markdown += `---\n\n`;
  markdown += `## 📝 Notes & Quick Links\n\n`;
  markdown += `- [ ] Review important emails\n`;
  markdown += `- [ ] Prepare for upcoming meetings\n`;
  markdown += `- [ ] Check detailed market analysis if needed\n`;
  markdown += `- [ ] Read interesting tech articles\n\n`;
  markdown += `---\n\n`;
  markdown += `*🤖 This brief was automatically generated by your Daily Brief system*\n`;
  markdown += `*Generated with Claude Code via Happy Engineering*\n`;

  return markdown;
}

// 獲取 Slack 每日摘要
function getSlackSummary() {
  try {
    const SLACK_DIR = path.join(process.env.HOME, 'Dropbox/PKM-Vault/.ai-butler-system/shared-context/slack-summaries');
    const { date } = getFormattedDate();
    const slackFile = path.join(SLACK_DIR, `${date}.md`);

    if (!fs.existsSync(slackFile)) {
      return null;
    }

    const content = fs.readFileSync(slackFile, 'utf8');

    // 解析 Markdown 提取關鍵資訊
    const lines = content.split('\n');
    const channels = [];
    let totalMessages = 0;
    let hasAISummary = !content.includes('⚠️ AI 摘要生成失敗');

    // 提取頻道訊息統計
    for (const line of lines) {
      const match = line.match(/- \*\*#(.+?)\*\*: (\d+) 條訊息/);
      if (match) {
        const channelName = match[1];
        const count = parseInt(match[2]);
        totalMessages += count;
        if (count > 0) {
          channels.push({ name: channelName, count });
        }
      }
    }

    return {
      totalMessages,
      activeChannels: channels.length,
      channels,
      hasAISummary,
      filePath: slackFile
    };
  } catch (error) {
    console.error('  Error reading Slack summary:', error.message);
    return null;
  }
}

// 獲取 HighlightAI Summary（最近 3 天內的）
function getHighlightAISummary() {
  try {
    const INBOX_PATH = path.join(process.env.HOME, 'Dropbox/PKM-Vault/0-Inbox');

    // 查找最近 3 天內的 HighlightAI Summary
    const files = fs.readdirSync(INBOX_PATH);
    const summaryFiles = files
      .filter(f => f.includes('HighlightAI-Summary') && f.endsWith('.md'))
      .sort()
      .reverse(); // 最新的在前

    if (summaryFiles.length === 0) {
      return null;
    }

    // 讀取最新的 summary
    const latestFile = summaryFiles[0];
    const content = fs.readFileSync(path.join(INBOX_PATH, latestFile), 'utf8');

    // 解析待辦事項（checkbox）
    const tasks = [];
    const lines = content.split('\n');
    let inTaskSection = false;

    for (const line of lines) {
      // 檢測任務section開始
      if (line.includes('## ✅ Things You Committed To') ||
          line.includes('## 🎯 Priority Action Items')) {
        inTaskSection = true;
        continue;
      }

      // 檢測section結束
      if (line.startsWith('## ') && inTaskSection &&
          !line.includes('Things You Committed To') &&
          !line.includes('Priority Action Items')) {
        inTaskSection = false;
      }

      // 提取未完成的待辦事項
      if (inTaskSection && line.includes('- [ ] **')) {
        const match = line.match(/- \[ \] \*\*(.+?)\*\*/);
        if (match) {
          const task = match[1];
          // 提取詳細內容
          const detailMatch = line.match(/\*\*(.+?)\*\*(.+)/);
          const detail = detailMatch ? detailMatch[2].trim() : '';

          tasks.push({
            title: task,
            detail: detail,
            raw: line
          });
        }
      }
    }

    return {
      filename: latestFile,
      date: latestFile.match(/(\d{4}-\d{2}-\d{2})/)?.[1],
      tasks: tasks,
      hasActiveTasks: tasks.length > 0
    };
  } catch (error) {
    console.error('  Error reading HighlightAI summary:', error.message);
    return null;
  }
}

// 獲取社群媒體互動記錄
function getSocialMediaActivity() {
  try {
    const SOCIAL_DIR = path.join(process.env.HOME, 'Dropbox/PKM-Vault/.ai-butler-system/shared-context/social-media');
    const INTERACTIONS_LOG = path.join(SOCIAL_DIR, 'iris-interactions.json');

    if (!fs.existsSync(INTERACTIONS_LOG)) {
      return [];
    }

    const data = JSON.parse(fs.readFileSync(INTERACTIONS_LOG, 'utf8'));
    const today = new Date().toISOString().split('T')[0];

    return data.interactions.filter(i => {
      const interactionDate = i.timestamp.split('T')[0];
      return interactionDate === today;
    });
  } catch (error) {
    console.error('  Error reading social media activity:', error.message);
    return [];
  }
}

// 獲取 MAGI Task Queue 昨日完成的任務
function getMAGITaskQueueActivity() {
  try {
    const TASKS_FILE = path.join(process.env.HOME, 'Dropbox/PKM-Vault/.ai-butler-system/TASKS.md');

    if (!fs.existsSync(TASKS_FILE)) {
      return null;
    }

    const content = fs.readFileSync(TASKS_FILE, 'utf8');
    const lines = content.split('\n');

    // 獲取昨天的日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const completedTasks = [];
    let currentTask = null;
    let inCompletedSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 檢測進入 Completed 區塊
      if (line.includes('## ✅ Completed')) {
        inCompletedSection = true;
        continue;
      }

      // 遇到其他 section，退出
      if (inCompletedSection && line.startsWith('## ') && !line.includes('Completed')) {
        break;
      }

      if (!inCompletedSection) continue;

      // 新任務開始
      if (line.startsWith('### ')) {
        if (currentTask && currentTask.completedDate === yesterdayStr) {
          completedTasks.push(currentTask);
        }
        currentTask = {
          title: line.replace('### ', '').trim(),
          id: null,
          assignedTo: null,
          completedDate: null,
          autoExecute: false,
          command: null,
          results: null
        };
      }

      // 解析任務欄位
      if (currentTask && line.trim().startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\*:\s*(.+)/);
        if (match) {
          const [, key, value] = match;
          const cleanValue = value.trim();

          switch (key) {
            case 'ID':
              currentTask.id = cleanValue;
              break;
            case 'Title':
              currentTask.subtitle = cleanValue;
              break;
            case 'Assigned To':
              currentTask.assignedTo = cleanValue;
              break;
            case 'Completed':
              currentTask.completedDate = cleanValue;
              break;
            case 'Auto-Execute':
              currentTask.autoExecute = cleanValue.toLowerCase() === 'true';
              break;
            case 'Command':
              currentTask.command = cleanValue;
              break;
          }
        }
      }

      // 解析 Results（多行內容）
      if (currentTask && line.trim() === '- **Results**:') {
        let resultsLines = [];
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].startsWith('- **') || lines[j].startsWith('###')) {
            break;
          }
          if (lines[j].trim()) {
            resultsLines.push(lines[j].trim());
          }
        }
        currentTask.results = resultsLines.join(' ');
      }
    }

    // 添加最後一個任務
    if (currentTask && currentTask.completedDate === yesterdayStr) {
      completedTasks.push(currentTask);
    }

    return {
      date: yesterdayStr,
      tasks: completedTasks,
      totalTasks: completedTasks.length,
      autoExecutedTasks: completedTasks.filter(t => t.autoExecute).length,
      irisTasks: completedTasks.filter(t => t.assignedTo === 'Iris').length,
      lucyTasks: completedTasks.filter(t => t.assignedTo === 'Lucy').length
    };
  } catch (error) {
    console.error('  Error reading MAGI Task Queue:', error.message);
    return null;
  }
}

// 主函數
async function main() {
  console.log('🚀 Daily Brief Generator');
  console.log('========================\n');

  // 開始執行追蹤
  const exec = magi.startExecution('daily-brief', { source: 'launchagent' });

  // 取得前次執行資訊（可用於上下文）
  const lastRun = await magi.getLastExecution('daily-brief');
  if (lastRun) {
    console.log(`📋 Last run: ${lastRun.timestamp} (${lastRun.status})\n`);
  }

  try {
    const startTime = Date.now();

    // 收集所有數據（並行處理）
    console.log('📊 Collecting data...\n');

    const [emails, meetings, qqq, news, cryptoReport, socialMediaReport, arbitrageReport] = await Promise.all([
      getImportantEmails(),
      getUpcomingMeetings(),
      getQQQPrice(),
      getAINews(),
      cryptoMonitor.generateReport(),
      socialMediaTracker.generateDailyReport(),
      arbitrageMonitor.main()
    ]);

    // 獲取社群媒體和 Slack 數據（同步，因為是本地讀取）
    const socialActivity = getSocialMediaActivity();
    const slackSummary = getSlackSummary();
    const personalSocialMedia = socialMediaSummary.generateSummary();  // 你的自動發文/回文摘要
    const highlightAI = getHighlightAISummary();  // 獲取 HighlightAI 待辦事項
    const magiTasks = getMAGITaskQueueActivity();  // 獲取 MAGI Task Queue 昨日活動

    console.log('\n✅ Data collection complete\n');

    // 生成 Markdown
    console.log('📝 Generating markdown...');
    const data = {
      emails,
      meetings,
      qqq,
      news,
      socialActivity,
      slack: slackSummary,
      crypto: cryptoReport,
      companySocial: socialMediaReport,
      arbitrage: arbitrageReport,
      personalSocialMedia: personalSocialMedia,  // 你的自動社交媒體活動
      highlightAI: highlightAI,  // HighlightAI 待辦事項
      magiTasks: magiTasks  // MAGI Task Queue 昨日活動
    };
    const markdown = generateMarkdown(data);

    // 確保目錄存在
    if (!fs.existsSync(VAULT_PATH)) {
      fs.mkdirSync(VAULT_PATH, { recursive: true });
    }

    // 寫入檔案
    const { filename } = getFormattedDate();
    const filePath = path.join(VAULT_PATH, filename);

    fs.writeFileSync(filePath, markdown, 'utf-8');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Daily brief generated successfully!`);
    console.log(`📁 File: ${filePath}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('\n🎉 Have a productive day!\n');

    // 發送成功通知
    const emailCount = emails.length;
    const meetingCount = meetings.length;
    const summaryParts = [];

    if (emailCount > 0) summaryParts.push(`${emailCount} 封郵件`);
    if (meetingCount > 0) summaryParts.push(`${meetingCount} 個會議`);

    const summary = summaryParts.length > 0
      ? summaryParts.join('、')
      : '無待辦事項';

    notify.success(
      `Daily Brief 已生成`,
      `今日：${summary}`
    );

    // 記錄成功執行到 MAGI Memory
    await exec.end({
      status: 'success',
      output: filePath,
      metadata: {
        emailCount,
        meetingCount,
        newsCount: news?.length || 0,
        duration: parseFloat(duration)
      }
    });

  } catch (error) {
    console.error('\n❌ Error generating daily brief:', error);
    console.error(error.stack);

    // 發送錯誤通知
    notify.error(
      'Daily Brief 生成失敗',
      error.message.substring(0, 50)
    );

    // 記錄失敗執行到 MAGI Memory
    await exec.fail(error);

    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main();
}

module.exports = { main, generateMarkdown, getQQQPrice, getAINews };
