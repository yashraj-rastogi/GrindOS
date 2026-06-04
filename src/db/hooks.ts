// ============================================================
// Tracker — Reactive Data Hooks (Dexie useLiveQuery)
// ============================================================
// All hooks return reactive data that auto-updates when
// the underlying IndexedDB data changes.

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import { TaskStatus } from './models';
import type { Task, Workstream, Review, WeeklyTemplate, UserConfig, JournalEntry, NotificationLog } from './models';
import { toDateString, getWeekBounds } from '../utils/dates';

// --- Task Hooks ---

/**
 * Returns tasks planned for today (or a specific date).
 * Includes: planned, in_progress, rolled_over statuses.
 */
export function useTodayTasks(date?: string): Task[] | undefined {
  const targetDate = date ?? toDateString();

  return useLiveQuery(async () => {
    const tasks = await db.tasks
      .where('plannedFor')
      .equals(targetDate)
      .toArray();

    // Filter to active statuses (not done, not deferred, not backlog)
    const activeTasks = tasks.filter(
      (t) =>
        t.status === TaskStatus.PLANNED ||
        t.status === TaskStatus.IN_PROGRESS ||
        t.status === TaskStatus.ROLLED_OVER ||
        t.status === TaskStatus.DONE
    );

    return activeTasks.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [targetDate]);
}

/**
 * Returns all tasks for a given week (Mon–Sun).
 */
export function useWeekTasks(weekStartDate?: string): Task[] | undefined {
  const { start, end } = getWeekBounds(
    weekStartDate ? new Date(weekStartDate + 'T00:00:00') : undefined
  );

  return useLiveQuery(async () => {
    const tasks = await db.tasks
      .where('plannedFor')
      .between(start, end, true, true)
      .toArray();

    return tasks.sort((a, b) => {
      // Sort by plannedFor date first, then sortOrder
      if (a.plannedFor !== b.plannedFor) {
        return (a.plannedFor ?? '').localeCompare(b.plannedFor ?? '');
      }
      return a.sortOrder - b.sortOrder;
    });
  }, [start, end]);
}

/**
 * Returns backlog tasks with optional filtering.
 */
export function useBacklogTasks(filters?: {
  workstreamId?: string;
  search?: string;
}): Task[] | undefined {
  const workstreamId = filters?.workstreamId;
  const search = filters?.search?.toLowerCase();

  return useLiveQuery(async () => {
    let tasks: Task[];

    if (workstreamId) {
      tasks = await db.tasks
        .where('[status+workstreamId]')
        .equals([TaskStatus.BACKLOG, workstreamId])
        .toArray();
    } else {
      tasks = await db.tasks
        .where('status')
        .equals(TaskStatus.BACKLOG)
        .toArray();
    }

    // Apply text search filter
    if (search) {
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.notes.toLowerCase().includes(search)
      );
    }

    return tasks.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [workstreamId, search]);
}

/**
 * Returns tasks filtered by a specific status.
 */
export function useTasksByStatus(
  status: TaskStatus
): Task[] | undefined {
  return useLiveQuery(
    () =>
      db.tasks
        .where('status')
        .equals(status)
        .sortBy('sortOrder'),
    [status]
  );
}

/**
 * Returns task count aggregates for a given date (for progress display).
 */
export function useTaskCounts(
  date?: string
): { total: number; done: number; inProgress: number; planned: number; rolledOver: number } | undefined {
  const targetDate = date ?? toDateString();

  return useLiveQuery(async () => {
    const tasks = await db.tasks
      .where('plannedFor')
      .equals(targetDate)
      .toArray();

    // Only count active tasks (exclude backlog/deferred for progress)
    const activeTasks = tasks.filter(
      (t) =>
        t.status === TaskStatus.PLANNED ||
        t.status === TaskStatus.IN_PROGRESS ||
        t.status === TaskStatus.ROLLED_OVER ||
        t.status === TaskStatus.DONE
    );

    return {
      total: activeTasks.length,
      done: activeTasks.filter((t) => t.status === TaskStatus.DONE).length,
      inProgress: activeTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      planned: activeTasks.filter((t) => t.status === TaskStatus.PLANNED).length,
      rolledOver: activeTasks.filter((t) => t.status === TaskStatus.ROLLED_OVER).length,
    };
  }, [targetDate]);
}

// --- Workstream Hooks ---

/**
 * Returns all workstreams, optionally filtered to active only.
 * Ordered by sortOrder.
 */
export function useWorkstreams(activeOnly?: boolean): Workstream[] | undefined {
  return useLiveQuery(async () => {
    let query = db.workstreams.orderBy('sortOrder');
    const workstreams = await query.toArray();

    if (activeOnly) {
      return workstreams.filter((ws) => ws.active);
    }
    return workstreams;
  }, [activeOnly]);
}

// --- Review Hooks ---

/**
 * Returns all reviews ordered by weekStart descending (newest first).
 */
export function useReviews(): Review[] | undefined {
  return useLiveQuery(async () => {
    const reviews = await db.reviews.orderBy('weekStart').reverse().toArray();
    return reviews;
  });
}

/**
 * Returns the review for a specific week, if it exists.
 */
export function useWeekReview(weekStart: string): Review | undefined {
  return useLiveQuery(
    () => db.reviews.where('weekStart').equals(weekStart).first(),
    [weekStart]
  );
}

// --- Template Hooks ---

/**
 * Returns all weekly templates ordered by sortOrder.
 */
export function useWeeklyTemplates(): WeeklyTemplate[] | undefined {
  return useLiveQuery(() =>
    db.weeklyTemplates.orderBy('sortOrder').toArray()
  );
}

// --- User Config Hooks ---

/**
 * Returns the user's challenge configuration.
 */
export function useUserConfig(): UserConfig | undefined {
  return useLiveQuery(() => db.userConfig.get('default'));
}

// --- Progress / Vault Hooks ---

/**
 * Aggregate completion stats across the entire challenge period.
 */
export function useProgressStats(startDate?: string, weeks?: number) {
  return useLiveQuery(async () => {
    const config = await db.userConfig.get('default');
    const challengeStart = startDate || config?.challengeStartDate || toDateString();
    const challengeWeeks = weeks || config?.challengeWeeks || 7;

    const startD = new Date(challengeStart + 'T00:00:00');
    const endD = new Date(startD);
    endD.setDate(endD.getDate() + challengeWeeks * 7 - 1);
    const endStr = toDateString(endD);

    const allTasks = await db.tasks.toArray();
    const challengeTasks = allTasks.filter(
      (t) => t.plannedFor !== null && t.plannedFor >= challengeStart && t.plannedFor <= endStr
    );

    const total = challengeTasks.length;
    const done = challengeTasks.filter((t) => t.status === TaskStatus.DONE).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Current week number (1-indexed)
    const now = new Date();
    const diffMs = now.getTime() - startD.getTime();
    const currentWeek = Math.min(
      Math.max(Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)), 1),
      challengeWeeks
    );

    return {
      total,
      done,
      completionRate,
      challengeStart: challengeStart,
      challengeWeeks,
      currentWeek,
    };
  }, [startDate, weeks]);
}

