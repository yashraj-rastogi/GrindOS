import { useState } from 'react';
import { ShieldAlert, Plus } from 'lucide-react';
import { useWeekTasks, useWorkstreams } from '../db/hooks';
import { getWeekBounds, getWeekDays, isToday, toDateString } from '../utils/dates';
import { transitionTask, deleteTask } from '../db/operations';
import { TaskStatus } from '../db/models';
import type { Task } from '../db/models';
import DayGroup from '../components/DayGroup';
import QuickAdd from '../components/QuickAdd';
import TaskDetail from '../components/TaskDetail';
import './ThisWeekScreen.css';

export default function ThisWeekScreen() {
  const { start, end } = getWeekBounds();
  const weekDays = getWeekDays();

  // Reactive DB queries
  const weekTasks = useWeekTasks(start) || [];
  const workstreams = useWorkstreams() || [];

  // Dialog & drawer states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);

  const formatShortHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handlers
  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.PLANNED : TaskStatus.DONE;
    try {
      await transitionTask(task.id, newStatus);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDefer = async (task: Task) => {
    try {
      await transitionTask(task.id, TaskStatus.DEFERRED, { plannedFor: null });
    } catch (err) {
      console.error('Failed to defer task:', err);
    }
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteTask(task.id);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleAddTaskClick = (dateStr: string) => {
    setQuickAddDate(dateStr);
    setIsQuickAddOpen(true);
  };

  // Calculate weekly stats & Rollover Debt
  const activeWeekTasks = weekTasks.filter((t) => t.status !== TaskStatus.DONE);
  const debtTasks = activeWeekTasks.filter((t) => t.rolloverCount > 0);
  const doneCount = weekTasks.filter((t) => t.status === TaskStatus.DONE).length;
  const totalCount = weekTasks.length;

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Date Header */}
      <div className="screen-date-header flex items-center justify-between mb-4">
        <div>
          <h1>Weekly Planner</h1>
          <p className="section-header">
            {formatShortHeader(start)} – {formatShortHeader(end)}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleAddTaskClick(toDateString())}
          style={{ padding: 'var(--space-2) var(--space-4)', borderWidth: '2px', height: '40px' }}
        >
          <Plus size={16} strokeWidth={3} />
          Add Task
        </button>
      </div>

      {/* Rollover Debt Section */}
      {debtTasks.length > 0 && (
        <div className="debt-banner mb-4">
          <ShieldAlert size={20} strokeWidth={2.5} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <div className="debt-text">
            ROLLOVER DEBT: {debtTasks.length} carryovers are currently active this week. Focus on resolving carryovers first!
          </div>
        </div>
      )}

      {/* Progress */}
      {totalCount > 0 && (
        <div className="card mb-4" style={{ padding: 'var(--space-3) var(--space-4)', borderWidth: '2px' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="section-header" style={{ fontSize: 'var(--text-xs)', margin: 0, color: 'var(--color-text-primary)' }}>
              Weekly Execution Rate
            </span>
            <span className="fraction" style={{ fontSize: 'var(--text-xs)' }}>
              [ {doneCount} / {totalCount} ]
            </span>
          </div>
          <div className="progress-container" style={{ height: '16px' }}>
            <div
              className="progress-fill"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Weekly planner grid */}
      <div className="weekly-planner-grid">
        {weekDays.map((dateStr) => {
          const dayDate = new Date(dateStr + 'T00:00:00');
          const dayNameLong = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
          const dateLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayTasks = weekTasks.filter((t) => t.plannedFor === dateStr);

          return (
            <DayGroup
              key={dateStr}
              dayName={dayNameLong}
              dateStr={dateLabel}
              tasks={dayTasks}
              workstreams={workstreams}
              isToday={isToday(dateStr)}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeferTask={handleDefer}
              onDeleteTask={handleDelete}
              onAddTask={() => handleAddTaskClick(dateStr)}
            />
          );
        })}
      </div>

      {/* Quick Add Bottom Sheet / Dialog */}
      <QuickAdd
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddDate(null);
        }}
        initialPlannedFor={quickAddDate}
        initialStatus={TaskStatus.PLANNED}
      />

      {/* Sliding Detail Drawer */}
      <TaskDetail
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
