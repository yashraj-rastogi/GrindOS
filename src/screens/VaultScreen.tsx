import { useState } from 'react';
import { Archive, Plus, Code, Sparkles } from 'lucide-react';
import { useBacklogTasks, useWorkstreams } from '../db/hooks';
import { transitionTask, deleteTask } from '../db/operations';
import { TaskStatus } from '../db/models';
import type { Task } from '../db/models';
import { toDateString } from '../utils/dates';
import DSAChecklist from '../components/DSAChecklist';
import TaskCard from '../components/TaskCard';
import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import EmptyState from '../components/EmptyState';
import QuickAdd from '../components/QuickAdd';
import TaskDetail from '../components/TaskDetail';
import './PlaceholderScreen.css';
import './VaultTabs.css';

type VaultTab = 'vault' | 'dsa';

export default function VaultScreen() {
  const [activeTab, setActiveTab] = useState<VaultTab>('vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkstreamId, setSelectedWorkstreamId] = useState<string | null>(null);

  // Modal / Drawer states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Reactive DB queries
  const workstreams = useWorkstreams() || [];
  const backlogTasks = useBacklogTasks({
    workstreamId: selectedWorkstreamId || undefined,
    search: searchQuery || undefined,
  }) || [];

  const count = backlogTasks.length;
  const hasData = count > 0 || searchQuery || selectedWorkstreamId;

  // Handlers
  const handleToggleComplete = async (task: Task) => {
    // Toggling a backlog task from vault marks it done immediately, or promotes it
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.BACKLOG : TaskStatus.DONE;
    try {
      await transitionTask(task.id, newStatus);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handlePromoteToToday = async (task: Task) => {
    try {
      const todayStr = toDateString();
      await transitionTask(task.id, TaskStatus.PLANNED, {
        plannedFor: todayStr,
      });
    } catch (err) {
      console.error('Failed to promote task:', err);
    }
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm('Delete this task from Vault?')) {
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

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Date Header */}
      <div className="screen-date-header flex items-center justify-between">
        <div>
          <h1>The Vault</h1>
          <p className="section-header">Backlog & Checklists</p>
        </div>
        {activeTab === 'vault' && (
          <button
            className="btn btn-primary"
            onClick={() => setIsQuickAddOpen(true)}
            style={{ padding: 'var(--space-2) var(--space-4)', borderWidth: '2px', height: '40px' }}
          >
            <Plus size={16} strokeWidth={3} />
            Add to Vault
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="vault-tabs mb-4">
        <button
          className={`vault-tab ${activeTab === 'vault' ? 'active' : ''}`}
          onClick={() => setActiveTab('vault')}
        >
          <Archive size={16} strokeWidth={2.5} />
          <span>Vault</span>
          {count > 0 && activeTab === 'vault' && <span className="tab-count">{count}</span>}
        </button>
        <button
          className={`vault-tab ${activeTab === 'dsa' ? 'active' : ''}`}
          onClick={() => setActiveTab('dsa')}
        >
          <Code size={16} strokeWidth={2.5} />
          <span>DSA Checklist</span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'vault' && (
        /* Dark Mode Inversion Wrapper per design.md and Phase 4 specs */
        <div
          data-theme="dark"
          className="bg-grid"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            color: 'var(--color-text-primary)',
            border: '3px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            minHeight: '480px',
            padding: 'var(--space-4) var(--space-4) var(--space-6)',
            transition: 'all var(--transition-normal)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(232, 226, 219, 0.15)' }}>
              <span className="section-header" style={{ color: 'var(--color-accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={14} /> Backlog Ideas Vault
              </span>
              <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                ITEMS: {count}
              </span>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-2">
              <SearchBar placeholder="Search backlog..." onSearch={setSearchQuery} />
              <FilterChips
                workstreams={workstreams}
                selectedWorkstreamId={selectedWorkstreamId}
                onSelectWorkstream={setSelectedWorkstreamId}
              />
            </div>
          </div>

          {/* Backlog List or Empty State */}
          {!hasData && count === 0 ? (
            <EmptyState
              title="Vault is empty"
              description="Store future ideas, low-priority tasks, and work you want to remember but don't need to act on yet."
              Icon={Archive}
              actionLabel="Add First Idea"
              onAction={() => setIsQuickAddOpen(true)}
            />
          ) : count === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                No ideas found matching your active search filters.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '500px' }}>
              {backlogTasks.map((task) => (
                <div key={task.id} className="relative flex flex-col gap-1">
                  <TaskCard
                    task={task}
                    workstream={workstreams.find((ws) => ws.id === task.workstreamId)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDelete(task)}
                  />
                  {/* Promote Overlay Button inside Vault */}
                  {task.status !== TaskStatus.DONE && (
                    <button
                      onClick={() => handlePromoteToToday(task)}
                      className="btn btn-primary animate-scale-in"
                      style={{
                        position: 'absolute',
                        right: '110px',
                        top: '12px',
                        padding: 'var(--space-1) var(--space-3)',
                        fontSize: '10px',
                        borderWidth: '2px',
                        boxShadow: '2px 2px 0px var(--color-border)',
                      }}
                      title="Plan for Today"
                    >
                      Promote Today ↗
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'dsa' && <DSAChecklist />}

      {/* Floating Quick Add (Creates Backlog tasks when inside Vault) */}
      <QuickAdd
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialPlannedFor={null}
        initialStatus={TaskStatus.BACKLOG}
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
