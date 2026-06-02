// ============================================================
// Tracker — Default Seeding (Workstreams, Notifications, Templates, Vault)
// ============================================================
// Called on app startup. Idempotent — seeds each table independently
// if it is empty to ensure a pre-populated experience on first launch.

import { db } from './database';
import { TaskStatus, TaskSource, TaskPriority } from './models';
import type { Workstream, WeeklyTemplate, Task } from './models';

const DEFAULT_WORKSTREAMS: Omit<Workstream, 'id' | 'createdAt'>[] = [
  {
    name: 'Work',
    color: '#3B82F6',
    icon: 'briefcase',
    active: true,
    isDefault: true,
    sortOrder: 0,
  },
  {
    name: 'DSA',
    color: '#10B981',
    icon: 'code',
    active: true,
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: 'Study',
    color: '#8B5CF6',
    icon: 'book-open',
    active: true,
    isDefault: true,
    sortOrder: 2,
  },
  {
    name: 'Personal',
    color: '#F97316',
    icon: 'user',
    active: true,
    isDefault: true,
    sortOrder: 3,
  },
];

/**
 * Seeds all default configurations and initial tasks on launch.
 * Independent and idempotent for each table.
 */
export async function seedDefaults(): Promise<void> {
  const now = Date.now();
  let workstreams: Workstream[] = [];

  // 1. Seed default workstreams
  const wsCount = await db.workstreams.count();
  if (wsCount === 0) {
    workstreams = DEFAULT_WORKSTREAMS.map((ws) => ({
      ...ws,
      id: crypto.randomUUID(),
      createdAt: now,
    }));
    await db.workstreams.bulkAdd(workstreams);
    console.log(`[Tracker] Seeded ${workstreams.length} default workstreams`);
  } else {
    workstreams = await db.workstreams.toArray();
  }

  // 2. Seed default notification configs
  const notifCount = await db.notifications.count();
  if (notifCount === 0) {
    const defaultNotifications = [
      {
        id: crypto.randomUUID(),
        kind: 'standup' as const,
        schedule: '08:00',
        message: 'Confront your targets! Open your Standup Gate now.',
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        kind: 'end_of_day' as const,
        schedule: '18:00',
        message: 'EOD Reflection: Record your wins and review carryovers.',
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        kind: 'weekly_review' as const,
        schedule: 'Sunday 19:00',
        message: 'Reflection Loop: Time to complete your Guided Weekly Review!',
        enabled: true,
      },
    ];
    await db.notifications.bulkAdd(defaultNotifications);
    console.log('[Tracker] Seeded default notification configurations');
  }

  // 3. Seed default weekly templates (for pre-populated weekly/daily schedule)
  const tplCount = await db.weeklyTemplates.count();
  if (tplCount === 0) {
    const workWs = workstreams.find((w) => w.name === 'Work')?.id || '';
    const dsaWs = workstreams.find((w) => w.name === 'DSA')?.id || '';
    const studyWs = workstreams.find((w) => w.name === 'Study')?.id || '';
    const personalWs = workstreams.find((w) => w.name === 'Personal')?.id || '';

    const defaultTemplates: WeeklyTemplate[] = [
      {
        id: crypto.randomUUID(),
        title: 'Morning Standup & Planning',
        notes: 'Review targets, yesterday\'s carryovers, and finalize today\'s schedule.',
        workstreamId: workWs,
        priority: TaskPriority.HIGH,
        daysOfWeek: [],
        daily: true, // Everyday
        estimate: 15,
        tags: ['planning'],
        dsaAutoLink: false,
        active: true,
        sortOrder: 0,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'DSA Practice',
        notes: 'Next uncompleted topic from DSA lecture schedule.',
        workstreamId: dsaWs,
        priority: TaskPriority.HIGH,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        daily: false,
        estimate: 60,
        tags: ['dsa', 'coding'],
        dsaAutoLink: true, // Auto-link enabled!
        active: true,
        sortOrder: 1,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Study Session',
        notes: 'Focused deep work study block.',
        workstreamId: studyWs,
        priority: TaskPriority.MEDIUM,
        daysOfWeek: [2, 4], // Tue, Thu
        daily: false,
        estimate: 90,
        tags: ['study', 'learning'],
        dsaAutoLink: false,
        active: true,
        sortOrder: 2,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Weekly Planning',
        notes: 'Set the theme and major outcomes for the upcoming week.',
        workstreamId: workWs,
        priority: TaskPriority.CRITICAL,
        daysOfWeek: [1], // Mon
        daily: false,
        estimate: 30,
        tags: ['planning', 'strategy'],
        dsaAutoLink: false,
        active: true,
        sortOrder: 3,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Gym / Health Workout',
        notes: 'Exercise session to maintain energy and fitness.',
        workstreamId: personalWs,
        priority: TaskPriority.MEDIUM,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        daily: false,
        estimate: 60,
        tags: ['health', 'fitness'],
        dsaAutoLink: false,
        active: true,
        sortOrder: 4,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Daily Journal & EOD Reflection',
        notes: 'Reflect on today\'s wins, misses, and update schedule for tomorrow.',
        workstreamId: personalWs,
        priority: TaskPriority.LOW,
        daysOfWeek: [],
        daily: true, // Everyday
        estimate: 15,
        tags: ['reflection', 'journal'],
        dsaAutoLink: false,
        active: true,
        sortOrder: 5,
        createdAt: now,
      },
    ];

    const validTemplates = defaultTemplates.filter((t) => t.workstreamId);
    if (validTemplates.length > 0) {
      await db.weeklyTemplates.bulkAdd(validTemplates);
      console.log(`[Tracker] Seeded ${validTemplates.length} default weekly templates`);
    }
  }

  // 4. Seed initial backlog tasks in the Vault
  const taskCount = await db.tasks.count();
  if (taskCount === 0) {
    const workWs = workstreams.find((w) => w.name === 'Work')?.id || '';
    const studyWs = workstreams.find((w) => w.name === 'Study')?.id || '';
    const personalWs = workstreams.find((w) => w.name === 'Personal')?.id || '';

    const defaultBacklogTasks: Task[] = [
      {
        id: crypto.randomUUID(),
        title: 'Setup Offline-First PWA caching strategy',
        notes: 'Configure service worker strategies (stale-while-revalidate for assets, network-first for index.html).',
        status: TaskStatus.BACKLOG,
        workstreamId: workWs,
        priority: TaskPriority.HIGH,
        dueDate: null,
        plannedFor: null, // No planned date (lies in Vault)
        completedAt: null,
        estimate: 120,
        rolloverCount: 0,
        tags: ['engineering', 'vault-demo'],
        source: TaskSource.MANUAL,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Deep dive into standard IndexedDB transaction bounds',
        notes: 'Read Dexie documentation about read/write transaction guarantees and error boundaries.',
        status: TaskStatus.BACKLOG,
        workstreamId: studyWs,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
        plannedFor: null,
        completedAt: null,
        estimate: 60,
        rolloverCount: 0,
        tags: ['learning', 'vault-demo'],
        source: TaskSource.MANUAL,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Research local notification background sync APIs',
        notes: 'Check Safari/Chrome iOS support constraints for background scheduled push reminders.',
        status: TaskStatus.BACKLOG,
        workstreamId: workWs,
        priority: TaskPriority.LOW,
        dueDate: null,
        plannedFor: null,
        completedAt: null,
        estimate: 90,
        rolloverCount: 0,
        tags: ['research', 'vault-demo'],
        source: TaskSource.MANUAL,
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Schedule weekend hiking/nature walk',
        notes: 'Find a nearby trail, pack a hydration pack, and plan 3 hours of outdoor activity.',
        status: TaskStatus.BACKLOG,
        workstreamId: personalWs,
        priority: TaskPriority.LOW,
        dueDate: null,
        plannedFor: null,
        completedAt: null,
        estimate: 180,
        rolloverCount: 0,
        tags: ['health', 'lifestyle', 'vault-demo'],
        source: TaskSource.MANUAL,
        sortOrder: 3,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const validBacklog = defaultBacklogTasks.filter((t) => t.workstreamId);
    if (validBacklog.length > 0) {
      await db.tasks.bulkAdd(validBacklog);
      console.log(`[Tracker] Seeded ${validBacklog.length} default backlog tasks into the Vault`);
    }
  }
}
