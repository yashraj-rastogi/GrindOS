import { useEffect } from 'react';
import { ShieldAlert, Zap, ArrowRight } from 'lucide-react';
import { TaskStatus } from '../db/models';
import type { Task } from '../db/models';
import { rolloverTasks } from '../db/operations';
import { toDateString } from '../utils/dates';
import './StandupGate.css';

interface StandupGateProps {
  isOpen: boolean;
  yesterdayTasks: Task[];
  onClose: () => void;
}

export default function StandupGate({
  isOpen,
  yesterdayTasks,
  onClose,
}: StandupGateProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on the main page while the full screen gate is active
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLockItIn = async () => {
    const todayStr = toDateString();
    
    try {
      if (yesterdayTasks.length > 0) {
        // Only roll over tasks that haven't already been processed by the 4AM
        // rollover engine. Tasks already in ROLLED_OVER status with today's date
        // were handled by rollover.ts and should NOT be re-rolled.
        const needsRollover = yesterdayTasks.filter(
          (t) => t.status !== TaskStatus.ROLLED_OVER || t.plannedFor !== todayStr
        );
        if (needsRollover.length > 0) {
          const taskIds = needsRollover.map((t) => t.id);
          await rolloverTasks(taskIds, todayStr);
        }
      }
      
      // Save standup as completed for today
      localStorage.setItem(`tracker_standup_completed_${todayStr}`, 'true');
      onClose();
    } catch (err) {
      console.error('Failed to complete standup:', err);
      // Close anyway to avoid locking the user out
      onClose();
    }
  };

  const hasUnfinished = yesterdayTasks.length > 0;

  return (
    <div className="standup-gate-container bg-dots animate-fade-in">
      <div className="standup-content">
        {/* Shield Icon */}
        <div
          className="flex items-center justify-center animate-scale-in"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--color-accent)',
            border: '4px solid #0f172a',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '4px 4px 0px #0f172a',
            margin: '0 auto',
          }}
        >
          {hasUnfinished ? (
            <ShieldAlert size={44} strokeWidth={2.5} style={{ color: '#0f172a' }} />
          ) : (
            <Zap size={44} strokeWidth={2.5} style={{ color: '#0f172a' }} />
          )}
        </div>

        {/* Title */}
        <h1 className="standup-title">
          {hasUnfinished ? 'Confront Your Debt' : 'A Clean Slate'}
        </h1>

        <p
          className="mono"
          style={{
            color: '#b0bdd0',
            fontSize: 'var(--text-sm)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wide)',
            marginTop: '-5px',
          }}
        >
          Daily Standup Gate
        </p>

        {/* Message */}
        {hasUnfinished ? (
          <>
            <p style={{ fontSize: 'var(--text-base)', color: '#e8e2db', lineHeight: '1.5' }}>
              These tasks survived yesterday. Will they survive today? Or are they backlog waste? Lock them in or deal with them.
            </p>

            {/* List of unfinished tasks */}
            <div className="standup-card flex flex-col gap-2">
              <span className="picker-label" style={{ color: '#547792', borderBottom: '1px solid #1a3263', paddingBottom: '4px' }}>
                Unresolved Carryovers ({yesterdayTasks.length})
              </span>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: 'var(--space-2)' }}>
                {yesterdayTasks.map((task) => (
                  <div key={task.id} className="standup-task-item">
                    <ArrowRight size={14} strokeWidth={3} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: '#1a3263' }}>
                      {task.title}
                    </span>
                    {task.rolloverCount > 0 && (
                      <span
                        className="mono"
                        style={{
                          fontSize: '10px',
                          backgroundColor: 'var(--color-danger)',
                          color: '#FFFFFF',
                          padding: '1px 4px',
                          borderRadius: 'var(--radius-sm)',
                          marginLeft: 'auto',
                          fontWeight: 'bold',
                        }}
                      >
                        ×{task.rolloverCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 'var(--text-base)', color: '#e8e2db', lineHeight: '1.5' }}>
              All targets hit! Yesterday is completely clear. You have earned a clean slate. Plan today's actions with absolute focus.
            </p>

            <div className="standup-card flex flex-col items-center justify-center p-6" style={{ height: '140px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-success)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                100% Complete
              </span>
              <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Zero rollover debt. Excellent execution.
              </p>
            </div>
          </>
        )}

        {/* Lock It In CTA */}
        <button
          className="btn btn-primary btn-cta mt-4 animate-scale-in"
          onClick={handleLockItIn}
          style={{
            width: '100%',
            borderWidth: '4px',
            borderColor: '#0f172a',
            boxShadow: '6px 6px 0px #0f172a',
            padding: 'var(--space-4) var(--space-6)',
          }}
        >
          {hasUnfinished ? 'Lock in Rollovers ↗' : 'Begin Planning ⚡'}
        </button>
      </div>
    </div>
  );
}
