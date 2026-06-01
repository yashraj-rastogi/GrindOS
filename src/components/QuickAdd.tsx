import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useWorkstreams } from '../db/hooks';
import { TaskPriority, TaskStatus, TaskSource } from '../db/models';
import { addTask } from '../db/operations';
import { toDateString } from '../utils/dates';
import './QuickAdd.css';

interface QuickAddProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlannedFor?: string | null; // Defaults to today's date string
  initialStatus?: TaskStatus; // Defaults to PLANNED
}

export default function QuickAdd({
  isOpen,
  onClose,
  initialPlannedFor = toDateString(),
  initialStatus = TaskStatus.PLANNED,
}: QuickAddProps) {
  const [title, setTitle] = useState('');
  const [selectedWorkstreamId, setSelectedWorkstreamId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(TaskPriority.NONE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workstreams = useWorkstreams(true); // Get active workstreams

  // Select the first workstream by default once they load
  useEffect(() => {
    if (workstreams && workstreams.length > 0 && !selectedWorkstreamId) {
      setSelectedWorkstreamId(workstreams[0].id);
    }
  }, [workstreams, selectedWorkstreamId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedWorkstreamId) return;

    try {
      setIsSubmitting(true);
      await addTask({
        title: title.trim(),
        workstreamId: selectedWorkstreamId,
        priority: selectedPriority,
        status: initialStatus,
        plannedFor: initialPlannedFor,
        source: TaskSource.MANUAL,
      });
      setTitle('');
      setSelectedPriority(TaskPriority.NONE);
      onClose();
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="quick-add-overlay" onClick={handleOverlayClick}>
      <div className="quick-add-modal">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="section-header" style={{ margin: 0, fontSize: 'var(--text-base)' }}>
            Quick Add Task
          </h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title Input */}
          <div className="flex flex-col gap-1">
            <label htmlFor="task-title" className="picker-label">Task Title</label>
            <input
              id="task-title"
              type="text"
              className="input"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Workstream Selection */}
          <div className="flex flex-col gap-1">
            <span className="picker-label">Workstream</span>
            <div className="chips-scroll">
              {workstreams?.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  className={`chip picker-chip ${selectedWorkstreamId === ws.id ? 'selected' : ''}`}
                  onClick={() => setSelectedWorkstreamId(ws.id)}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: selectedWorkstreamId === ws.id ? 'var(--color-accent)' : undefined,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: ws.color,
                      display: 'inline-block',
                      marginRight: 'var(--space-1)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                  {ws.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div className="flex flex-col gap-1">
            <span className="picker-label">Priority</span>
            <div className="chips-scroll">
              {(Object.keys(TaskPriority) as Array<keyof typeof TaskPriority>).map((key) => {
                const priorityValue = TaskPriority[key];
                return (
                  <button
                    key={priorityValue}
                    type="button"
                    className={`chip picker-chip ${selectedPriority === priorityValue ? 'selected' : ''}`}
                    onClick={() => setSelectedPriority(priorityValue)}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: selectedPriority === priorityValue ? 'var(--color-accent)' : undefined,
                    }}
                  >
                    {priorityValue === TaskPriority.NONE ? 'NONE' : priorityValue.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting || !title.trim()}
            >
              <Plus size={16} strokeWidth={3} />
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
