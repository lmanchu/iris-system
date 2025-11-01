#!/usr/bin/env node

/**
 * Iris Vision Assistant
 * Proactively monitors screen and provides contextual assistance
 *
 * This is the main module that ties everything together:
 * - Captures screenshots periodically
 * - Analyzes visual content
 * - Detects when help is needed
 * - Sends proactive notifications
 *
 * Integration with Claude Code:
 * - This module captures and stores screenshots
 * - Claude Code (with vision) reads and analyzes them
 * - Results are used to provide contextual assistance
 */

const VisionCapture = require('./vision-capture');
const VisionAnalyzer = require('./vision-analyzer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VisionAssistant {
    constructor(options = {}) {
        this.capture = new VisionCapture(options);
        this.analyzer = new VisionAnalyzer(options);

        this.config = {
            monitoringInterval: options.interval || 60000, // 1 minute default
            notificationEnabled: options.notifications !== false,
            autoAnalyze: options.autoAnalyze !== false,
            mode: options.mode || 'assistant', // 'assistant', 'debug', 'automation'
            minChangeThreshold: options.minChangeThreshold || 0.1
        };

        this.state = {
            isMonitoring: false,
            monitoringStarted: null,
            lastScreenshot: null,
            lastAnalysis: null,
            screenshotCount: 0,
            assistanceCount: 0
        };

        this.contextMemory = [];
        this.maxContextMemory = 10;
    }

    /**
     * Send notification to user
     */
    notify(title, message, type = 'info') {
        if (!this.config.notificationEnabled) return;

        try {
            // Use osascript for macOS notifications
            const script = `display notification "${message.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}"`;
            execSync(`osascript -e '${script}'`, { stdio: 'pipe' });
        } catch (error) {
            console.error('Failed to send notification:', error.message);
        }
    }

    /**
     * Detect if user needs help based on visual analysis
     */
    detectHelpNeeded(analysis) {
        const helpSignals = [];

        // Error messages
        if (analysis.elements && analysis.elements.errors.length > 0) {
            helpSignals.push({
                type: 'error',
                priority: 10,
                message: `檢測到 ${analysis.elements.errors.length} 個錯誤`,
                suggestion: '需要我幫你排查嗎？'
            });
        }

        // Repeated actions (from context memory)
        const recentActions = this.contextMemory.slice(-5);
        if (recentActions.length >= 3) {
            const sameApp = recentActions.every(a =>
                a.scene && a.scene.application === recentActions[0].scene.application
            );

            if (sameApp) {
                helpSignals.push({
                    type: 'pattern',
                    priority: 5,
                    message: `你在 ${recentActions[0].scene.application} 上已經工作了一段時間`,
                    suggestion: '需要自動化某些重複操作嗎？'
                });
            }
        }

        // Long idle time (no changes in last N screenshots)
        const recentSimilar = recentActions.slice(-3).every(a =>
            a.scene && a.scene.application === (recentActions[0].scene || {}).application
        );

        if (recentSimilar && recentActions.length >= 3) {
            helpSignals.push({
                type: 'idle',
                priority: 2,
                message: '螢幕內容似乎沒有變化',
                suggestion: '需要我幫忙完成什麼嗎？'
            });
        }

        return helpSignals.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Generate contextual assistance
     */
    generateAssistance(analysis, helpSignals) {
        if (helpSignals.length === 0) return null;

        const topSignal = helpSignals[0];

        return {
            timestamp: new Date().toISOString(),
            type: topSignal.type,
            priority: topSignal.priority,
            message: topSignal.message,
            suggestion: topSignal.suggestion,
            context: {
                application: analysis.scene ? analysis.scene.application : null,
                activity: analysis.scene ? analysis.scene.activity : null,
                errors: analysis.elements ? analysis.elements.errors : []
            },
            actions: this.suggestActions(analysis, topSignal)
        };
    }

    /**
     * Suggest concrete actions user can take
     */
    suggestActions(analysis, signal) {
        const actions = [];

        switch (signal.type) {
            case 'error':
                actions.push({
                    label: '分析錯誤原因',
                    command: 'analyze_error',
                    description: '讓我幫你分析這個錯誤的原因和解決方案'
                });
                actions.push({
                    label: '搜尋解決方案',
                    command: 'search_solution',
                    description: '在網上搜尋類似錯誤的解決方案'
                });
                break;

            case 'pattern':
                actions.push({
                    label: '自動化工作流',
                    command: 'automate_workflow',
                    description: '我可以幫你自動化這些重複操作'
                });
                break;

            case 'idle':
                actions.push({
                    label: '建議下一步',
                    command: 'suggest_next',
                    description: '根據你的工作內容建議下一步'
                });
                break;
        }

        return actions;
    }

    /**
     * Add analysis to context memory
     */
    addToContext(analysis) {
        this.contextMemory.push({
            timestamp: new Date().toISOString(),
            scene: analysis.scene,
            elements: analysis.elements,
            insights: analysis.insights
        });

        // Keep only recent context
        if (this.contextMemory.length > this.maxContextMemory) {
            this.contextMemory.shift();
        }
    }

    /**
     * Main monitoring loop
     */
    async monitoringCycle() {
        try {
            // Capture screenshot
            const screenshot = this.capture.captureFullScreen();
            this.state.lastScreenshot = screenshot;
            this.state.screenshotCount++;

            console.log(`\n📸 [${new Date().toLocaleTimeString()}] Screenshot ${this.state.screenshotCount}`);

            // Analyze screenshot
            // Note: In actual usage with Claude Code, Claude would:
            // 1. Read this screenshot using Read tool
            // 2. Perform visual analysis
            // 3. Return structured analysis

            const analysis = await this.analyzer.analyzeScreen(screenshot, {
                type: 'monitoring',
                mode: this.config.mode
            });

            this.state.lastAnalysis = analysis;

            // Add to context
            this.addToContext(analysis.analysis);

            // Detect if help is needed
            const helpSignals = this.detectHelpNeeded(analysis.analysis);

            if (helpSignals.length > 0) {
                console.log(`\n💡 檢測到 ${helpSignals.length} 個潛在的幫助機會:`);

                helpSignals.forEach((signal, i) => {
                    console.log(`   ${i + 1}. [${signal.type}] ${signal.message}`);
                    console.log(`      ${signal.suggestion}`);
                });

                // Generate assistance
                const assistance = this.generateAssistance(analysis.analysis, helpSignals);

                if (assistance) {
                    this.state.assistanceCount++;

                    // Send notification
                    this.notify(
                        'Iris 視覺助手',
                        assistance.message,
                        assistance.type
                    );

                    // Save assistance for later reference
                    this.saveAssistance(assistance);

                    console.log(`\n✓ 已發送通知和建議`);
                }
            } else {
                console.log(`   ✓ 一切正常，繼續監控...`);
            }

        } catch (error) {
            console.error(`\n❌ 監控循環錯誤:`, error.message);
        }
    }

    /**
     * Save assistance to disk for reference
     */
    saveAssistance(assistance) {
        const assistanceDir = path.join(process.env.HOME, '.iris-vision', 'assistance');

        if (!fs.existsSync(assistanceDir)) {
            fs.mkdirSync(assistanceDir, { recursive: true });
        }

        const filename = `assistance-${Date.now()}.json`;
        const filepath = path.join(assistanceDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(assistance, null, 2));
    }

    /**
     * Start monitoring
     */
    start() {
        if (this.state.isMonitoring) {
            console.log('⚠️  監控已在運行中');
            return;
        }

        this.state.isMonitoring = true;
        this.state.monitoringStarted = new Date();

        console.log('\n🎨 Iris Vision Assistant 已啟動');
        console.log('='.repeat(50));
        console.log(`模式: ${this.config.mode}`);
        console.log(`間隔: ${this.config.monitoringInterval / 1000} 秒`);
        console.log(`通知: ${this.config.notificationEnabled ? '啟用' : '停用'}`);
        console.log('='.repeat(50));
        console.log('\n按 Ctrl+C 停止監控\n');

        // Initial cycle
        this.monitoringCycle();

        // Set up interval
        this.monitoringInterval = setInterval(() => {
            this.monitoringCycle();
        }, this.config.monitoringInterval);

        // Send startup notification
        this.notify(
            'Iris Vision Assistant',
            '視覺助手已啟動，我會主動幫助你',
            'info'
        );
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (!this.state.isMonitoring) {
            console.log('⚠️  監控未在運行');
            return;
        }

        clearInterval(this.monitoringInterval);
        this.state.isMonitoring = false;

        const duration = Math.round((Date.now() - this.state.monitoringStarted) / 1000);

        console.log('\n🛑 Iris Vision Assistant 已停止');
        console.log(`運行時間: ${duration} 秒`);
        console.log(`截圖次數: ${this.state.screenshotCount}`);
        console.log(`提供協助: ${this.state.assistanceCount} 次`);

        this.notify(
            'Iris Vision Assistant',
            '視覺助手已停止',
            'info'
        );
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            isMonitoring: this.state.isMonitoring,
            uptime: this.state.monitoringStarted ?
                Math.round((Date.now() - this.state.monitoringStarted) / 1000) : 0,
            screenshots: this.state.screenshotCount,
            assistance: this.state.assistanceCount,
            contextSize: this.contextMemory.length,
            lastScreenshot: this.state.lastScreenshot,
            config: this.config
        };
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    // Parse options
    const options = {
        interval: parseInt(args[1]) || 60000,
        mode: args[2] || 'assistant',
        notifications: !args.includes('--no-notifications')
    };

    const assistant = new VisionAssistant(options);

    switch (command) {
        case 'start':
            assistant.start();

            // Handle Ctrl+C
            process.on('SIGINT', () => {
                console.log('\n');
                assistant.stop();
                process.exit(0);
            });
            break;

        case 'status':
            const status = assistant.getStatus();
            console.log('\n📊 Iris Vision Assistant 狀態:\n');
            console.log(`監控中: ${status.isMonitoring ? '是' : '否'}`);
            console.log(`運行時間: ${status.uptime} 秒`);
            console.log(`截圖次數: ${status.screenshots}`);
            console.log(`提供協助: ${status.assistance} 次`);
            console.log(`上下文記憶: ${status.contextSize} 項`);
            console.log(`\n配置:`);
            console.log(`  模式: ${status.config.mode}`);
            console.log(`  間隔: ${status.config.monitoringInterval / 1000} 秒`);
            console.log(`  通知: ${status.config.notificationEnabled ? '啟用' : '停用'}`);
            break;

        case 'help':
            console.log('\nIris Vision Assistant - 主動視覺助手\n');
            console.log('Usage: node vision-assistant.js [command] [options]\n');
            console.log('Commands:');
            console.log('  start [interval] [mode]  啟動監控 (預設: 60秒, assistant模式)');
            console.log('  status                   顯示狀態');
            console.log('  help                     顯示幫助\n');
            console.log('Modes:');
            console.log('  assistant               一般助手模式 (預設)');
            console.log('  debug                   除錯模式');
            console.log('  automation              自動化模式\n');
            console.log('Options:');
            console.log('  --no-notifications      停用通知\n');
            console.log('Examples:');
            console.log('  node vision-assistant.js start');
            console.log('  node vision-assistant.js start 30000 debug');
            console.log('  node vision-assistant.js start 60000 assistant --no-notifications');
            break;

        default:
            console.error(`未知命令: ${command}`);
            console.log('執行 "node vision-assistant.js help" 查看用法');
            process.exit(1);
    }
}

module.exports = VisionAssistant;
