import { db } from '../db/database';
import { toDateString } from '../utils/dates';

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
 */
export function sendNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    });
  } catch (err) {
    console.error('[Notifications] Failed to send notification:', err);
  }
}

/**
 * Initializes a background timer checking every 45 seconds for scheduled local reminders.
 */
export function initializeNotificationScheduler(): void {
  // Check immediately, then check once every 45 seconds
  checkScheduledNotifications().catch(console.error);
  
  setInterval(async () => {
    await checkScheduledNotifications();
  }, 45000);
}

/**
 * Queries IndexedDB for active configurations and fires matching triggers.
 */
async function checkScheduledNotifications(): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

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
            ? '⚡ Tracker Morning Standup' 
            : config.kind === 'end_of_day' 
            ? 'Reflection Time 📊' 
            : 'Reflection Loop 🔄';
            
          sendNotification(title, config.message);
          localStorage.setItem(storageKey, 'true');
          console.log(`[Notifications] Fired scheduled notification: ${config.kind}`);
        }
      }
    }
  } catch (err) {
    console.error('[Notifications] Scheduler failed to read configurations:', err);
  }
}
