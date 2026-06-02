import { Clock, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../db/models';
import type { Task, Workstream } from '../db/models';
import WorkstreamChip from './WorkstreamChip';

interface TaskCardProps {
  task: Task;
  workstream?: Workstream;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDefer?: () => void;
  onDelete?: () => void;
}

export default function TaskCard({
  task,
  workstream,
  onToggleComplete,
  onEdit,
  onDefer,
  onDelete,
}: TaskCardProps) {
  const isDone = task.status === TaskStatus.DONE;

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return (
          <span
            className="chip mono"
            style={{
              borderColor: 'var(--color-danger)',
              backgroundColor: 'rgba(229, 57, 53, 0.12)',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-1) var(--space-2)',
              borderWidth: '2px',
            }}
          >
            CRITICAL
          </span>
        );
      case TaskPriority.HIGH:
        return (
          <span
            className="chip mono"
            style={{
              borderColor: 'var(--color-accent)',
              backgroundColor: 'rgba(250, 185, 91, 0.12)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-1) var(--space-2)',
              borderWidth: '2px',
            }}
          >
            HIGH
          </span>
        );
      case TaskPriority.MEDIUM:
        return (
          <span
            className="chip mono"
            style={{
              borderColor: 'var(--color-muted)',
              backgroundColor: 'rgba(84, 119, 146, 0.12)',
              color: 'var(--color-muted)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-1) var(--space-2)',
              borderWidth: '2px',
            }}
          >
            MED
          </span>
        );
      case TaskPriority.LOW:
        return (
          <span
            className="chip mono"
            style={{
              borderColor: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-1) var(--space-2)',
              borderWidth: '2px',
              opacity: 0.6,
            }}
          >
            LOW
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`card flex flex-col gap-3 animate-fade-in`}
      style={{
        borderWidth: '2px',
        padding: 'var(--space-3) var(--space-3)',
        opacity: isDone ? 0.75 : 1,
        transition: 'all var(--transition-fast)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Title and Checkbox in full-width row */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`checkbox ${isDone ? 'checked' : ''}`}
          style={{ marginTop: '2px' }}
        >
          {isDone && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span
            onClick={onEdit}
            style={{
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              wordBreak: 'break-word',
            }}
          >
            {task.title}
          </span>
          {task.notes && (
            <p
              onClick={onEdit}
              style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: 'pointer',
                wordBreak: 'break-word',
              }}
            >
              {task.notes}
            </p>
          )}
        </div>
      </div>

      {/* Footer tags, chips & action buttons on a separate row */}
      <div className="flex items-center justify-between gap-2 mt-1 border-t pt-2" style={{ borderColor: 'rgba(26,50,99,0.06)' }}>
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {/* Workstream tag */}
          {workstream && <WorkstreamChip workstream={workstream} />}

          {/* Priority tag */}
          {getPriorityBadge(task.priority)}

          {/* Rollover badge */}
          {task.rolloverCount > 0 && (
            <span
              className="chip mono"
              title={`${task.rolloverCount} times rolled over`}
              style={{
                borderColor: 'var(--color-danger)',
                backgroundColor: 'var(--color-danger)',
                color: '#FFFFFF',
                fontSize: '9px',
                padding: '1px 4px',
                fontWeight: 'var(--weight-bold)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <RefreshCw size={8} strokeWidth={3} className="animate-spin" style={{ animationDuration: '6s' }} />
              ×{task.rolloverCount}
            </span>
          )}
        </div>

        {/* Sleek, compact footer quick actions */}
        <div className="flex items-center gap-0.5 shrink-0 ml-auto">
          {onDefer && task.status !== TaskStatus.DONE && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDefer();
              }}
              title="Defer Task (to backlog)"
              style={{ color: 'var(--color-muted)', width: '26px', height: '26px' }}
            >
              <Clock size={13} strokeWidth={2.5} />
            </button>
          )}
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit Task"
            style={{ color: 'var(--color-muted)', width: '26px', height: '26px' }}
          >
            <Edit2 size={13} strokeWidth={2.5} />
          </button>
          {onDelete && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete Task"
              style={{ color: 'var(--color-danger)', width: '26px', height: '26px' }}
            >
              <Trash2 size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
