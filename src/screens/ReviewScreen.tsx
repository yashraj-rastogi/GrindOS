import { RotateCcw } from 'lucide-react';
import './PlaceholderScreen.css';

export default function ReviewScreen() {
  return (
    <div className="screen-container animate-fade-in-up">
      <div className="screen-date-header">
        <h1>Weekly Review</h1>
        <p className="section-header">Reflect, Reset, Refocus</p>
      </div>

      <div className="placeholder-card card">
        <RotateCcw size={48} strokeWidth={1.5} className="placeholder-icon" />
        <h3>Review Loop</h3>
        <p>Guided weekly review — wins, misses, rollover debt, and next-week focus. Your Sunday evening ritual.</p>
        <span className="chip" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}>
          Coming in Phase 5
        </span>
      </div>
    </div>
  );
}
