// ============================================================
// DSA Lecture Data — Static checklist
// ============================================================

export interface LectureItem {
  id: number;
  type: LectureType;
  title: string;
}

export type LectureType = 'Intro' | 'Lec' | 'Practice' | 'Sunday' | 'Mentor' | 'Material' | 'PYQ';

export interface LecturePhase {
  name: string;
  description: string;
  items: LectureItem[];
}

// Type badge colors
export const TYPE_COLORS: Record<LectureType, string> = {
  Intro: '#547792',
  Lec: '#3B82F6',
  Practice: '#10B981',
  Sunday: '#8B5CF6',
  Mentor: '#F97316',
  Material: '#FAB95B',
  PYQ: '#E53935',
};

export const TYPE_LABELS: Record<LectureType, string> = {
  Intro: 'INTRO',
  Lec: 'LECTURE',
  Practice: 'PRACTICE',
  Sunday: 'LIVE',
  Mentor: 'MENTOR',
  Material: 'MATERIAL',
  PYQ: 'PYQ',
};

const allLectures: LectureItem[] = [
  // --- PHASE 1: FOUNDATION (Intro & Lectures) ---
  { id: 1, type: "Intro", title: "Welcome to alpha" },
  { id: 2, type: "Intro", title: "Introduction" },
  { id: 3, type: "Intro", title: "Prerequisites-Installation" },
  { id: 4, type: "Intro", title: "Flowcharts" },
  { id: 5, type: "Intro", title: "Live Session" },
  { id: 6, type: "Lec", title: "Variables & Data Types" },
  { id: 7, type: "Lec", title: "Operators" },
  { id: 8, type: "Lec", title: "Conditional Statements" },
  { id: 9, type: "Lec", title: "Loops" },
  { id: 10, type: "Lec", title: "Pattern 1 (Star Patterns)" },
  { id: 11, type: "Lec", title: "Functions & Methods" },
  { id: 12, type: "Lec", title: "Pattern 2 (Advanced)" },
  { id: 13, type: "Lec", title: "Arrays" },
  { id: 14, type: "Lec", title: "Basic Sorting" },
  { id: 15, type: "Lec", title: "2D Arrays" },
  { id: 16, type: "Lec", title: "Strings" },
  { id: 17, type: "Lec", title: "Bit Manipulation" },
  { id: 18, type: "Lec", title: "OOPS" },
  { id: 19, type: "Lec", title: "Recursion Basic" },
  { id: 20, type: "Lec", title: "Divide & Conquer" },
  { id: 21, type: "Lec", title: "Time & Space Complexity" },
  { id: 22, type: "Lec", title: "Backtracking" },
  { id: 23, type: "Lec", title: "ArrayList" },
  { id: 24, type: "Lec", title: "Linked List Part 1" },
  { id: 25, type: "Lec", title: "Linked List Part 2" },
  { id: 26, type: "Lec", title: "Stacks" },
  { id: 27, type: "Lec", title: "Queues" },
  { id: 28, type: "Lec", title: "Greedy Algorithms" },
  { id: 29, type: "Lec", title: "Binary Trees Part 1" },
  { id: 30, type: "Lec", title: "Binary Trees Part 2" },
  { id: 31, type: "Lec", title: "Binary Trees Part 3" },
  { id: 32, type: "Lec", title: "BST Part 1" },
  { id: 33, type: "Lec", title: "BST Part 2" },
  { id: 34, type: "Lec", title: "Heaps" },
  { id: 35, type: "Lec", title: "Hashing" },
  { id: 36, type: "Lec", title: "Tries" },
  { id: 37, type: "Lec", title: "Graphs Part 1" },
  { id: 38, type: "Lec", title: "Graphs Part 2" },
  { id: 39, type: "Lec", title: "Graphs Part 3" },
  { id: 40, type: "Lec", title: "Graphs Part 4" },
  { id: 41, type: "Lec", title: "Graphs Part 5" },
  { id: 42, type: "Lec", title: "Graphs Supplemental" },
  { id: 43, type: "Lec", title: "Dynamic Programming Part 1" },
  { id: 44, type: "Lec", title: "Dynamic Programming Part 2" },
  { id: 45, type: "Lec", title: "Dynamic Programming Part 3" },
  { id: 46, type: "Lec", title: "Dynamic Programming Part 4" },
  { id: 47, type: "Lec", title: "Dynamic Programming Part 5" },
  { id: 48, type: "Lec", title: "Dynamic Programming Part 6" },
  { id: 49, type: "Lec", title: "Segment Trees" },
  { id: 50, type: "Material", title: "Study Material Resources" },

  // --- PHASE 2: PRACTICE & MENTORSHIP ---
  { id: 51, type: "Intro", title: "Orientation" },
  { id: 52, type: "Practice", title: "Week 1 Session-1" },
  { id: 53, type: "Practice", title: "Week 1 Session-2" },
  { id: 54, type: "Practice", title: "Week 1 Session-3" },
  { id: 55, type: "Sunday", title: "Week 1 Sunday Live" },
  { id: 56, type: "Mentor", title: "LinkedIn Masterclass" },
  { id: 57, type: "Practice", title: "Week 2 Session-1" },
  { id: 58, type: "Practice", title: "Week 2 Session-2" },
  { id: 59, type: "Practice", title: "Week 2 Session-3" },
  { id: 60, type: "Sunday", title: "Week 2 Sunday Live" },
  { id: 61, type: "Mentor", title: "Google Prep Guide" },
  { id: 62, type: "Practice", title: "Week 3 Session-1" },
  { id: 63, type: "Practice", title: "Week 3 Session-2" },
  { id: 64, type: "Practice", title: "Week 3 Session-3" },
  { id: 65, type: "Sunday", title: "Week 3 Sunday Live" },
  { id: 66, type: "Practice", title: "Week 4 Session-1" },
  { id: 67, type: "Practice", title: "Week 4 Session-2" },
  { id: 68, type: "Practice", title: "Week 4 Session-3" },
  { id: 69, type: "Sunday", title: "Week 4 Sunday Live" },
  { id: 70, type: "Mentor", title: "Amazon Prep Guide" },
  { id: 71, type: "Mentor", title: "Atlassian Prep Guide" },
  { id: 72, type: "Practice", title: "Week 5 Session-1" },
  { id: 73, type: "Practice", title: "Week 5 Session-2" },
  { id: 74, type: "Practice", title: "Week 5 Session-3" },
  { id: 75, type: "Sunday", title: "Week 5 Sunday Live" },
  { id: 76, type: "Mentor", title: "Salesforce Prep Guide" },
  { id: 77, type: "Practice", title: "Week 6 Session-1" },
  { id: 78, type: "Practice", title: "Week 6 Session-2" },
  { id: 79, type: "Practice", title: "Week 6 Session-3" },
  { id: 80, type: "Sunday", title: "Week 6 Sunday Live" },
  { id: 81, type: "Practice", title: "Week 7 Session-1" },
  { id: 82, type: "Practice", title: "Week 7 Session-2" },
  { id: 83, type: "Practice", title: "Week 7 Session-3" },
  { id: 84, type: "Sunday", title: "Week 7 Sunday Live" },
  { id: 85, type: "Practice", title: "Week 8 Session-1" },
  { id: 86, type: "Practice", title: "Week 8 Session-2" },
  { id: 87, type: "Practice", title: "Week 9 Session-1" },
  { id: 88, type: "Practice", title: "Week 9 Session-2" },
  { id: 89, type: "Practice", title: "Week 9 Session-3" },
  { id: 90, type: "Mentor", title: "Coding Platforms Guide" },
  { id: 91, type: "Sunday", title: "Week 9 Sunday Live" },
  { id: 92, type: "Practice", title: "Week 10 Session-1" },
  { id: 93, type: "Practice", title: "Week 10 Session-2" },
  { id: 94, type: "Practice", title: "Week 10 Session-3" },
  { id: 95, type: "Sunday", title: "Week 10 Sunday Live" },
  { id: 96, type: "Practice", title: "Week 11 Session-1" },
  { id: 97, type: "Practice", title: "Week 11 Session-2" },
  { id: 98, type: "Practice", title: "Week 11 Session-3" },
  { id: 99, type: "Sunday", title: "Week 11 Sunday Live" },
  { id: 100, type: "Practice", title: "Week 12 Session-1" },
  { id: 101, type: "Practice", title: "Week 12 Session-2" },
  { id: 102, type: "Sunday", title: "Week 12 Sunday Live" },
  { id: 103, type: "Practice", title: "Week 13 Session-1" },
  { id: 104, type: "Practice", title: "Week 13 Session-2" },
  { id: 105, type: "Practice", title: "Week 13 Session-3" },
  { id: 106, type: "Sunday", title: "Week 13 Sunday Live" },
  { id: 107, type: "Practice", title: "Week 14 Session-1" },
  { id: 108, type: "Practice", title: "Week 14 Session-2" },
  { id: 109, type: "Practice", title: "Week 14 Session-3" },
  { id: 110, type: "Sunday", title: "Week 14 Sunday Live" },
  { id: 111, type: "Practice", title: "Week 15 Session-1" },
  { id: 112, type: "Practice", title: "Week 15 Session-2" },
  { id: 113, type: "Practice", title: "Week 15 Session-3" },
  { id: 114, type: "Mentor", title: "Mentorship Session" },
  { id: 115, type: "Practice", title: "Week 16 Session-1" },
  { id: 116, type: "Practice", title: "Week 16 Session-2" },
  { id: 117, type: "Mentor", title: "Resume Building" },
  { id: 118, type: "Mentor", title: "Off-campus Opportunities" },
  { id: 119, type: "Mentor", title: "GSOC Guidance" },

  // --- PHASE 3: COMPANY PYQs ---
  { id: 120, type: "PYQ", title: "Amazon (Easy)" },
  { id: 121, type: "PYQ", title: "Amazon (Medium)" },
  { id: 122, type: "PYQ", title: "Amazon (Hard)" },
  { id: 123, type: "PYQ", title: "Microsoft (Easy)" },
  { id: 124, type: "PYQ", title: "Microsoft (Medium)" },
  { id: 125, type: "PYQ", title: "Microsoft (Hard)" },
  { id: 126, type: "PYQ", title: "Google (Easy)" },
  { id: 127, type: "PYQ", title: "Google (Medium)" },
  { id: 128, type: "PYQ", title: "Google (Hard)" },
  { id: 129, type: "PYQ", title: "Atlassian (Easy)" },
  { id: 130, type: "PYQ", title: "Atlassian (Medium)" },
  { id: 131, type: "PYQ", title: "Atlassian (Hard)" },
  { id: 132, type: "PYQ", title: "Goldman Sachs (Easy)" },
  { id: 133, type: "PYQ", title: "Goldman Sachs (Medium)" },
  { id: 134, type: "PYQ", title: "Goldman Sachs (Hard)" },
  { id: 135, type: "PYQ", title: "Adobe (Easy)" },
  { id: 136, type: "PYQ", title: "Adobe (Medium)" },
  { id: 137, type: "PYQ", title: "Adobe (Hard)" },
];

// Group into phases
export const DSA_PHASES: LecturePhase[] = [
  {
    name: 'Phase 1: Foundation',
    description: 'Core DSA concepts — Intro through Segment Trees',
    items: allLectures.filter((l) => l.id >= 1 && l.id <= 50),
  },
  {
    name: 'Phase 2: Practice & Mentorship',
    description: '16 weeks of practice sessions and career mentorship',
    items: allLectures.filter((l) => l.id >= 51 && l.id <= 119),
  },
  {
    name: 'Phase 3: Company PYQs',
    description: 'Previous year questions by company and difficulty',
    items: allLectures.filter((l) => l.id >= 120 && l.id <= 137),
  },
];

export const TOTAL_LECTURES = allLectures.length;

export default allLectures;
