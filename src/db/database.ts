// ============================================================
// Tracker — Dexie Database Definition
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { Task, Review, Workstream, NotificationConfig } from './models';

export interface DSAProgress {
  lectureId: number;
  completedAt: number;
}

export class TrackerDB extends Dexie {
  tasks!: Table<Task, string>;
  reviews!: Table<Review, string>;
  workstreams!: Table<Workstream, string>;
  notifications!: Table<NotificationConfig, string>;
  dsaProgress!: Table<DSAProgress, number>;

  constructor() {
    super('TrackerDB');

    this.version(1).stores({
      tasks: [
        'id',
        'status',
        'workstreamId',
        'plannedFor',
        'dueDate',
        'priority',
        'sortOrder',
        'createdAt',
        '[status+plannedFor]',
        '[status+workstreamId]',
      ].join(', '),

      reviews: [
        'id',
        'weekStart',
        'weekEnd',
        'completedAt',
      ].join(', '),

      workstreams: [
        'id',
        'name',
        'active',
        'sortOrder',
      ].join(', '),

      notifications: [
        'id',
        'kind',
        'enabled',
      ].join(', '),

      dsaProgress: 'lectureId, completedAt',
    });
  }
}

// Singleton database instance
export const db = new TrackerDB();
