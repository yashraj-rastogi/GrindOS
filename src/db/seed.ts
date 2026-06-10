// ============================================================
// GrindOS — Default Seeding (Workstreams, Notifications, Templates, Config)
// ============================================================
// Called on app startup. Idempotent — seeds each table independently
// if it is empty to ensure a pre-populated experience on first launch.

import { db } from './database';
import { TaskPriority } from './models';
import type { Workstream, WeeklyTemplate, UserConfig } from './models';
import { toDateString } from '../utils/dates';

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
    name: 'Study',
    color: '#8B5CF6',
    icon: 'book-open',
    active: true,
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: 'Personal',
    color: '#F97316',
    icon: 'user',
    active: true,
    isDefault: true,
    sortOrder: 2,
  },
];

/**
 * Seeds all default configurations on launch.
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
    console.log(`[GrindOS] Seeded ${workstreams.length} default workstreams`);
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
    console.log('[GrindOS] Seeded default notification configurations');
  }

  // 3. Seed default weekly templates (for pre-populated weekly/daily schedule)
  const tplCount = await db.weeklyTemplates.count();
  if (tplCount === 0) {
    const workWs = workstreams.find((w) => w.name === 'Work')?.id || '';
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
        daily: true,
        estimate: 15,
        tags: ['planning'],
        dsaAutoLink: false,
        active: true,
        sortOrder: 0,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        title: 'Skills Practice',
        notes: 'Dedicated time to practice and refine key skills.',
        workstreamId: studyWs,
        priority: TaskPriority.HIGH,
        daysOfWeek: [1, 3, 5],
        daily: false,
        estimate: 60,
        tags: ['practice', 'skills'],
        dsaAutoLink: false,
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
        daysOfWeek: [2, 4],
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
        daysOfWeek: [1],
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
        daysOfWeek: [1, 3, 5],
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
        daily: true,
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
      console.log(`[GrindOS] Seeded ${validTemplates.length} default weekly templates`);
    }
  }

  // 4. Seed user config (challenge settings)
  const configCount = await db.userConfig.count();
  if (configCount === 0) {
    const config: UserConfig = {
      id: 'default',
      challengeStartDate: toDateString(), // Start from today
      challengeWeeks: 7,                  // Default 7-week challenge
      goalDescription: 'My 7-Week Growth Challenge',
      goalCategory: 'Custom',
      onboardingCompleted: false, // Must go through onboarding
      createdAt: now,
      updatedAt: now,
    };
    await db.userConfig.add(config);
    console.log('[GrindOS] Seeded default user config (7-week challenge)');
  } else {
    // Migrate existing configs to set onboardingCompleted = true so existing users bypass wizard
    const existingConfig = await db.userConfig.get('default');
    if (existingConfig && existingConfig.onboardingCompleted === undefined) {
      await db.userConfig.update('default', {
        goalCategory: 'Custom',
        onboardingCompleted: true,
      });
      console.log('[GrindOS] Migrated existing user config to bypass onboarding');
    }
  }
}
