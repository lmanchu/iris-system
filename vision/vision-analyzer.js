#!/usr/bin/env node

/**
 * Iris Vision Analyzer
 * Analyzes screenshots and provides contextual assistance
 *
 * This module works within Claude Code environment where vision capabilities
 * are natively available. It structures the analysis and provides actionable insights.
 */

const fs = require('fs');
const path = require('path');
const VisionCapture = require('./vision-capture');

class VisionAnalyzer {
    constructor(options = {}) {
        this.capture = new VisionCapture(options);
        this.analysisDir = options.analysisDir || path.join(process.env.HOME, '.iris-vision', 'analysis');
        this.contextWindow = options.contextWindow || 5; // Keep last N analyses for context

        this.ensureAnalysisDir();
    }

    ensureAnalysisDir() {
        if (!fs.existsSync(this.analysisDir)) {
            fs.mkdirSync(this.analysisDir, { recursive: true });
        }
    }

    /**
     * Analyze current screen
     * This is a meta-function that would be called by Claude Code
     * to perform actual visual analysis
     */
    async analyzeScreen(screenshotPath, options = {}) {
        const analysis = {
            timestamp: new Date().toISOString(),
            screenshotPath: screenshotPath,
            type: options.type || 'full_screen',
            context: options.context || {},

            // Analysis results (to be filled by Claude vision)
            scene: {
                application: null,      // What app is this?
                activity: null,         // What is the user doing?
                focus: null            // What element has focus?
            },

            elements: {
                errors: [],            // Error messages detected
                warnings: [],          // Warnings detected
                actionable: [],        // Clickable elements, forms, etc.
                text: []              // Important text content
            },

            insights: {
                userIntent: null,      // What is the user trying to do?
                blockers: [],          // What might be blocking progress?
                suggestions: [],       // What can we help with?
                automation: []         // What can be automated?
            },

            metadata: {
                confidence: 0,         // Confidence in analysis (0-1)
                needsHumanReview: false,
                tags: []
            }
        };

        // Save analysis
        const analysisPath = this.saveAnalysis(analysis);

        return {
            analysis,
            analysisPath,
            screenshotPath
        };
    }

    /**
     * Generate analysis prompt for Claude
     * This creates a structured prompt for vision analysis
     */
    generateAnalysisPrompt(options = {}) {
        const mode = options.mode || 'assistant'; // 'assistant', 'debug', 'automation'

        const basePrompt = `Analyze this screenshot and provide structured information.`;

        const modes = {
            assistant: `
Focus on helping the user:
1. What application/website is this?
2. What is the user trying to do?
3. Are there any errors or warnings?
4. What can I help with?
5. Any suggestions or tips?
`,
            debug: `
Focus on technical debugging:
1. Identify any error messages
2. Check console output if visible
3. Identify stack traces or error codes
4. Suggest fixes or debugging steps
`,
            automation: `
Focus on automation opportunities:
1. What repetitive tasks are visible?
2. What forms or inputs need filling?
3. What workflows can be automated?
4. What browser actions are needed?
`,
            security: `
Focus on security and privacy:
1. Are there any exposed credentials?
2. Any security warnings?
3. Suspicious activity?
4. Privacy concerns?
`
        };

        return basePrompt + '\n' + (modes[mode] || modes.assistant);
    }

    /**
     * Save analysis to disk
     */
    saveAnalysis(analysis) {
        const filename = `analysis-${Date.now()}.json`;
        const filepath = path.join(this.analysisDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));

