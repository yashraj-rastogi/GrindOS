import { useState, useEffect } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useTaskCounts, useTodayTasks, useWorkstreams } from '../db/hooks';
import { toDateString, getYesterday } from '../utils/dates';
import { transitionTask, deleteTask } from '../db/operations';
import { TaskStatus, TaskPriority } from '../db/models';
import type { Task } from '../db/models';
import TaskCard from '../components/TaskCard';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import StandupGate from '../components/StandupGate';
import StandupSummary from '../components/StandupSummary';
import QuickAdd from '../components/QuickAdd';
import TaskDetail from '../components/TaskDetail';
import DSATimer from '../components/DSATimer';

export default function TodayScreen() {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const todayStr = toDateString();

  // Core reactive data queries
  const counts = useTaskCounts(todayStr);
  const tasks = useTodayTasks(todayStr) || [];
  const workstreams = useWorkstreams() || [];

  // Dialog & panel states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isStandupOpen, setIsStandupOpen] = useState(false);

  // Standup query: tasks planned for previous days that are still unfinished
  const yesterdayTasks = useLiveQuery(async () => {
    const allTasks = await db.tasks.toArray();
    return allTasks.filter(
      (t) =>
        t.plannedFor !== null &&
        t.plannedFor < todayStr &&
        t.status !== TaskStatus.DONE &&
        t.status !== TaskStatus.DEFERRED &&
        t.status !== TaskStatus.BACKLOG
    );
  }, [todayStr]) || [];

  // Reflection query: yesterday's completed tasks count
  const yesterdayCompletedCount = useLiveQuery(async () => {
    const yesterdayStr = getYesterday();
    const tasksArr = await db.tasks
      .where('plannedFor')
      .equals(yesterdayStr)
      .toArray();
    return tasksArr.filter((t) => t.status === TaskStatus.DONE).length;
  }, [todayStr]) || 0;

  // Check if Standup Gate needs to be shown
  useEffect(() => {
    const isCompleted = localStorage.getItem(`tracker_standup_completed_${todayStr}`);
    
    // Show gate if standup is not completed yet
    if (isCompleted !== 'true') {
      setIsStandupOpen(true);
    } else {
      setIsStandupOpen(false);
    }
  }, [todayStr]);

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

  // Derived Task Groupings
  const activeTasks = tasks.filter((t) => t.status !== TaskStatus.DONE);
  const doneTasks = tasks.filter((t) => t.status === TaskStatus.DONE);

  // 1. Priority Focus: Critical & High Priority active tasks
  const priorityTasks = activeTasks.filter(
    (t) => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH
  );

  // 2. Carryovers: Rolled over active tasks that aren't critical/high priority
  const carryoverTasks = activeTasks.filter(
    (t) =>
      t.status === TaskStatus.ROLLED_OVER &&
      t.priority !== TaskPriority.CRITICAL &&
      t.priority !== TaskPriority.HIGH
  );

  // 3. Today's Plan: Normal priority active planned/in_progress tasks
  const normalActiveTasks = activeTasks.filter(
    (t) =>
      t.status !== TaskStatus.ROLLED_OVER &&
      t.priority !== TaskPriority.CRITICAL &&
      t.priority !== TaskPriority.HIGH
  );

  // Check if DSA timer is needed (any active today's task is in DSA workstream)
  const dsaWorkstream = workstreams.find((ws) => ws.name.toLowerCase() === 'dsa');
  const hasDsaTask = activeTasks.some((t) => t.workstreamId === dsaWorkstream?.id);

  const hasData = counts && counts.total > 0;

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Date Header */}
      <div className="screen-date-header flex items-center justify-between mb-4">
        <div>
          <h1>{dayName}</h1>
          <p className="section-header">{dateStr}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsQuickAddOpen(true)}
          style={{ padding: 'var(--space-2) var(--space-4)', borderWidth: '2px', height: '40px' }}
        >
          <Plus size={16} strokeWidth={3} />
          Add Task
        </button>
      </div>

      {/* Progress Summary */}
      {hasData && counts && (
        <div className="mb-4">
          <ProgressBar done={counts.done} total={counts.total} />
        </div>
      )}

      {/* Standup Reflection Summary (Collapsible) */}
      <StandupSummary
        completedCount={yesterdayCompletedCount}
        rolledOverTasks={tasks.filter((t) => t.status === TaskStatus.ROLLED_OVER)}
      />

      {/* DSA Pomodoro Timer focus card */}
      {hasDsaTask && <DSATimer />}

      {/* Main Execution View */}
      {!hasData ? (
        <EmptyState
          title="No tasks planned for today"
          description="Add your first task to start planning your day. Your priorities, carryovers, and progress will appear here."
          Icon={CalendarDays}
          actionLabel="Add Today's Task"
          onAction={() => setIsQuickAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Section 1: Priority Focus */}
          {priorityTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="section-header" style={{ fontSize: 'var(--text-xs)' }}>
                🔥 Priority Focus
              </span>
              <div className="flex flex-col gap-2">
                {priorityTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    workstream={workstreams.find((ws) => ws.id === task.workstreamId)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDefer={() => handleDefer(task)}
                    onDelete={() => handleDelete(task)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Carryovers */}
          {carryoverTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="section-header" style={{ fontSize: 'var(--text-xs)' }}>
                🔄 Carryover Debt
              </span>
              <div className="flex flex-col gap-2">
                {carryoverTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    workstream={workstreams.find((ws) => ws.id === task.workstreamId)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDefer={() => handleDefer(task)}
                    onDelete={() => handleDelete(task)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Today's Plan */}
          {normalActiveTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="section-header" style={{ fontSize: 'var(--text-xs)' }}>
                ⚡ Active Targets
              </span>
              <div className="flex flex-col gap-2">
                {normalActiveTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    workstream={workstreams.find((ws) => ws.id === task.workstreamId)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDefer={() => handleDefer(task)}
                    onDelete={() => handleDelete(task)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Completed today */}
          {doneTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="section-header" style={{ fontSize: 'var(--text-xs)' }}>
                ✅ Completed Today
              </span>
              <div className="flex flex-col gap-2">
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    workstream={workstreams.find((ws) => ws.id === task.workstreamId)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDelete(task)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Quick Add dialog */}
      <QuickAdd
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialPlannedFor={todayStr}
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

      {/* Daily Standup Gate Overlay */}
      <StandupGate
        isOpen={isStandupOpen}
        yesterdayTasks={yesterdayTasks}
        onClose={() => setIsStandupOpen(false)}
      />
    </div>
  );
}
