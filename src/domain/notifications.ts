import { db } from '../db/database';
import { toDateString } from '../utils/dates';
import type { NotificationLog } from '../db/models';

/**
 * Prompt the user for permission to display desktop notifications.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Desktop notifications not supported by this browser.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Immediately dispatch a browser desktop notification if permitted.
 * Also logs the notification to IndexedDB for the Notification Center.
 */
export async function sendNotification(title: string, body: string, kind?: string): Promise<void> {
  // Always log the notification regardless of permission
  try {
    const log: NotificationLog = {
      id: crypto.randomUUID(),
      kind: (kind as NotificationLog['kind']) || 'standup',
      title,
      message: body,
      firedAt: Date.now(),
      readAt: null,
    };
    await db.notificationLogs.add(log);
  } catch (err) {
    console.error('[Notifications] Failed to log notification:', err);
  }

  // Try to show desktop notification
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/icons/icon.png',
      badge: '/icons/icon.png',
    });
  } catch (err) {
    console.error('[Notifications] Failed to send notification:', err);
  }
}

/**
 * Initializes a background timer checking every 45 seconds for scheduled local reminders.
 */
export function initializeNotificationScheduler(): void {
  checkScheduledNotifications().catch(console.error);

  setInterval(async () => {
    await checkScheduledNotifications();
  }, 45000);
}

/**
 * Queries IndexedDB for active configurations and fires matching triggers.
 */
async function checkScheduledNotifications(): Promise<void> {
  const now = new Date();
  const todayStr = toDateString();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${currentHours}:${currentMinutes}`;
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  try {
    const allConfigs = await db.notifications.toArray();
    const enabledConfigs = allConfigs.filter((c) => c.enabled);

    for (const config of enabledConfigs) {
      let isMatch = false;

      // Handle simple times (e.g. '08:00')
      if (config.kind === 'standup' || config.kind === 'end_of_day') {
        if (config.schedule === timeStr) {
          isMatch = true;
        }
      }

      // Handle day-specific times (e.g. 'Sunday 19:00')
      if (config.kind === 'weekly_review') {
        const parts = config.schedule.split(' ');
        if (parts.length === 2) {
          const [day, time] = parts;
          if (day.toLowerCase() === dayName.toLowerCase() && time === timeStr) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        const storageKey = `tracker_notified_${config.kind}_${todayStr}`;
        const alreadyNotified = localStorage.getItem(storageKey);

        if (!alreadyNotified) {
          const title = config.kind === 'standup'
            ? '⚡ GrindOS Morning Standup'
            : config.kind === 'end_of_day'
            ? 'Reflection Time 📊'
            : 'Reflection Loop 🔄';

          await sendNotification(title, config.message, config.kind);
          localStorage.setItem(storageKey, 'true');
          console.log(`[Notifications] Fired scheduled notification: ${config.kind}`);
        }
      }
    }
  } catch (err) {
    console.error('[Notifications] Scheduler failed to read configurations:', err);
  }
}
