import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useWorkstreams } from '../db/hooks';
import { TaskPriority, TaskStatus, STATUS_LABELS } from '../db/models';
import type { Task } from '../db/models';
import { updateTask, transitionTask, deleteTask } from '../db/operations';
import { getValidTransitions } from '../domain/taskStateMachine';
import './TaskDetail.css';

interface TaskDetailProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetail({ task, isOpen, onClose }: TaskDetailProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [workstreamId, setWorkstreamId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.NONE);
  const [plannedFor, setPlannedFor] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimate, setEstimate] = useState<number | ''>('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workstreams = useWorkstreams(); // Get all workstreams to populate select

  // Populate form fields when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setWorkstreamId(task.workstreamId);
      setPriority(task.priority);
      setPlannedFor(task.plannedFor || '');
      setDueDate(task.dueDate || '');
      setEstimate(task.estimate !== null ? task.estimate : '');
      setTagsInput(task.tags ? task.tags.join(', ') : '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getFormData = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    return {
      title: title.trim(),
      notes: notes.trim(),
      workstreamId,
      priority,
      plannedFor: plannedFor || null,
      dueDate: dueDate || null,
      estimate: estimate === '' ? null : Number(estimate),
      tags,
    };
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !workstreamId) return;

    try {
      setIsSubmitting(true);
      const data = getFormData();
      await updateTask(task.id, data);
      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransition = async (newStatus: TaskStatus) => {
    try {
      setIsSubmitting(true);
      // First save other edited values
      const data = getFormData();
      await updateTask(task.id, data);

      // Then transition
      // Extra values (like plannedFor resetting if going back to backlog/deferred)
      const extra: Partial<Task> = {};
      if (newStatus === TaskStatus.BACKLOG || newStatus === TaskStatus.DEFERRED) {
        extra.plannedFor = null;
      } else if (newStatus === TaskStatus.PLANNED && !data.plannedFor) {
        // If transitioning to planned, ensure it has a date
        const today = new Date().toISOString().split('T')[0];
        extra.plannedFor = today;
      }

      await transitionTask(task.id, newStatus, extra);
      onClose();
    } catch (err) {
      console.error('Failed to transition task:', err);
      alert(`Could not transition status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setIsSubmitting(true);
        await deleteTask(task.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete task:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const validNextStatuses = getValidTransitions(task.status);

  return (
    <div className="task-detail-overlay" onClick={handleOverlayClick}>
      <div className="task-detail-modal">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-col">
            <span className="section-header" style={{ fontSize: 'var(--text-xs)' }}>
              Task Details
            </span>
            <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Status: <strong style={{ color: 'var(--color-accent)' }}>{STATUS_LABELS[task.status].toUpperCase()}</strong>
            </span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close details">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Status Transitions */}
        {validNextStatuses.length > 0 && (
          <div className="flex flex-col gap-2 mb-4 p-3 card bg-dots" style={{ borderWidth: '2px' }}>
            <span className="picker-label" style={{ margin: 0 }}>
              Quick Transition Status:
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {validNextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="chip transition-chip"
                  onClick={() => handleTransition(status)}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-text-on-accent)',
                    borderColor: 'var(--color-dark)',
                    fontWeight: 'var(--weight-bold)',
                  }}
                >
                  Move to {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 flex-1">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-title" className="picker-label">Task Title</label>
            <input
              id="edit-title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-notes" className="picker-label">Notes & Subtasks</label>
            <textarea
              id="edit-notes"
              className="textarea"
              placeholder="Add notes or detail subtasks here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              style={{ minHeight: '120px' }}
            />
          </div>

          {/* Workstream Select */}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-workstream" className="picker-label">Workstream</label>
            <select
              id="edit-workstream"
              className="input"
              value={workstreamId}
              onChange={(e) => setWorkstreamId(e.target.value)}
              required
              disabled={isSubmitting}
              style={{
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231A3263' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                paddingRight: '40px',
              }}
            >
              {workstreams?.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Picker */}
          <div className="flex flex-col gap-1">
            <span className="picker-label">Priority</span>
            <div className="chips-scroll">
              {(Object.keys(TaskPriority) as Array<keyof typeof TaskPriority>).map((key) => {
                const priorityValue = TaskPriority[key];
                return (
                  <button
                    key={priorityValue}
                    type="button"
                    className={`chip picker-chip ${priority === priorityValue ? 'selected' : ''}`}
                    onClick={() => setPriority(priorityValue)}
                    disabled={isSubmitting}
                  >
                    {priorityValue === TaskPriority.NONE ? 'NONE' : priorityValue.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates & Estimate Row */}
          <div className="flex gap-4">
            {/* Planned For */}
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-planned" className="picker-label">Planned For</label>
              <input
                id="edit-planned"
                type="date"
                className="input"
                value={plannedFor}
                onChange={(e) => setPlannedFor(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-due" className="picker-label">Due Date</label>
              <input
                id="edit-due"
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-4">
            {/* Estimate */}
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-estimate" className="picker-label">Estimate (minutes)</label>
              <input
                id="edit-estimate"
                type="number"
                min="0"
                placeholder="e.g. 30"
                className="input"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isSubmitting}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-tags" className="picker-label">Tags (comma-separated)</label>
              <input
                id="edit-tags"
                type="text"
                placeholder="tag1, tag2"
                className="input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-auto pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              className="btn btn-danger flex-1"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              <Trash2 size={16} strokeWidth={2.5} />
              Delete
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting || !title.trim()}
            >
              <Save size={16} strokeWidth={2.5} />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
