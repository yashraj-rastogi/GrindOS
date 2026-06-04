import { Bell, CheckCheck, Clock, Zap, BookOpen, RotateCcw } from 'lucide-react';
import { useNotificationLogs, useUnreadNotificationCount } from '../db/hooks';
import { markNotificationRead, markAllNotificationsRead } from '../db/operations';
import type { NotificationLog } from '../db/models';
import './NotificationCenter.css';

const KIND_CONFIG: Record<string, { icon: typeof Bell; label: string; color: string }> = {
  standup: { icon: Zap, label: 'Standup', color: '#F59E0B' },
  end_of_day: { icon: BookOpen, label: 'EOD', color: '#8B5CF6' },
  weekly_review: { icon: RotateCcw, label: 'Review', color: '#3B82F6' },
  rollover: { icon: Clock, label: 'Rollover', color: '#EF4444' },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDate(logs: NotificationLog[]): { dateLabel: string; entries: NotificationLog[] }[] {
  const groups = new Map<string, NotificationLog[]>();

  for (const log of logs) {
    const d = new Date(log.firedAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(log);
  }

  return Array.from(groups.entries()).map(([dateLabel, entries]) => ({
    dateLabel,
    entries,
  }));
}

export default function NotificationCenter() {
  const logs = useNotificationLogs(100);
  const unreadCount = useUnreadNotificationCount();

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const grouped = logs ? groupByDate(logs) : [];

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Header */}
      <div className="screen-date-header flex items-center justify-between">
        <div>
          <h1>Notifications</h1>
          <p className="section-header">Activity & Alerts</p>
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={handleMarkAllRead}
            style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)', height: '34px' }}
          >
            <CheckCheck size={14} strokeWidth={2.5} />
            Mark All Read
          </button>
        )}
      </div>

      {/* Unread Counter */}
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="notif-unread-banner">
          <Bell size={14} strokeWidth={2.5} />
          <span>
            <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Notification List */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 gap-3" style={{ minHeight: '300px' }}>
          <Bell size={40} strokeWidth={2} style={{ color: 'var(--color-text-muted)' }} />
          <h3 style={{ fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
            No Notifications
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', maxWidth: '360px' }}>
            Notifications from your standup reminders, EOD reflections, and weekly reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {grouped.map((group) => (
            <div key={group.dateLabel} className="notif-group">
              <div className="notif-group-header">
                <span className="notif-group-label">{group.dateLabel}</span>
              </div>
              {group.entries.map((log) => {
                const config = KIND_CONFIG[log.kind] || KIND_CONFIG.standup;
                const IconComponent = config.icon;
                const isUnread = log.readAt === null;

                return (
                  <div
                    key={log.id}
                    className={`notif-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => isUnread && handleMarkRead(log.id)}
                  >
                    <div
                      className="notif-icon"
                      style={{ backgroundColor: config.color }}
                    >
                      <IconComponent size={14} strokeWidth={2.5} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">
                        {log.title}
                        <span className="notif-kind-badge" style={{ borderColor: config.color, color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                      <p className="notif-message">{log.message}</p>
                      <span className="notif-time">{formatTimestamp(log.firedAt)}</span>
                    </div>
                    {isUnread && <div className="notif-unread-dot" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