        return filepath;
    }

    /**
     * Load recent analyses for context
     */
    loadRecentAnalyses(limit = 5) {
        try {
            const files = fs.readdirSync(this.analysisDir)
                .filter(f => f.startsWith('analysis-') && f.endsWith('.json'))
                .sort()
                .reverse()
                .slice(0, limit);

            return files.map(f => {
                const content = fs.readFileSync(path.join(this.analysisDir, f), 'utf8');
                return JSON.parse(content);
            });
        } catch (error) {
            console.error('Failed to load recent analyses:', error.message);
            return [];
        }
    }

    /**
     * Compare two analyses to detect changes
     */
    compareAnalyses(analysis1, analysis2) {
        const changes = {
            application: analysis1.scene.application !== analysis2.scene.application,
            activity: analysis1.scene.activity !== analysis2.scene.activity,
            newErrors: analysis2.elements.errors.filter(e =>
                !analysis1.elements.errors.some(e1 => e1 === e)
            ),
            resolvedErrors: analysis1.elements.errors.filter(e =>
                !analysis2.elements.errors.some(e2 => e2 === e)
            )
        };

        return changes;
    }

    /**
     * Generate assistance message based on analysis
     */
    generateAssistanceMessage(analysis) {
        const messages = [];

        // Check for errors
        if (analysis.elements.errors.length > 0) {
            messages.push({
                type: 'error',
                priority: 'high',
                message: `我注意到有 ${analysis.elements.errors.length} 個錯誤：`,
                details: analysis.elements.errors,
                suggestion: '需要我幫你解決嗎？'
            });
        }

        // Check for warnings
        if (analysis.elements.warnings.length > 0) {
            messages.push({
                type: 'warning',
                priority: 'medium',
                message: `有 ${analysis.elements.warnings.length} 個警告需要注意`,
                details: analysis.elements.warnings
            });
        }

        // Proactive suggestions
        if (analysis.insights.suggestions.length > 0) {
            messages.push({
                type: 'suggestion',
                priority: 'low',
                message: '我有一些建議：',
                details: analysis.insights.suggestions
            });
        }

        // Automation opportunities
        if (analysis.insights.automation.length > 0) {
            messages.push({
                type: 'automation',
                priority: 'medium',
                message: '這些任務可以自動化：',
                details: analysis.insights.automation
            });
        }

        return messages;
    }

    /**
     * Create monitoring session
     * Continuously monitors screen and provides assistance
     */
    async startMonitoring(options = {}) {
        const interval = options.interval || 30000; // 30 seconds default
        const mode = options.mode || 'assistant';

        console.log(`🎨 Starting Iris Vision Monitoring`);
        console.log(`   Mode: ${mode}`);
        console.log(`   Interval: ${interval / 1000}s`);
        console.log(`   Press Ctrl+C to stop\n`);

        let previousAnalysis = null;

        const monitor = async () => {
            try {
                // Capture screen
                const screenshot = this.capture.captureFullScreen();
                console.log(`📸 Captured: ${path.basename(screenshot)}`);

                // In actual implementation with Claude Code:
                // 1. Claude Code would read the screenshot
                // 2. Perform visual analysis
                // 3. Generate assistance messages

                console.log(`🔍 Analysis would be performed here by Claude vision`);
                console.log(`   Prompt: ${this.generateAnalysisPrompt({ mode })}`);
                console.log();

                // Placeholder for actual analysis
                const analysis = await this.analyzeScreen(screenshot, { type: 'monitoring', mode });

                // Compare with previous analysis
                if (previousAnalysis) {
                    const changes = this.compareAnalyses(previousAnalysis, analysis);
                    if (changes.application || changes.newErrors.length > 0) {
                        console.log('🔔 Changes detected!');
                    }
                }

                // Generate assistance
                const messages = this.generateAssistanceMessage(analysis);
                if (messages.length > 0) {
                    console.log('💡 Assistance available:');
                    messages.forEach(m => {
                        console.log(`   [${m.type}] ${m.message}`);
                    });
                }

                previousAnalysis = analysis;

            } catch (error) {
                console.error('❌ Monitoring error:', error.message);
            }
        };

        // Initial analysis
        await monitor();

        // Set up interval
        if (!options.once) {
            setInterval(monitor, interval);
        }
    }

    /**
     * Analyze specific workflow
     */
    async analyzeWorkflow(name, steps) {
        console.log(`\n📋 Analyzing workflow: ${name}`);

        const workflow = {
            name,
            startTime: new Date().toISOString(),
            steps: [],
            completed: false
        };

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`\n  Step ${i + 1}: ${step.description}`);

            if (step.waitForUser) {
                console.log(`  ⏸️  Waiting for user action...`);
                // In real implementation, wait for screen change
            }

            const screenshot = this.capture.captureFullScreen();
            const analysis = await this.analyzeScreen(screenshot, {
                type: 'workflow_step',
                step: i + 1,
                total: steps.length
            });

            workflow.steps.push({
                ...step,
                screenshot,
                analysis,
                timestamp: new Date().toISOString()
            });
        }

        workflow.endTime = new Date().toISOString();
        workflow.completed = true;

        return workflow;
    }

    /**
     * Get statistics
     */
    getStats() {
        const analyses = this.loadRecentAnalyses(100);

        return {
            totalAnalyses: analyses.length,
            recentAnalyses: analyses.slice(0, 5).map(a => ({
                timestamp: a.timestamp,
                application: a.scene.application,
                errors: a.elements.errors.length
            })),
            analysisDir: this.analysisDir
        };
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';

    const analyzer = new VisionAnalyzer();

    (async () => {
        try {
            switch (command) {
                case 'analyze':
                    console.log('🎨 Iris Vision Analyzer\n');
                    const screenshot = analyzer.capture.captureFullScreen();
                    console.log(`\n📸 Screenshot captured`);
                    console.log(`\n🔍 To analyze this screenshot in Claude Code:`);
                    console.log(`   1. Use Read tool on: ${screenshot}`);
                    console.log(`   2. Apply analysis prompt for structured insights\n`);
                    break;

                case 'monitor':
                    const interval = parseInt(args[1]) || 30000;
                    await analyzer.startMonitoring({
                        interval,
                        mode: args[2] || 'assistant'
                    });
                    break;

                case 'once':
                    await analyzer.startMonitoring({ once: true });
                    break;

                case 'stats':
                    const stats = analyzer.getStats();
                    console.log('\n📊 Vision Analysis Statistics:');
                    console.log(`   Total analyses: ${stats.totalAnalyses}`);
                    console.log(`   Directory: ${stats.analysisDir}\n`);
                    if (stats.recentAnalyses.length > 0) {
                        console.log('Recent analyses:');
                        stats.recentAnalyses.forEach((a, i) => {
                            console.log(`   ${i + 1}. ${new Date(a.timestamp).toLocaleString()}`);
                            console.log(`      App: ${a.application || 'unknown'}`);
                            console.log(`      Errors: ${a.errors}`);
                        });
                    }
                    break;

                case 'help':
                    console.log('Usage: node vision-analyzer.js [command] [options]\n');
                    console.log('Commands:');
                    console.log('  analyze              Capture and analyze current screen');
                    console.log('  monitor [interval]   Start continuous monitoring (default: 30s)');
                    console.log('  once                 Single analysis with assistance');
                    console.log('  stats                Show analysis statistics');
                    console.log('  help                 Show this help\n');
                    console.log('Examples:');
                    console.log('  node vision-analyzer.js analyze');
                    console.log('  node vision-analyzer.js monitor 60000');
                    console.log('  node vision-analyzer.js monitor 30000 debug');
                    break;

                default:
                    console.error(`Unknown command: ${command}`);
                    console.log('Run "node vision-analyzer.js help" for usage');
                    process.exit(1);
            }
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = VisionAnalyzer;
