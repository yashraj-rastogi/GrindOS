import { CalendarRange } from 'lucide-react';
import './PlaceholderScreen.css';

export default function ThisWeekScreen() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday

  const formatShort = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="screen-container animate-fade-in-up">
      <div className="screen-date-header">
        <h1>This Week</h1>
        <p className="section-header">
          {formatShort(weekStart)} – {formatShort(weekEnd)}
        </p>
      </div>

      <div className="placeholder-card card">
        <CalendarRange size={48} strokeWidth={1.5} className="placeholder-icon" />
        <h3>Weekly Planner</h3>
        <p>Day-grouped tasks, weekly priorities, and rollover debt will appear here.</p>
        <span className="chip" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}>
          Coming in Phase 4
        </span>
      </div>
    </div>
  );
}
