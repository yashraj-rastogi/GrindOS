// ============================================================
// Tracker — Imperative CRUD Operations
// ============================================================
// Used in event handlers and callbacks. Not hooks.

import { db } from './database';
import { TaskStatus, TaskSource, TaskPriority } from './models';
import type { Task, Review, Workstream, TaskUpdate } from './models';
import { canTransition, InvalidTransitionError, rolloverTask } from '../domain/taskStateMachine';


// --- Task Operations ---

/**
 * Create a new task with auto-generated id and timestamps.
 * Returns the new task ID.
 */
export async function addTask(data: {
  title: string;
  notes?: string;
  status?: TaskStatus;
  workstreamId: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  plannedFor?: string | null;
  estimate?: number | null;
  tags?: string[];
  source?: TaskSource;
}): Promise<string> {
  const now = Date.now();

  // Get the highest sortOrder for the target scope
  const maxSort = await db.tasks
    .orderBy('sortOrder')
    .last()
    .then((t) => t?.sortOrder ?? -1);

  const task: Task = {
    id: crypto.randomUUID(),
    title: data.title,
    notes: data.notes ?? '',
    status: data.status ?? TaskStatus.BACKLOG,
    workstreamId: data.workstreamId,
    priority: data.priority ?? TaskPriority.NONE,
    dueDate: data.dueDate ?? null,
    plannedFor: data.plannedFor ?? null,
    completedAt: null,
    estimate: data.estimate ?? null,
    rolloverCount: 0,
    tags: data.tags ?? [],
    source: data.source ?? TaskSource.MANUAL,
    sortOrder: maxSort + 1,
    createdAt: now,
    updatedAt: now,
  };

  await db.tasks.add(task);
  return task.id;
}

/**
 * Partially update a task. Automatically sets updatedAt.
 */
export async function updateTask(
  id: string,
  changes: TaskUpdate
): Promise<void> {
  await db.tasks.update(id, {
    ...changes,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a task by ID.
 */
export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

/**
 * Transition a task to a new status with validation.
 * Optionally merge extra field updates.
 */
export async function transitionTask(
  id: string,
  newStatus: TaskStatus,
  extra?: Partial<Task>
): Promise<void> {
  const task = await db.tasks.get(id);
  if (!task) throw new Error(`Task not found: ${id}`);

  if (!canTransition(task.status, newStatus)) {
    throw new InvalidTransitionError(task.status, newStatus);
  }

  const updates: Partial<Task> = {
    status: newStatus,
    updatedAt: Date.now(),
    ...extra,
  };

  // Auto-set completedAt when marking done
  if (newStatus === TaskStatus.DONE && !updates.completedAt) {
    updates.completedAt = Date.now();
  }

  // Clear completedAt when re-opening
  if (newStatus !== TaskStatus.DONE) {
    updates.completedAt = null;
  }

  await db.tasks.update(id, updates);
}

/**
 * Batch update sort order from an ordered array of task IDs.
 */
export async function reorderTasks(taskIds: string[]): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    for (let i = 0; i < taskIds.length; i++) {
      await db.tasks.update(taskIds[i], {
        sortOrder: i,
        updatedAt: Date.now(),
      });
    }
  });
}

// --- Workstream Operations ---

/**
 * Create a custom workstream. Returns the new ID.
 */
export async function addWorkstream(data: {
  name: string;
  color: string;
  icon?: string | null;
}): Promise<string> {
  const maxSort = await db.workstreams
    .orderBy('sortOrder')
    .last()
    .then((ws) => ws?.sortOrder ?? -1);

  const workstream: Workstream = {
    id: crypto.randomUUID(),
    name: data.name,
    color: data.color,
    icon: data.icon ?? null,
    active: true,
    isDefault: false,
    sortOrder: maxSort + 1,
    createdAt: Date.now(),
  };

  await db.workstreams.add(workstream);
  return workstream.id;
}

/**
 * Update a workstream's name, color, icon, or active status.
 */
export async function updateWorkstream(
  id: string,
  changes: Partial<Pick<Workstream, 'name' | 'color' | 'icon' | 'active'>>
): Promise<void> {
  await db.workstreams.update(id, changes);
}

/**
 * Delete a custom workstream. Throws if it's a default workstream.
 */
export async function deleteWorkstream(id: string): Promise<void> {
  const ws = await db.workstreams.get(id);
  if (!ws) throw new Error(`Workstream not found: ${id}`);
  if (ws.isDefault) {
    throw new Error('Cannot delete a default workstream');
  }
  await db.workstreams.delete(id);
}

// --- Review Operations ---

/**
 * Create a new review. Returns the new ID.
 */
export async function addReview(data: {
  weekStart: string;
  weekEnd: string;
  summary?: string;
  wins?: string[];
  misses?: string[];
  debtItems?: string[];
  nextWeekFocus?: string;
  completedAt?: number | null;
}): Promise<string> {
  const review: Review = {
    id: crypto.randomUUID(),
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    summary: data.summary ?? '',
    wins: data.wins ?? [],
    misses: data.misses ?? [],
    debtItems: data.debtItems ?? [],
    nextWeekFocus: data.nextWeekFocus ?? '',
    completedAt: data.completedAt ?? null,
    createdAt: Date.now(),
  };

  await db.reviews.add(review);
  return review.id;
}

/**
 * Update a review.
 */
export async function updateReview(
  id: string,
  changes: Partial<Omit<Review, 'id' | 'createdAt'>>
): Promise<void> {
  await db.reviews.update(id, changes);
}

/**
 * Automatically roll over a set of tasks to a target date.
 * Increments rollover counts and updates statuses to ROLLED_OVER.
 */
export async function rolloverTasks(
  taskIds: string[],
  targetDate: string
): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    for (const id of taskIds) {
      const task = await db.tasks.get(id);
      if (task) {
        const updates = rolloverTask(task, targetDate);
        await db.tasks.update(id, {
          ...updates,
          updatedAt: Date.now(),
        });
      }
    }
  });
}

