#!/usr/bin/env node

/**
 * Iris Vision Capture Module
 * Captures screenshots from various sources for visual analysis
 *
 * Features:
 * - Full screen capture (macOS)
 * - Active window capture
 * - Browser capture (via BrowserOS MCP)
 * - Automatic cleanup of old screenshots
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VisionCapture {
    constructor(options = {}) {
        this.captureDir = options.captureDir || path.join(process.env.HOME, '.iris-vision', 'captures');
        this.maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 hours
        this.maxFiles = options.maxFiles || 100;

        this.ensureCaptureDir();
    }

    /**
     * Ensure capture directory exists
     */
    ensureCaptureDir() {
        if (!fs.existsSync(this.captureDir)) {
            fs.mkdirSync(this.captureDir, { recursive: true });
            console.log(`Created capture directory: ${this.captureDir}`);
        }
    }

    /**
     * Generate unique filename with timestamp
     */
    generateFilename(prefix = 'screen', extension = 'png') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return path.join(this.captureDir, `${prefix}-${timestamp}.${extension}`);
    }

    /**
     * Capture full screen
     * @returns {string} Path to screenshot file
     */
    captureFullScreen() {
        const filename = this.generateFilename('fullscreen');

        try {
            // Use macOS screencapture command
            execSync(`screencapture -x "${filename}"`, { stdio: 'pipe' });

            console.log(`✓ Full screen captured: ${filename}`);
            return filename;
        } catch (error) {
            console.error('Failed to capture full screen:', error.message);
            throw error;
        }
    }

    /**
     * Capture active window
     * @returns {string} Path to screenshot file
     */
    captureActiveWindow() {
        const filename = this.generateFilename('window');

        try {
            // Use macOS screencapture with window selection (-w for window)
            execSync(`screencapture -x -w "${filename}"`, { stdio: 'pipe' });

            console.log(`✓ Active window captured: ${filename}`);
            return filename;
        } catch (error) {
            console.error('Failed to capture active window:', error.message);
            throw error;
        }
    }

    /**
     * Capture specific region
     * @param {Object} region - {x, y, width, height}
     * @returns {string} Path to screenshot file
     */
    captureRegion(region) {
        const filename = this.generateFilename('region');
        const { x, y, width, height } = region;

        try {
            // Use macOS screencapture with region selection (-R for region)
            execSync(`screencapture -x -R${x},${y},${width},${height} "${filename}"`, { stdio: 'pipe' });

            console.log(`✓ Region captured: ${filename}`);
            return filename;
        } catch (error) {
            console.error('Failed to capture region:', error.message);
            throw error;
        }
    }

    /**
     * Capture browser via BrowserOS (requires BrowserOS MCP running)
     * Note: This is a placeholder - actual implementation would use BrowserOS MCP
     * @param {number} tabId - Browser tab ID
     * @returns {string} Path to screenshot file
     */
    async captureBrowser(tabId) {
        const filename = this.generateFilename('browser');

        console.log(`→ Browser capture for tab ${tabId} (via BrowserOS MCP)`);
        console.log(`  This would call: mcp__browseros__browser_get_screenshot`);
        console.log(`  Saving to: ${filename}`);

        // In actual implementation, this would:
        // 1. Call BrowserOS MCP screenshot API
        // 2. Save the returned image to filename
        // 3. Return the filename

        return filename;
    }

    /**
     * Interactive capture - let user select area
     * @returns {string} Path to screenshot file
     */
    captureInteractive() {
        const filename = this.generateFilename('interactive');

        try {
            // Use macOS screencapture with interactive selection (-i)
            execSync(`screencapture -i "${filename}"`, { stdio: 'inherit' });

            console.log(`✓ Interactive capture saved: ${filename}`);
            return filename;
        } catch (error) {
            console.error('Failed to capture interactively:', error.message);
            throw error;
        }
    }

    /**
     * Get screenshot metadata
     * @param {string} filepath - Path to screenshot
     * @returns {Object} Metadata
     */
    getMetadata(filepath) {
        try {
            const stats = fs.statSync(filepath);
            return {
                path: filepath,
                filename: path.basename(filepath),
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                age: Date.now() - stats.birthtime.getTime()
            };
        } catch (error) {
            console.error('Failed to get metadata:', error.message);
            return null;
        }
    }

    /**
     * List all captured screenshots
     * @returns {Array} List of screenshot files with metadata
     */
    listCaptures() {
        try {
            const files = fs.readdirSync(this.captureDir)
                .filter(f => f.endsWith('.png'))
                .map(f => this.getMetadata(path.join(this.captureDir, f)))
                .filter(m => m !== null)
                .sort((a, b) => b.created - a.created);

            return files;
        } catch (error) {
            console.error('Failed to list captures:', error.message);
            return [];
        }
    }

    /**
     * Clean up old screenshots
     * @returns {number} Number of files deleted
     */
    cleanup() {
        try {
            const files = this.listCaptures();
            let deleted = 0;

            // Delete files older than maxAge
            const oldFiles = files.filter(f => f.age > this.maxAge);
            oldFiles.forEach(f => {
                fs.unlinkSync(f.path);
                deleted++;
                console.log(`Deleted old capture: ${f.filename}`);
            });

            // Delete excess files if over maxFiles limit
            if (files.length - deleted > this.maxFiles) {
                const excessFiles = files
                    .filter(f => f.age <= this.maxAge)
                    .slice(this.maxFiles);

                excessFiles.forEach(f => {
                    fs.unlinkSync(f.path);
                    deleted++;
                    console.log(`Deleted excess capture: ${f.filename}`);
                });
            }

            console.log(`✓ Cleanup complete: ${deleted} files deleted`);
            return deleted;
        } catch (error) {
            console.error('Cleanup failed:', error.message);
            return 0;
        }
    }

    /**
     * Get statistics about captures
     * @returns {Object} Statistics
     */
    getStats() {
        const files = this.listCaptures();
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);

        return {
            totalFiles: files.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            oldestCapture: files.length > 0 ? files[files.length - 1].created : null,
            newestCapture: files.length > 0 ? files[0].created : null,
            captureDir: this.captureDir
        };
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'fullscreen';

    const capture = new VisionCapture();

    console.log('🎨 Iris Vision Capture');
    console.log('====================\n');

    try {
        switch (command) {
            case 'fullscreen':
            case 'full':
                const fullScreenPath = capture.captureFullScreen();
                console.log(`\nScreenshot saved to: ${fullScreenPath}`);
                break;

            case 'window':
            case 'w':
                const windowPath = capture.captureActiveWindow();
                console.log(`\nScreenshot saved to: ${windowPath}`);
                break;

            case 'interactive':
            case 'i':
                const interactivePath = capture.captureInteractive();
                console.log(`\nScreenshot saved to: ${interactivePath}`);
                break;

            case 'list':
            case 'ls':
                const files = capture.listCaptures();
                console.log(`Found ${files.length} captures:\n`);
                files.slice(0, 10).forEach((f, i) => {
                    console.log(`${i + 1}. ${f.filename}`);
                    console.log(`   Size: ${(f.size / 1024).toFixed(2)} KB`);
                    console.log(`   Created: ${f.created.toLocaleString()}`);
                    console.log();
                });
                if (files.length > 10) {
                    console.log(`... and ${files.length - 10} more`);
                }
                break;

            case 'cleanup':
                const deleted = capture.cleanup();
                console.log(`\nDeleted ${deleted} old files`);
                break;

            case 'stats':
                const stats = capture.getStats();
                console.log('Capture Statistics:');
                console.log(`  Total files: ${stats.totalFiles}`);
                console.log(`  Total size: ${stats.totalSizeMB} MB`);
                console.log(`  Directory: ${stats.captureDir}`);
                if (stats.newestCapture) {
                    console.log(`  Newest: ${stats.newestCapture.toLocaleString()}`);
                }
                if (stats.oldestCapture) {
                    console.log(`  Oldest: ${stats.oldestCapture.toLocaleString()}`);
                }
                break;

            case 'help':
            case '-h':
            case '--help':
                console.log('Usage: node vision-capture.js [command]');
                console.log('\nCommands:');
                console.log('  fullscreen, full     Capture full screen (default)');
                console.log('  window, w            Capture active window');
                console.log('  interactive, i       Interactive selection');
                console.log('  list, ls             List all captures');
                console.log('  cleanup              Delete old captures');
                console.log('  stats                Show statistics');
                console.log('  help                 Show this help');
                break;

            default:
                console.error(`Unknown command: ${command}`);
                console.log('Run "node vision-capture.js help" for usage');
                process.exit(1);
        }
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        process.exit(1);
    }
}

module.exports = VisionCapture;