/**
 * Per-week completion percentages for the heatmap grid.
 */
export function useWeeklyHeatmap(startDate?: string, weeks?: number) {
  return useLiveQuery(async () => {
    const config = await db.userConfig.get('default');
    const challengeStart = startDate || config?.challengeStartDate || toDateString();
    const challengeWeeks = weeks || config?.challengeWeeks || 7;

    const allTasks = await db.tasks.toArray();
    const heatmap: { weekNum: number; start: string; end: string; total: number; done: number; percent: number }[] = [];

    for (let w = 0; w < challengeWeeks; w++) {
      const wStart = new Date(challengeStart + 'T00:00:00');
      wStart.setDate(wStart.getDate() + w * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      const wStartStr = toDateString(wStart);
      const wEndStr = toDateString(wEnd);

      const weekTasks = allTasks.filter(
        (t) => t.plannedFor !== null && t.plannedFor >= wStartStr && t.plannedFor <= wEndStr
      );

      const total = weekTasks.length;
      const done = weekTasks.filter((t) => t.status === TaskStatus.DONE).length;

      heatmap.push({
        weekNum: w + 1,
        start: wStartStr,
        end: wEndStr,
        total,
        done,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
      });
    }

    return heatmap;
  }, [startDate, weeks]);
}

/**
 * Task counts grouped by workstream for the breakdown chart.
 */
export function useWorkstreamBreakdown(startDate?: string, weeks?: number) {
  return useLiveQuery(async () => {
    const config = await db.userConfig.get('default');
    const challengeStart = startDate || config?.challengeStartDate || toDateString();
    const challengeWeeks = weeks || config?.challengeWeeks || 7;

    const startD = new Date(challengeStart + 'T00:00:00');
    const endD = new Date(startD);
    endD.setDate(endD.getDate() + challengeWeeks * 7 - 1);
    const endStr = toDateString(endD);

    const allTasks = await db.tasks.toArray();
    const challengeTasks = allTasks.filter(
      (t) => t.plannedFor !== null && t.plannedFor >= challengeStart && t.plannedFor <= endStr
    );

    const workstreams = await db.workstreams.toArray();
    const breakdown = workstreams.map((ws) => {
      const wsTasks = challengeTasks.filter((t) => t.workstreamId === ws.id);
      const done = wsTasks.filter((t) => t.status === TaskStatus.DONE).length;
      return {
        id: ws.id,
        name: ws.name,
        color: ws.color,
        total: wsTasks.length,
        done,
        percent: wsTasks.length > 0 ? Math.round((done / wsTasks.length) * 100) : 0,
      };
    }).filter((b) => b.total > 0);

    return breakdown;
  }, [startDate, weeks]);
}

/**
 * Consecutive days with ≥1 completed task (looking back from today).
 */
export function useStreakCount() {
  return useLiveQuery(async () => {
    const allTasks = await db.tasks.toArray();
    const doneTasks = allTasks.filter((t) => t.status === TaskStatus.DONE && t.plannedFor);

    // Build a set of dates that have at least one completed task
    const datesWithDone = new Set<string>();
    for (const t of doneTasks) {
      if (t.plannedFor) datesWithDone.add(t.plannedFor);
    }

    // Walk backwards from today
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = toDateString(d);
      if (datesWithDone.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        // If it's today and no tasks done yet, skip today and check yesterday
        if (i === 0) {
          d.setDate(d.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return streak;
  });
}

/**
 * Average number of completed tasks per day across the challenge.
 */
export function useAvgDailyTasks(startDate?: string) {
  return useLiveQuery(async () => {
    const config = await db.userConfig.get('default');
    const challengeStart = startDate || config?.challengeStartDate || toDateString();

    const startD = new Date(challengeStart + 'T00:00:00');
    const now = new Date();
    const daysPassed = Math.max(1, Math.ceil((now.getTime() - startD.getTime()) / (24 * 60 * 60 * 1000)));

    const allTasks = await db.tasks.toArray();
    const doneTasks = allTasks.filter(
      (t) => t.status === TaskStatus.DONE && t.plannedFor && t.plannedFor >= challengeStart
    );

    return {
      avgPerDay: Number((doneTasks.length / daysPassed).toFixed(1)),
      totalCompleted: doneTasks.length,
      daysPassed,
    };
  }, [startDate]);
}

// --- Journal Hooks ---

/**
 * Returns the journal entry for a specific date, if it exists.
 */
export function useJournalEntry(date: string): JournalEntry | undefined {
  return useLiveQuery(
    () => db.journalEntries.where('date').equals(date).first(),
    [date]
  );
}

/**
 * Returns the N most recent journal entries.
 */
export function useRecentJournals(limit = 10): JournalEntry[] | undefined {
  return useLiveQuery(
    () => db.journalEntries.orderBy('createdAt').reverse().limit(limit).toArray(),
    [limit]
  );
}

// --- Notification Log Hooks ---

/**
 * Returns count of unread notification logs.
 */
export function useUnreadNotificationCount(): number | undefined {
  return useLiveQuery(async () => {
    const logs = await db.notificationLogs.toArray();
    return logs.filter((l) => l.readAt === null).length;
  });
}

/**
 * Returns recent notification logs, newest first.
 */
export function useNotificationLogs(limit = 50): NotificationLog[] | undefined {
  return useLiveQuery(
    () => db.notificationLogs.orderBy('firedAt').reverse().limit(limit).toArray(),
    [limit]
  );
}

