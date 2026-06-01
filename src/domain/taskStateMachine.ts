// ============================================================
// Tracker — Task State Machine
// ============================================================
// Pure functions with no side effects. Validates status transitions
// and returns the partial update to apply.

import { TaskStatus } from '../db/models';
import type { Task } from '../db/models';

// --- Transition Map ---

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.BACKLOG]: [TaskStatus.PLANNED, TaskStatus.DEFERRED],
  [TaskStatus.PLANNED]: [
    TaskStatus.IN_PROGRESS,
    TaskStatus.DONE,
    TaskStatus.DEFERRED,
    TaskStatus.BACKLOG,
  ],
  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.DONE,
    TaskStatus.DEFERRED,
    TaskStatus.PLANNED,
  ],
  [TaskStatus.DONE]: [TaskStatus.PLANNED], // re-open
  [TaskStatus.DEFERRED]: [TaskStatus.PLANNED, TaskStatus.BACKLOG],
  [TaskStatus.ROLLED_OVER]: [
    TaskStatus.PLANNED,
    TaskStatus.DEFERRED,
    TaskStatus.BACKLOG,
    TaskStatus.DONE,
  ],
};

// --- Error Class ---

export class InvalidTransitionError extends Error {
  constructor(from: TaskStatus, to: TaskStatus) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

// --- Validation Functions ---

/**
 * Check if a transition from one status to another is valid.
 */
export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the list of valid statuses a task can transition to.
 */
export function getValidTransitions(from: TaskStatus): TaskStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

/**
 * Validate a transition and throw if invalid.
 */
function validateTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

// --- Transition Functions ---
// Each returns a Partial<Task> with the fields to update.

/**
 * Mark a task as done.
 */
export function completeTask(task: Task): Partial<Task> {
  validateTransition(task.status, TaskStatus.DONE);
  return {
    status: TaskStatus.DONE,
    completedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Defer a task (push to later).
 */
export function deferTask(task: Task): Partial<Task> {
  validateTransition(task.status, TaskStatus.DEFERRED);
  return {
    status: TaskStatus.DEFERRED,
    updatedAt: Date.now(),
  };
}

/**
 * Plan a task for a specific date.
 */
export function planTask(task: Task, date: string): Partial<Task> {
  validateTransition(task.status, TaskStatus.PLANNED);
  return {
    status: TaskStatus.PLANNED,
    plannedFor: date,
    updatedAt: Date.now(),
  };
}

/**
 * Start working on a task.
 */
export function startTask(task: Task): Partial<Task> {
  validateTransition(task.status, TaskStatus.IN_PROGRESS);
  return {
    status: TaskStatus.IN_PROGRESS,
    updatedAt: Date.now(),
  };
}

/**
 * Roll a task over to a new date (typically the next day).
 * Increments the rollover count.
 */
export function rolloverTask(task: Task, newDate: string): Partial<Task> {
  // Rollover can happen from planned, in_progress — these are tasks
  // that weren't completed by their planned date. We set them to ROLLED_OVER.
  // Note: we don't validate transition here because rollover is a system action
  // that can apply to planned/in_progress tasks directly.
  return {
    status: TaskStatus.ROLLED_OVER,
    plannedFor: newDate,
    rolloverCount: task.rolloverCount + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Move a task back to the backlog.
 */
export function sendToBacklog(task: Task): Partial<Task> {
  validateTransition(task.status, TaskStatus.BACKLOG);
  return {
    status: TaskStatus.BACKLOG,
    plannedFor: null,
    updatedAt: Date.now(),
  };
}
