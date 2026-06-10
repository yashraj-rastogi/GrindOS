// ============================================================
// Tracker — Weekly Template Auto-Generation Engine
// ============================================================
// Runs on app startup. Generates tasks for the full week
// (Mon–Sun) from active templates when a new week begins.

import { db } from '../db/database';
import { TaskStatus, TaskSource } from '../db/models';
import type { Task } from '../db/models';
import { getWeekBounds, toDateString } from '../utils/dates';
import { DSA_PHASES } from '../data/dsaLectures';
import type { LecturePhase } from '../data/dsaLectures';

const TEMPLATE_WEEK_KEY = 'tracker_last_template_week';

/**
 * Check if template tasks need to be generated for the current week,
 * and generate them if so.
 */
export async function checkAndApplyTemplates(force = false): Promise<void> {
  const { start, end } = getWeekBounds(); // Monday of current week
  const lastGenerated = localStorage.getItem(TEMPLATE_WEEK_KEY);

  try {
    // Fetch all active templates
    const templates = await db.weeklyTemplates
      .where('active')
      .equals(1) // Dexie stores booleans as 0/1
      .toArray();

    // Fallback: if the index-based query returns nothing, try filtering manually
    // (Dexie boolean indexing can be inconsistent)
    let activeTemplates = templates;
    if (activeTemplates.length === 0) {
      const allTemplates = await db.weeklyTemplates.toArray();
      activeTemplates = allTemplates.filter((t) => t.active);
    }

    // Count existing template-sourced tasks for this week
    const existingTemplateTasksCount = await db.tasks
      .where('plannedFor')
      .between(start, end, true, true)
      .filter((t) => t.source === TaskSource.TEMPLATE)
      .count();

    // Bypass early return if active templates exist but no tasks have been generated yet
    const hasTemplatesButNoTasks = activeTemplates.length > 0 && existingTemplateTasksCount === 0;

    // Already generated for this week
    if (lastGenerated === start && !force && !hasTemplatesButNoTasks) return;

    if (activeTemplates.length === 0) {
      // No templates defined yet — mark as generated to avoid re-checking
      localStorage.setItem(TEMPLATE_WEEK_KEY, start);
      console.log('[Templates] No active templates found. Skipping generation.');
      return;
    }

    // Get existing template-sourced tasks for this week (idempotency guard)
    const existingTasks = await db.tasks
      .where('plannedFor')
      .between(start, getWeekBounds().end, true, true)
      .toArray();

    const existingTemplateKeys = new Set(
      existingTasks
        .filter((t) => t.source === TaskSource.TEMPLATE)
        .map((t) => `${t.title}::${t.plannedFor}`)
    );

    // Load config to determine goal category prefix
    const config = await db.userConfig.get('default');
    const categoryPrefix = config?.goalCategory || 'DSA';

    // Resolve DSA next uncompleted lecture (shared across all DSA-linked templates)
    const nextDsaTitle = await resolveNextDsaLecture();

    // Generate tasks
    const weekDates = getWeekDateMap(start);
    const tasksToCreate: Task[] = [];
    let sortBase = await getMaxSortOrder();

    for (const template of activeTemplates) {
      // Determine which days this template should generate for
      const targetDays = template.daily
        ? [1, 2, 3, 4, 5, 6, 7] // Every day (Mon=1 through Sun=7)
        : template.daysOfWeek;

      if (targetDays.length === 0) continue;

      for (const dayNum of targetDays) {
        const dateStr = weekDates.get(dayNum);
        if (!dateStr) continue;

        // Resolve title (DSA auto-link or static)
        const title = template.dsaAutoLink && nextDsaTitle
          ? `${categoryPrefix}: ${nextDsaTitle}`
          : template.title;

        // Skip if this exact task already exists (idempotency)
        const key = `${title}::${dateStr}`;
        if (existingTemplateKeys.has(key)) continue;

        sortBase++;
        const now = Date.now();

        tasksToCreate.push({
          id: crypto.randomUUID(),
          title,
          notes: template.notes,
          status: TaskStatus.PLANNED,
          workstreamId: template.workstreamId,
          priority: template.priority,
          dueDate: null,
          plannedFor: dateStr,
          completedAt: null,
          estimate: template.estimate,
          rolloverCount: 0,
          tags: [...template.tags, 'auto-scheduled'],
          source: TaskSource.TEMPLATE,
          sortOrder: sortBase,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Bulk insert all generated tasks
    if (tasksToCreate.length > 0) {
      await db.tasks.bulkAdd(tasksToCreate);
      console.log(
        `[Templates] Generated ${tasksToCreate.length} tasks from ${activeTemplates.length} templates for week of ${start}`
      );
    } else {
      console.log('[Templates] All template tasks already exist for this week. No duplicates created.');
    }

    // Mark this week as generated
    localStorage.setItem(TEMPLATE_WEEK_KEY, start);

    // Dispatch event so UI components know to refresh
    window.dispatchEvent(new Event('tracker_templates_applied'));
  } catch (err) {
    console.error('[Templates] Failed to generate template tasks:', err);
  }
}

/**
 * Resolve the next uncompleted DSA lecture title.
 * Returns null if all lectures are completed.
 */
async function resolveNextDsaLecture(): Promise<string | null> {
  try {
    // 1. Get user configuration
    const config = await db.userConfig.get('default');

    // 2. Select phases (custom uploaded or fallback to default DSA)
    let phases: LecturePhase[] = DSA_PHASES;
    if (config?.customChecklistJson && config.customChecklistJson !== 'skip') {
      try {
        phases = JSON.parse(config.customChecklistJson) as LecturePhase[];
      } catch (e) {
        console.error('[Templates] Failed to parse custom checklist JSON:', e);
      }
    }

    // 3. Find the first uncompleted topic
    const completedRows = await db.dsaProgress.toArray();
    const completedIds = new Set(completedRows.map((r) => r.lectureId));

    for (const phase of phases) {
      for (const item of phase.items) {
        if (!completedIds.has(item.id)) {
          return item.title;
        }
      }
    }

    return null; // All completed
  } catch (err) {
    console.error('[Templates] Failed to resolve next checklist item:', err);
    return null;
  }
}

/**
 * Build a map of ISO weekday number (1=Mon, 7=Sun) to YYYY-MM-DD date strings
 * for the week starting at the given Monday.
 */
function getWeekDateMap(mondayStr: string): Map<number, string> {
  const map = new Map<number, string>();
  const monday = new Date(mondayStr + 'T00:00:00');

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    // ISO weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
    const isoDay = i + 1;
    map.set(isoDay, toDateString(d));
  }

  return map;
}

/**
 * Get the current max sortOrder across all tasks.
 */
async function getMaxSortOrder(): Promise<number> {
  const lastTask = await db.tasks.orderBy('sortOrder').last();
  return lastTask?.sortOrder ?? -1;
}

/**
 * Initialize the template engine on app startup.
 */
export async function initializeTemplateEngine(): Promise<void> {
  await checkAndApplyTemplates();
}
