// ============================================================
// Tracker — Default Workstream Seeding
// ============================================================
// Called on app startup. Idempotent — only seeds if the
// workstreams table is empty.

import { db } from './database';
import type { Workstream } from './models';

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
 * Seeds the default workstreams on first launch.
 * Idempotent: checks if workstreams table is empty before inserting.
 */
export async function seedDefaults(): Promise<void> {
  const count = await db.workstreams.count();
  if (count > 0) return; // Already seeded

  const now = Date.now();
  const workstreams: Workstream[] = DEFAULT_WORKSTREAMS.map((ws) => ({
    ...ws,
    id: crypto.randomUUID(),
    createdAt: now,
  }));

  await db.workstreams.bulkAdd(workstreams);
  console.log(`[Tracker] Seeded ${workstreams.length} default workstreams`);
}
