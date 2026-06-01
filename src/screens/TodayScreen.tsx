import { CalendarDays } from 'lucide-react';
import './PlaceholderScreen.css';

export default function TodayScreen() {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="screen-container animate-fade-in-up">
      <div className="screen-date-header">
        <h1>{dayName}</h1>
        <p className="section-header">{dateStr}</p>
      </div>

      <div className="placeholder-card card">
        <CalendarDays size={48} strokeWidth={1.5} className="placeholder-icon" />
        <h3>Today's Execution Hub</h3>
        <p>Your daily task list, priorities, and carryovers will appear here.</p>
        <span className="chip" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}>
          Coming in Phase 3
        </span>
      </div>
    </div>
  );
}
