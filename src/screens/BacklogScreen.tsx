import { Archive } from 'lucide-react';
import './PlaceholderScreen.css';

export default function BacklogScreen() {
  return (
    <div className="screen-container animate-fade-in-up">
      <div className="screen-date-header">
        <h1>The Vault</h1>
        <p className="section-header">Backlog & Future Work</p>
      </div>

      <div className="placeholder-card card">
        <Archive size={48} strokeWidth={1.5} className="placeholder-icon" />
        <h3>Backlog Vault</h3>
        <p>Your future ideas, low-priority tasks, and stored work will live here. Dark-mode inversion for that executive dashboard feel.</p>
        <span className="chip" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}>
          Coming in Phase 4
        </span>
      </div>
    </div>
  );
}
