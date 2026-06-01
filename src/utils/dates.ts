// ============================================================
// Tracker — Date Utility Functions
// ============================================================

/**
 * Returns a YYYY-MM-DD date string for the given date (defaults to today).
 */
export function toDateString(date?: Date): string {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Monday–Sunday week bounds for the given date.
 * Returns { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }.
 */
export function getWeekBounds(date?: Date): { start: string; end: string } {
  const d = date ?? new Date();
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  // Shift so Monday = 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: toDateString(monday),
    end: toDateString(sunday),
  };
}

/**
 * Checks if a YYYY-MM-DD date string represents today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === toDateString();
}

/**
 * Checks if a YYYY-MM-DD date string falls within the same Mon–Sun week
 * as the reference date (defaults to today).
 */
export function isSameWeek(dateStr: string, refDate?: Date): boolean {
  const { start, end } = getWeekBounds(refDate);
  return dateStr >= start && dateStr <= end;
}

/**
 * Returns yesterday's date as a YYYY-MM-DD string.
 */
export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

/**
 * Formats a YYYY-MM-DD string into a human-readable format.
 * e.g., "Mon, Jun 2"
 */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns an array of YYYY-MM-DD date strings for Mon–Sun of the given week.
 */
export function getWeekDays(date?: Date): string[] {
  const { start } = getWeekBounds(date);
  const monday = new Date(start + 'T00:00:00');
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(toDateString(d));
  }
  return days;
}
