import { db } from '../db/database';
import { rolloverTasks } from '../db/operations';
import { toDateString } from '../utils/dates';
import { TaskStatus } from '../db/models';

/**
 * Check if the 4:00 AM rollover needs to be applied, and execute it retroactively if missed.
 */
export async function checkAndApplyRollover(): Promise<void> {
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = toDateString();

  // If it's before 4 AM, the rollover for "today" hasn't triggered yet.
  if (currentHour < 4) return;

  const lastRollover = localStorage.getItem('tracker_last_rollover_date');

  // Trigger if we haven't rolled over today
  if (!lastRollover || lastRollover < todayStr) {
    try {
      // Find previous unfinished tasks
      const allTasks = await db.tasks.toArray();
      const unfinishedPreviousTasks = allTasks.filter(
        (t) =>
          t.plannedFor !== null &&
          t.plannedFor < todayStr &&
          t.status !== TaskStatus.DONE &&
          t.status !== TaskStatus.DEFERRED &&
          t.status !== TaskStatus.BACKLOG
      );

      if (unfinishedPreviousTasks.length > 0) {
        const taskIds = unfinishedPreviousTasks.map((t) => t.id);
        await rolloverTasks(taskIds, todayStr);
        console.log(`[Rollover] Retroactively rolled over ${taskIds.length} tasks to ${todayStr}`);
      }

      // Mark rollover as completed for today
      localStorage.setItem('tracker_last_rollover_date', todayStr);

      // Force standup gate to appear for today's new plan
      localStorage.removeItem(`tracker_standup_completed_${todayStr}`);
      
      // Dispatch custom event to let components (like TodayScreen) know data refreshed
      window.dispatchEvent(new Event('tracker_rollover_applied'));
    } catch (err) {
      console.error('[Rollover] Failed to apply rollover:', err);
    }
  }
}

/**
 * Schedules the rollover check to run automatically at the next upcoming 4:00 AM.
 * Keeps running if the app is left open overnight.
 */
export function scheduleNextRollover(): void {
  const now = new Date();
  const next4AM = new Date(now);
  next4AM.setHours(4, 0, 0, 0);

  // If it is already past 4 AM today, schedule for tomorrow's 4 AM
  if (now.getHours() >= 4) {
    next4AM.setDate(now.getDate() + 1);
  }

  const msUntil4AM = next4AM.getTime() - now.getTime();
  
  console.log(`[Rollover] Next automatic rollover scheduled in ${Math.round(msUntil4AM / 1000 / 60)} minutes.`);

  setTimeout(async () => {
    await checkAndApplyRollover();
    // Re-schedule for the following day
    scheduleNextRollover();
  }, msUntil4AM);
}

/**
 * Initialize rollover systems on application startup.
 */
export async function initializeRollover(): Promise<void> {
  await checkAndApplyRollover();
  scheduleNextRollover();
}
