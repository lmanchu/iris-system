#!/usr/bin/env node

/**
 * Iris Mac Notification Helper
 *
 * A simple utility to send macOS notifications from Iris automation scripts.
 * Uses osascript to trigger native macOS notifications.
 *
 * Usage:
 *   const notify = require('./iris-notifier');
 *
 *   // Simple notification
 *   notify('Task completed!');
 *
 *   // Full notification with all options
 *   notify('Daily Brief generated', {
 *     title: 'Iris',
 *     subtitle: 'Daily Automation',
 *     sound: 'Glass'
 *   });
 *
 * Available sounds: Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse,
 *                   Ping, Pop, Purr, Sosumi, Submarine, Tink
 */

const { execSync } = require('child_process');

/**
 * Send a notification to iPhone via iCloud Reminders
 * @param {string} message - The notification message
 * @param {string} title - Notification title
 */
function sendToiPhone(message, title = 'Iris') {
  const escapeQuotes = (str) => str.replace(/'/g, "'\\''");

  const escapedMessage = escapeQuotes(message);
  const escapedTitle = escapeQuotes(title);

  const reminderScript = `
    tell application "Reminders"
      tell default list
        set newReminder to make new reminder with properties {name:"${escapedTitle}", body:"${escapedMessage}", due date:(current date)}
        set reminderID to id of newReminder
      end tell
    end tell

    -- Auto-complete after 2 seconds to avoid clutter
    delay 2

    tell application "Reminders"
      set theReminders to reminders of default list whose name is "${escapedTitle}"
      repeat with r in theReminders
        if body of r is "${escapedMessage}" then
          set completed of r to true
        end if
      end repeat
    end tell
  `;

  try {
    // Run in background to avoid blocking
    require('child_process').spawn('osascript', ['-e', reminderScript], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    return true;
  } catch (error) {
    console.error('Failed to send iPhone notification:', error.message);
    return false;
  }
}

/**
 * Send a macOS notification
 * @param {string} message - The notification message
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title (default: 'Iris')
 * @param {string} options.subtitle - Notification subtitle
 * @param {string} options.sound - System sound name
 * @param {boolean} options.sendToiPhone - Also send to iPhone via iCloud (default: false)
 */
function notify(message, options = {}) {
  const {
    title = 'Iris',
    subtitle = '',
    sound = 'Glass',
    sendToiPhone: toiPhone = false
  } = options;

  // Escape quotes in strings
  const escapeQuotes = (str) => str.replace(/"/g, '\\"');

  const escapedMessage = escapeQuotes(message);
  const escapedTitle = escapeQuotes(title);
  const escapedSubtitle = escapeQuotes(subtitle);

  // Build AppleScript command for Mac notification
  let script = `display notification "${escapedMessage}" with title "${escapedTitle}"`;

  if (subtitle) {
    script += ` subtitle "${escapedSubtitle}"`;
  }

  if (sound) {
    script += ` sound name "${sound}"`;
  }

  try {
    // Send Mac notification
    execSync(`osascript -e '${script}'`);

    // Send iPhone notification if requested
    if (toiPhone) {
      const iPhoneMessage = subtitle ? `${subtitle}\n${message}` : message;
      sendToiPhone(iPhoneMessage, title);
    }

    return true;
  } catch (error) {
    console.error('Failed to send notification:', error.message);
    return false;
  }
}

/**
 * Send a success notification
 */
function success(message, subtitle = '', toiPhone = false) {
  return notify(message, {
    title: 'Iris ✓',
    subtitle,
    sound: 'Glass',
    sendToiPhone: toiPhone
  });
}

/**
 * Send an error notification
 */
function error(message, subtitle = '', toiPhone = false) {
  return notify(message, {
    title: 'Iris ✗',
    subtitle,
    sound: 'Basso',
    sendToiPhone: toiPhone
  });
}

/**
 * Send an info notification
 */
function info(message, subtitle = '', toiPhone = false) {
  return notify(message, {
    title: 'Iris ℹ',
    subtitle,
    sound: 'Purr',
    sendToiPhone: toiPhone
  });
}

/**
 * Send a warning notification
 */
function warning(message, subtitle = '', toiPhone = false) {
  return notify(message, {
    title: 'Iris ⚠',
    subtitle,
    sound: 'Funk',
    sendToiPhone: toiPhone
  });
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node iris-notifier.js <message> [title] [subtitle] [sound]');
    console.log('');
    console.log('Examples:');
    console.log('  node iris-notifier.js "Hello World"');
    console.log('  node iris-notifier.js "Task done" "Iris" "Automation"');
    console.log('  node iris-notifier.js "Error occurred" "Iris" "System Error" "Basso"');
    process.exit(1);
  }

  const [message, title, subtitle, sound] = args;
  notify(message, { title, subtitle, sound });
}

module.exports = notify;
module.exports.notify = notify;
module.exports.success = success;
module.exports.error = error;
module.exports.info = info;
module.exports.warning = warning;
