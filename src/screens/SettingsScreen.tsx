import { Settings } from 'lucide-react';
import './PlaceholderScreen.css';

export default function SettingsScreen() {
  return (
    <div className="screen-container animate-fade-in-up">
      <div className="screen-date-header">
        <h1>Settings</h1>
        <p className="section-header">Preferences & Configuration</p>
      </div>

      <div className="placeholder-card card">
        <Settings size={48} strokeWidth={1.5} className="placeholder-icon" />
        <h3>App Settings</h3>
        <p>Theme toggle, notification preferences, workstream management, data export, and past reviews.</p>
        <span className="chip" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}>
          Coming in Phase 5
        </span>
      </div>
    </div>
  );
}
