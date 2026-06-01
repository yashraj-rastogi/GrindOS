// ============================================================
// Tracker — Reactive Data Hooks (Dexie useLiveQuery)
// ============================================================
// All hooks return reactive data that auto-updates when
// the underlying IndexedDB data changes.

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import { TaskStatus } from './models';
import type { Task, Workstream, Review } from './models';
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
