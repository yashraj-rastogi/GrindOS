// ============================================================
// GrindOS — Dexie Database Definition
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { Task, Review, Workstream, NotificationConfig, WeeklyTemplate, UserConfig, JournalEntry, NotificationLog } from './models';

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
  weeklyTemplates!: Table<WeeklyTemplate, string>;
  userConfig!: Table<UserConfig, string>;
  journalEntries!: Table<JournalEntry, string>;
  notificationLogs!: Table<NotificationLog, string>;

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

    // v2: Add weekly templates table for auto-schedule system
    this.version(2).stores({
      weeklyTemplates: 'id, workstreamId, active, sortOrder',
    });

    // v3: Add user config, journal entries, and notification logs
    this.version(3).stores({
      userConfig: 'id',
      journalEntries: 'id, date, mood, createdAt',
      notificationLogs: 'id, kind, firedAt, readAt',
    });
  }
}

// Singleton database instance
export const db = new TrackerDB();

