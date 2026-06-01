import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Calendar } from 'lucide-react';
import type { Task, Workstream } from '../db/models';
import TaskCard from './TaskCard';

interface DayGroupProps {
  dayName: string;
  dateStr: string;
  tasks: Task[];
  workstreams: Workstream[];
  isToday: boolean;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeferTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddTask: () => void;
}

export default function DayGroup({
  dayName,
  dateStr,
  tasks,
  workstreams,
  isToday,
  onToggleComplete,
  onEditTask,
  onDeferTask,
  onDeleteTask,
  onAddTask,
}: DayGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const hasTasks = totalCount > 0;

  return (
    <div
      className="card flex flex-col gap-3"
      style={{
        borderWidth: isToday ? '3px' : '2px',
        borderColor: isToday ? 'var(--color-accent)' : 'var(--color-border)',
        boxShadow: isToday ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        padding: 'var(--space-4)',
        background: isToday ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ userSelect: 'none' }}
      >
        <div className="flex items-center gap-2">
          {isToday && <Calendar size={16} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />}
          <h3
            style={{
              fontSize: 'var(--text-lg)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
              color: isToday ? 'var(--color-text-primary)' : 'inherit',
            }}
          >
            {dayName}
          </h3>
          <span className="section-header" style={{ fontSize: 'var(--text-xs)', margin: 0, opacity: 0.7 }}>
            {dateStr}
          </span>
          {isToday && (
            <span
              className="chip mono"
              style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderColor: 'var(--color-accent)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-on-accent)',
                fontWeight: 'bold',
                marginLeft: 'var(--space-2)',
              }}
            >
              TODAY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasTasks && (
            <span className="fraction" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              [ {doneCount} / {totalCount} ]
            </span>
          )}
          <button
            type="button"
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp size={16} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div
          className="flex flex-col gap-3 mt-2 pt-3 border-t"
          style={{
            borderColor: 'rgba(26, 50, 99, 0.1)',
            animation: 'fadeInDown var(--transition-fast) ease',
          }}
        >
          {hasTasks ? (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  workstream={workstreams.find((ws) => ws.id === task.workstreamId)}
                  onToggleComplete={() => onToggleComplete(task)}
                  onEdit={() => onEditTask(task)}
                  onDefer={() => onDeferTask(task)}
                  onDelete={() => onDeleteTask(task)}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              No tasks planned for this day.
            </p>
          )}

          {/* Quick inline Add Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
            className="btn btn-secondary flex items-center justify-center gap-1 mt-1"
            style={{
              padding: 'var(--space-2) var(--space-3)',
              fontSize: 'var(--text-xs)',
              borderStyle: 'dashed',
              borderWidth: '2px',
              width: '100%',
            }}
          >
            <Plus size={12} strokeWidth={3} />
            Add Task to {dayName}
          </button>
        </div>
      )}
    </div>
  );
}
