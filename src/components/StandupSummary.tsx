import { useState } from 'react';
import { ChevronDown, ChevronUp, History, CornerDownRight } from 'lucide-react';
import type { Task } from '../db/models';

interface StandupSummaryProps {
  completedCount: number;
  rolledOverTasks: Task[];
}

export default function StandupSummary({
  completedCount,
  rolledOverTasks,
}: StandupSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalYesterday = completedCount + rolledOverTasks.length;
  if (totalYesterday === 0) return null; // Nothing to show

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div
      className="card mb-4 bg-dots"
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderColor: 'var(--color-border)',
        borderWidth: '2px',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleExpand}
        style={{ userSelect: 'none' }}
      >
        <div className="flex items-center gap-2">
          <History size={16} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
          <span className="section-header" style={{ fontSize: 'var(--text-xs)', margin: 0, color: 'var(--color-text-primary)' }}>
            Rollover Recap
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {completedCount} done • {rolledOverTasks.length} rolled over
          </span>
          {isExpanded ? (
            <ChevronUp size={16} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={16} strokeWidth={2.5} />
          )}
        </div>
      </div>

      {/* Expanded list */}
      {isExpanded && rolledOverTasks.length > 0 && (
        <div
          className="flex flex-col gap-2 mt-3 pt-3 border-t"
          style={{ borderColor: 'rgba(26, 50, 99, 0.1)', animation: 'fadeInDown var(--transition-fast) ease' }}
        >
          {rolledOverTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2" style={{ fontSize: 'var(--text-xs)' }}>
              <CornerDownRight size={12} strokeWidth={2.5} style={{ color: 'var(--color-muted)', marginTop: '2px', flexShrink: 0 }} />
              <div className="flex flex-col flex-1">
                <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {task.title}
                </span>
                {task.notes && (
                  <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '10px' }}>
                    {task.notes}
                  </p>
                )}
              </div>
              {task.rolloverCount > 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: '9px',
                    backgroundColor: 'var(--color-danger)',
                    color: '#FFFFFF',
                    padding: '1px 4px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'bold',
                  }}
                >
                  ×{task.rolloverCount}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
