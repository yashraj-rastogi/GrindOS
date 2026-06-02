import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Briefcase, Trash2, Download, Trash, History, Bell, ShieldAlert, Monitor, UserPlus, Eye,
  CalendarClock, Plus, Code, Repeat
} from 'lucide-react';
import { db } from '../db/database';
import { useWorkstreams, useReviews, useWeeklyTemplates } from '../db/hooks';
import { addWorkstream, updateWorkstream, deleteWorkstream, addTemplate, updateTemplate, deleteTemplate } from '../db/operations';
import { checkAndApplyTemplates } from '../domain/templateEngine';
import { TaskPriority } from '../db/models';
import type { Review } from '../db/models';
import { useTheme } from '../contexts/ThemeContext';
import { requestNotificationPermission } from '../domain/notifications';
import './SettingsScreen.css';

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#14B8A6', // Teal
];

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();

  // Queries
  const workstreams = useWorkstreams() || [];
  const reviews = useReviews() || [];
  const templates = useWeeklyTemplates() || [];
  
  // Notification Configs
  const notificationConfigs = useLiveQuery(() => db.notifications.toArray()) || [];

  // Form states
  const [wsName, setWsName] = useState('');
  const [wsColor, setWsColor] = useState(PRESET_COLORS[0]);
  const [isSubmittingWs, setIsSubmittingWs] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  // Template form states
  const [tplTitle, setTplTitle] = useState('');
  const [tplWorkstreamId, setTplWorkstreamId] = useState('');
  const [tplPriority, setTplPriority] = useState<TaskPriority>(TaskPriority.NONE);
  const [tplDays, setTplDays] = useState<number[]>([]);
  const [tplDaily, setTplDaily] = useState(false);
  const [tplDsaLink, setTplDsaLink] = useState(false);
  const [isSubmittingTpl, setIsSubmittingTpl] = useState(false);

  // Popup modal for reviewing past reflections
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Auto-select first workstream for template form
  useEffect(() => {
    if (workstreams.length > 0 && !tplWorkstreamId) {
      setTplWorkstreamId(workstreams[0].id);
    }
  }, [workstreams, tplWorkstreamId]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
    if (granted) {
      alert('Notification permission granted! Schedulers are now active.');
    } else {
      alert('Notification permission was denied. Please enable them in browser settings.');
    }
  };

  const handleToggleWorkstream = async (id: string, active: boolean) => {
    try {
      await updateWorkstream(id, { active: !active });
    } catch (err) {
      console.error('Failed to toggle workstream:', err);
    }
  };

  const handleDeleteWorkstream = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom workstream?')) {
      try {
        await deleteWorkstream(id);
      } catch (err) {
        console.error('Failed to delete workstream:', err);
        alert(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  const handleCreateWorkstream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    try {
      setIsSubmittingWs(true);
      await addWorkstream({
        name: wsName.trim(),
        color: wsColor,
      });
      setWsName('');
      setWsColor(PRESET_COLORS[0]);
    } catch (err) {
      console.error('Failed to add workstream:', err);
    } finally {
      setIsSubmittingWs(false);
    }
  };

  const handleToggleNotification = async (id: string, enabled: boolean) => {
    try {
      await db.notifications.update(id, { enabled: !enabled });
    } catch (err) {
      console.error('Failed to toggle notification:', err);
    }
  };

  const handleNotificationTimeChange = async (id: string, schedule: string) => {
    try {
      await db.notifications.update(id, { schedule });
    } catch (err) {
      console.error('Failed to update notification schedule:', err);
    }
  };

  const handleExportData = async () => {
    try {
      const tasks = await db.tasks.toArray();
      const reviewsData = await db.reviews.toArray();
      const workstreamsData = await db.workstreams.toArray();
      const dsaProgress = await db.dsaProgress.toArray();
      const notifications = await db.notifications.toArray();

      const backupObj = {
        tasks,
        reviews: reviewsData,
        workstreams: workstreamsData,
        dsaProgress,
        notifications,
        exportedAt: Date.now(),
        version: 1,
      };

      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleClearWorkspace = async () => {
    if (window.confirm('⚠️ WARNING: This will permanently delete all your custom tasks, reviews, progress, and settings! Are you absolutely sure?')) {
      if (window.confirm('Type OK in the next popup to confirm deletion.')) {
        try {
          await db.transaction('rw', [db.tasks, db.reviews, db.workstreams, db.dsaProgress, db.notifications], async () => {
            await db.tasks.clear();
            await db.reviews.clear();
            await db.workstreams.clear();
            await db.dsaProgress.clear();
            await db.notifications.clear();
          });
          localStorage.clear();
          alert('Workspace reset successfully. Reloading.');
          window.location.reload();
        } catch (err) {
          console.error('Failed to clear workspace:', err);
        }
      }
    }
  };

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Date Header */}
      <div className="screen-date-header">
        <h1>Settings</h1>
        <p className="section-header">Preferences & Configuration</p>
      </div>

      <div className="settings-grid">
        {/* 1. Theme Configuration */}
        <div className="card settings-card">
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <Monitor size={18} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <h2 style={{ fontSize: 'var(--text-md)', textTransform: 'uppercase' }}>Theme preferences</h2>
          </div>
          <div className="settings-item-row">
            <div>
              <strong style={{ fontSize: 'var(--text-sm)' }}>Brutalist Color Swap</strong>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Toggle between light graph paper and dark inverted vault screens.
              </p>
            </div>
            <button className="btn btn-primary" onClick={toggleTheme} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
              Theme: {theme.toUpperCase()}
            </button>
          </div>
        </div>

        {/* 2. Weekly Templates (Auto-Schedule) */}
        <div className="card settings-card">
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <CalendarClock size={18} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <h2 style={{ fontSize: 'var(--text-md)', textTransform: 'uppercase' }}>Weekly Templates</h2>
          </div>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            Define your ideal week once. Tracker auto-generates these tasks every Monday so your schedule is ready when you open the app.
          </p>

          {/* Existing templates list */}
          <div className="flex flex-col gap-1">
            <span className="picker-label">Active Templates ({templates.length})</span>
            {templates.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                No templates defined yet. Add your first recurring task below!
              </p>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="template-item">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          backgroundColor: workstreams.find((ws) => ws.id === tpl.workstreamId)?.color ?? '#999',
                          display: 'inline-block', border: '1px solid var(--color-border)',
                        }}
                      />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                        {tpl.dsaAutoLink ? '🔗 DSA Auto-Link' : tpl.title}
                      </span>
                      {tpl.dsaAutoLink && (
                        <span className="chip mono" style={{ fontSize: '8px', padding: '1px 4px', borderColor: 'var(--color-success)', color: 'var(--color-success)', borderWidth: '1px' }}>
                          AUTO
                        </span>
                      )}
                    </div>
                    <div className="template-days">
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <span key={i} className={`template-day-dot ${tpl.daily || tpl.daysOfWeek.includes(i + 1) ? 'active' : ''}`}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={tpl.active}
                      onChange={async () => {
                        try {
                          await updateTemplate(tpl.id, { active: !tpl.active });
                          await checkAndApplyTemplates(true);
                        } catch (err) {
                          console.error('Failed to toggle template:', err);
                        }
                      }}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
                      title="Toggle active"
                    />
                    <button
                      className="btn-icon"
                      onClick={() => {
                        if (window.confirm('Delete this template?')) deleteTemplate(tpl.id);
                      }}
                      style={{ color: 'var(--color-danger)', width: '28px', height: '28px' }}
                      title="Delete Template"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add template form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!tplTitle.trim() && !tplDsaLink) return;
              if (!tplWorkstreamId) return;
              if (!tplDaily && tplDays.length === 0) return;
              try {
                setIsSubmittingTpl(true);
                await addTemplate({
                  title: tplDsaLink ? 'DSA Auto-Link' : tplTitle.trim(),
                  workstreamId: tplWorkstreamId,
                  priority: tplPriority,
                  daysOfWeek: tplDays,
                  daily: tplDaily,
                  dsaAutoLink: tplDsaLink,
                });
                setTplTitle('');
                setTplPriority(TaskPriority.NONE);
                setTplDays([]);
                setTplDaily(false);
                setTplDsaLink(false);

                // Immediately generate tasks for the current week!
                await checkAndApplyTemplates(true);
              } catch (err) {
                console.error('Failed to add template:', err);
              } finally {
                setIsSubmittingTpl(false);
              }
            }}
            className="flex flex-col gap-3 mt-2 pt-3 border-t bg-dots p-3"
            style={{ borderColor: 'rgba(26,59,99,0.1)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-border)' }}
          >
            <span className="picker-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', margin: 0 }}>
              <Plus size={12} /> Add Recurring Template
            </span>

            {/* DSA auto-link toggle */}
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={tplDsaLink}
                onChange={() => setTplDsaLink(!tplDsaLink)}
                style={{ width: '14px', height: '14px', accentColor: 'var(--color-accent)' }}
              />
              <Code size={12} />
              <span>DSA Auto-Link (auto-picks next uncompleted topic)</span>
            </label>

            {/* Title (hidden if DSA auto-link) */}
            {!tplDsaLink && (
              <input
                type="text"
                className="input"
                placeholder="e.g. Morning DSA Practice, Gym Session..."
                value={tplTitle}
                onChange={(e) => setTplTitle(e.target.value)}
                required={!tplDsaLink}
                disabled={isSubmittingTpl}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              />
            )}

            {/* Workstream Picker */}
            <div>
              <span className="picker-label">Workstream</span>
              <div className="chips-scroll">
                {workstreams.filter((ws) => ws.active).map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    className={`chip picker-chip ${tplWorkstreamId === ws.id ? 'selected' : ''}`}
                    onClick={() => setTplWorkstreamId(ws.id)}
                    disabled={isSubmittingTpl}
                    style={{ backgroundColor: tplWorkstreamId === ws.id ? 'var(--color-accent)' : undefined, fontSize: '11px', padding: '2px 8px' }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ws.color, display: 'inline-block', marginRight: '4px', border: '1px solid var(--color-border)' }} />
                    {ws.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <span className="picker-label">Priority</span>
              <div className="chips-scroll">
                {(Object.keys(TaskPriority) as Array<keyof typeof TaskPriority>).map((key) => {
                  const val = TaskPriority[key];
                  return (
                    <button
                      key={val}
                      type="button"
                      className={`chip picker-chip ${tplPriority === val ? 'selected' : ''}`}
                      onClick={() => setTplPriority(val)}
                      disabled={isSubmittingTpl}
                      style={{ backgroundColor: tplPriority === val ? 'var(--color-accent)' : undefined, fontSize: '11px', padding: '2px 8px' }}
                    >
                      {val === TaskPriority.NONE ? 'NONE' : val.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day-of-week selector */}
            <div>
              <span className="picker-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                Schedule
                <label className="toggle-row" style={{ marginLeft: 'auto', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={tplDaily}
                    onChange={() => setTplDaily(!tplDaily)}
                    style={{ width: '14px', height: '14px', accentColor: 'var(--color-accent)' }}
                  />
                  <Repeat size={10} />
                  Daily
                </label>
              </span>
              {!tplDaily && (
                <div className="day-picker">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label, i) => {
                    const dayNum = i + 1; // 1=Mon, 7=Sun
                    const isSelected = tplDays.includes(dayNum);
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        className={`day-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setTplDays((prev) =>
                            isSelected ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
                          );
                        }}
                        disabled={isSubmittingTpl}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary mt-1"
              disabled={isSubmittingTpl || (!tplDsaLink && !tplTitle.trim()) || (!tplDaily && tplDays.length === 0)}
              style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)', width: '100%' }}
            >
              Add Template
            </button>
          </form>
        </div>

        {/* 3. Workstream Manager */}
        <div className="card settings-card">
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <Briefcase size={18} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <h2 style={{ fontSize: 'var(--text-md)', textTransform: 'uppercase' }}>Workstream Manager</h2>
          </div>

          <div className="flex flex-col gap-2">
            <span className="picker-label">Active Workstreams</span>
            {workstreams.map((ws) => (
              <div key={ws.id} className="settings-item-row">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: ws.color,
                      display: 'inline-block',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                    {ws.name} {ws.isDefault && <span style={{ fontSize: '9px', opacity: 0.5 }}>(DEFAULT)</span>}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Active Toggle Switch */}
                  <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 'var(--text-xs)' }}>
                    <input
                      type="checkbox"
                      checked={ws.active}
                      onChange={() => handleToggleWorkstream(ws.id, ws.active)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
                    />
                    Active
                  </label>

                  {/* Delete button (only custom ones) */}
                  {!ws.isDefault && (
                    <button
                      className="btn-icon"
                      onClick={() => handleDeleteWorkstream(ws.id)}
                      style={{ color: 'var(--color-danger)', width: '28px', height: '28px' }}
                      title="Delete Workstream"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add custom workstream form */}
          <form onSubmit={handleCreateWorkstream} className="flex flex-col gap-3 mt-3 pt-3 border-t bg-dots p-3" style={{ borderColor: 'rgba(26,59,99,0.1)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-border)' }}>
            <span className="picker-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', margin: 0 }}>
              <UserPlus size={12} /> Add Custom Workstream
            </span>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                className="input"
                placeholder="e.g. Health, Writing..."
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                required
                disabled={isSubmittingWs}
                style={{ height: '36px', fontSize: 'var(--text-xs)' }}
              />
              <div>
                <span className="picker-label">Color Preset</span>
                <div className="color-dot-picker">
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`color-dot ${wsColor === color ? 'active' : ''}`}
                      onClick={() => setWsColor(color)}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary mt-1"
                disabled={isSubmittingWs || !wsName.trim()}
                style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)', width: '100%' }}
              >
                Add Workstream
              </button>
            </div>
          </form>
        </div>

        {/* 3. Browser Local Notifications */}
        <div className="card settings-card">
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <Bell size={18} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <h2 style={{ fontSize: 'var(--text-md)', textTransform: 'uppercase' }}>PWA Local Notifications</h2>
          </div>

          <div className="settings-item-row">
            <div>
              <strong style={{ fontSize: 'var(--text-sm)' }}>Browser Permission Status</strong>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Notifications require browser approval to execute reminders offline.
              </p>
            </div>
            <button
              className={`btn ${notifPermission === 'granted' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleRequestPermission}
              disabled={notifPermission === 'granted'}
              style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}
            >
              {notifPermission === 'granted' ? 'PERMITTED ✓' : 'ENABLE REMINDERS'}
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="picker-label">Notification Schedulers</span>
            {notificationConfigs.map((config) => (
              <div key={config.id} className="settings-item-row">
                <div className="flex flex-col flex-1">
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600', textTransform: 'capitalize' }}>
                    {config.kind.replace('_', ' ')}
                  </span>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {config.message}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {/* Schedule time selector for standup/EOD (e.g. HH:MM) */}
                  {config.kind !== 'weekly_review' ? (
                    <input
                      type="time"
                      className="input"
                      value={config.schedule}
                      onChange={(e) => handleNotificationTimeChange(config.id, e.target.value)}
                      style={{ padding: '4px var(--space-2)', height: '28px', fontSize: '11px', width: '80px', borderWidth: '1px' }}
                    />
                  ) : (
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-elevated)', padding: '2px 6px', border: '1px solid var(--color-border)' }}>
                      SUN 19:00
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => handleToggleNotification(config.id, config.enabled)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
                    title="Toggle Notification"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Archived Reviews */}
        <div className="card settings-card">
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <History size={18} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <h2 style={{ fontSize: 'var(--text-md)', textTransform: 'uppercase' }}>Reflection Archive</h2>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                No completed reviews found. Finish your first weekly stepper!
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="archive-item">
                  <div className="flex items-center justify-between">
                    <span className="mono" style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                      Week {r.weekStart} to {r.weekEnd}
                    </span>
                    <button
                      className="btn btn-secondary flex items-center gap-1"
                      onClick={() => setSelectedReview(r)}
                      style={{ padding: '2px 8px', fontSize: '10px', borderWidth: '1px' }}
                    >
                      <Eye size={10} /> View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. System Management */}
        <div className="card settings-card" style={{ borderColor: 'var(--color-danger)' }}>
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--color-danger)' }}>
            <ShieldAlert size={18} strokeWidth={2.5} style={{ color: 'var(--color-danger)' }} />
            <h2 style={{ fontSize: 'var(--text-md)', textTransform: 'uppercase', color: 'var(--color-danger)' }}>System Controls</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="settings-item-row">
              <div>
                <strong style={{ fontSize: 'var(--text-sm)' }}>JSON Workspace Backup</strong>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Download all tasks, settings, reviews, and progress as a local backup.
                </p>
              </div>
              <button className="btn btn-secondary" onClick={handleExportData} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
                <Download size={14} /> Export Backup
              </button>
            </div>
            <div className="settings-item-row" style={{ borderBottom: 'none' }}>
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>Clear Local Storage</strong>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Permanently delete everything and restart the seeding loop.
                </p>
              </div>
              <button className="btn btn-danger" onClick={handleClearWorkspace} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
                <Trash size={14} /> Reset Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drill Down Past Review Modal Popup Overlay */}
      {selectedReview && (
        <div className="quick-add-overlay" onClick={() => setSelectedReview(null)}>
          <div className="quick-add-modal animate-scale-in" style={{ width: '480px', maxHeight: '80dvh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between border-b pb-2 mb-3" style={{ borderColor: 'var(--color-border)' }}>
              <span className="section-header" style={{ margin: 0 }}>Reflection Log</span>
              <button className="btn-icon" onClick={() => setSelectedReview(null)}>×</button>
            </div>

            <div className="flex flex-col gap-4" style={{ fontSize: 'var(--text-sm)' }}>
              <div>
                <span className="picker-label">Week Interval</span>
                <p className="mono font-bold" style={{ fontSize: 'var(--text-xs)' }}>
                  {selectedReview.weekStart} to {selectedReview.weekEnd}
                </p>
              </div>

              {selectedReview.wins && selectedReview.wins.length > 0 && (
                <div>
                  <span className="picker-label" style={{ color: 'var(--color-success)' }}>Wins logged</span>
                  <div className="card-flat bg-dots p-3" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap' }}>
                    {selectedReview.wins[0]}
                  </div>
                </div>
              )}

              {selectedReview.misses && selectedReview.misses.length > 0 && (
                <div>
                  <span className="picker-label" style={{ color: 'var(--color-danger)' }}>Challenges / Misses</span>
                  <div className="card-flat bg-dots p-3" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap' }}>
                    {selectedReview.misses[0]}
                  </div>
                </div>
              )}

              {selectedReview.nextWeekFocus && (
                <div>
                  <span className="picker-label" style={{ color: 'var(--color-accent)' }}>Next Week focus</span>
                  <div className="card-flat bg-dots p-3" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap' }}>
                    {selectedReview.nextWeekFocus}
                  </div>
                </div>
              )}
            </div>

            <button className="btn btn-secondary mt-4 w-full" onClick={() => setSelectedReview(null)}>
              Close Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
