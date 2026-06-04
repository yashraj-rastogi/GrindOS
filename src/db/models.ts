// ============================================================
// Tracker — Data Models & Type Definitions
// ============================================================
// Uses const objects + union types instead of enums for
// TypeScript 6 erasableSyntaxOnly compatibility.

// --- Status, Source, Priority Constants ---

export const TaskStatus = {
  BACKLOG: 'backlog',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  DEFERRED: 'deferred',
  ROLLED_OVER: 'rolled_over',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskSource = {
  MANUAL: 'manual',
  REVIEW: 'review',
  ROLLOVER: 'rollover',
  TEMPLATE: 'template',
} as const;

export type TaskSource = (typeof TaskSource)[keyof typeof TaskSource];

export const TaskPriority = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

// --- Interfaces ---

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  workstreamId: string;
  priority: TaskPriority;
  dueDate: string | null;
  plannedFor: string | null;
  completedAt: number | null;
  estimate: number | null;
  rolloverCount: number;
  tags: string[];
  source: TaskSource;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Review {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  wins: string[];
  misses: string[];
  debtItems: string[];
  nextWeekFocus: string;
  completedAt: number | null;
  createdAt: number;
}

export interface Workstream {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  active: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: number;
}

export type NotificationKind = 'standup' | 'end_of_day' | 'weekly_review' | 'rollover';

export interface NotificationConfig {
  id: string;
  kind: NotificationKind;
  schedule: string;
  message: string;
  enabled: boolean;
}

export interface WeeklyTemplate {
  id: string;
  title: string;
  notes: string;
  workstreamId: string;
  priority: TaskPriority;
  daysOfWeek: number[];    // 1=Monday, 2=Tuesday, ..., 7=Sunday (ISO weekday)
  daily: boolean;          // If true, generates for every day (overrides daysOfWeek)
  estimate: number | null; // minutes
  tags: string[];
  dsaAutoLink: boolean;    // If true, auto-picks next uncompleted DSA lecture as title
  active: boolean;         // toggle on/off without deleting
  sortOrder: number;
  createdAt: number;
}

// --- User Config ---

export interface UserConfig {
  id: string;                  // always 'default' for single-user
  challengeStartDate: string;  // YYYY-MM-DD
  challengeWeeks: number;      // user-chosen duration (e.g. 7)
  goalDescription: string;
  createdAt: number;
  updatedAt: number;
}

// --- Journal Entries ---

export const Mood = {
  GREAT: 'great',
  GOOD: 'good',
  NEUTRAL: 'neutral',
  BAD: 'bad',
  TERRIBLE: 'terrible',
} as const;

export type Mood = (typeof Mood)[keyof typeof Mood];

export const MOOD_EMOJI: Record<Mood, string> = {
  [Mood.GREAT]: '🔥',
  [Mood.GOOD]: '😊',
  [Mood.NEUTRAL]: '😐',
  [Mood.BAD]: '😞',
  [Mood.TERRIBLE]: '💀',
};

export const MOOD_LABELS: Record<Mood, string> = {
  [Mood.GREAT]: 'Great',
  [Mood.GOOD]: 'Good',
  [Mood.NEUTRAL]: 'Meh',
  [Mood.BAD]: 'Bad',
  [Mood.TERRIBLE]: 'Terrible',
};

export interface JournalEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  content: string;
  mood: Mood;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// --- Notification Logs ---

export interface NotificationLog {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  firedAt: number;
  readAt: number | null;   // null = unread
}

// --- Helper Types ---

/** Task creation input — id, createdAt, updatedAt are auto-generated */
export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/** Partial task update — only fields being changed */
export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt'>>;

/** Review creation input — id, createdAt are auto-generated */
export type ReviewInput = Omit<Review, 'id' | 'createdAt'>;

/** Workstream creation input */
export type WorkstreamInput = Omit<Workstream, 'id' | 'createdAt' | 'isDefault' | 'sortOrder'>;

// --- Display label helpers ---

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.NONE]: 'None',
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.CRITICAL]: 'Critical',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  [TaskStatus.PLANNED]: 'Planned',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.DEFERRED]: 'Deferred',
  [TaskStatus.ROLLED_OVER]: 'Rolled Over',
};
