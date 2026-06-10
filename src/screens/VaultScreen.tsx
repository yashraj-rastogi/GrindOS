import { useState } from 'react';
import { BarChart3, Code, Flame, TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import {
  useProgressStats,
  useWeeklyHeatmap,
  useWorkstreamBreakdown,
  useStreakCount,
  useAvgDailyTasks,
  useUserConfig,
} from '../db/hooks';
import DSAChecklist from '../components/DSAChecklist';
import './VaultScreen.css';

type VaultTab = 'progress' | 'dsa';

export default function VaultScreen() {
  const [activeTab, setActiveTab] = useState<VaultTab>('progress');

  // Reactive data
  const config = useUserConfig();
  const stats = useProgressStats();
  const heatmap = useWeeklyHeatmap();
  const breakdown = useWorkstreamBreakdown();
  const streak = useStreakCount();
  const avgDaily = useAvgDailyTasks();

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Header */}
      <div className="screen-date-header flex items-center justify-between">
        <div>
          <h1>The Vault</h1>
          <p className="section-header">Progress & Checklists</p>
        </div>
      </div>

      {/* Tab switcher */}
      {config?.customChecklistJson !== 'skip' && (
        <div className="vault-tabs mb-4">
          <button
            className={`vault-tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <BarChart3 size={16} strokeWidth={2.5} />
            <span>Progress</span>
          </button>
          <button
            className={`vault-tab ${activeTab === 'dsa' ? 'active' : ''}`}
            onClick={() => setActiveTab('dsa')}
          >
            <Code size={16} strokeWidth={2.5} />
            <span>{config?.goalCategory || 'DSA'} Checklist</span>
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'progress' && (
        <div className="vault-dashboard">
          {/* Challenge Banner */}
          {config && (
            <div className="vault-challenge-banner">
              <div className="vault-challenge-info">
                <strong>
                  <Target size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                  {config.goalDescription || 'My Challenge'}
                </strong>
                <span>
                  {config.challengeWeeks}-week challenge • Started{' '}
                  {formatDateShort(config.challengeStartDate)}
                </span>
              </div>
              {stats && (
                <span
                  className="mono"
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: 'var(--color-accent)',
                  }}
                >
                  WEEK {stats.currentWeek}/{stats.challengeWeeks}
                </span>
              )}
            </div>
          )}

          {/* Stat Cards Row */}
          <div className="vault-stat-row">
            {/* Completion Rate */}
            <div className="vault-stat-card accent">
              <span className="vault-stat-label">Completion</span>
              <span className="vault-stat-value">{stats?.completionRate ?? 0}%</span>
              <span className="vault-stat-sub">
                {stats?.done ?? 0}/{stats?.total ?? 0} tasks
              </span>
            </div>

            {/* Streak */}
            <div className="vault-stat-card">
              <span className="vault-stat-label">
                <Flame size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Streak
              </span>
              <span className="vault-stat-value">{streak ?? 0}</span>
              <span className="vault-stat-sub">days in a row</span>
            </div>

            {/* Avg Daily */}
            <div className="vault-stat-card">
              <span className="vault-stat-label">
                <Zap size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Daily Avg
              </span>
              <span className="vault-stat-value">{avgDaily?.avgPerDay ?? 0}</span>
              <span className="vault-stat-sub">tasks/day</span>
            </div>

            {/* Total Completed */}
            <div className="vault-stat-card">
              <span className="vault-stat-label">
                <TrendingUp size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Total
              </span>
              <span className="vault-stat-value">{avgDaily?.totalCompleted ?? 0}</span>
              <span className="vault-stat-sub">{avgDaily?.daysPassed ?? 0} days elapsed</span>
            </div>
          </div>

          {/* Weekly Heatmap */}
          <div className="vault-heatmap">
            <div className="vault-heatmap-title">
              <Calendar size={14} />
              Weekly Completion Heatmap
            </div>
            <div className="vault-heatmap-grid">
              {(heatmap ?? []).map((week) => {
                const isCurrent = stats ? week.weekNum === stats.currentWeek : false;
                const isFuture = stats ? week.weekNum > stats.currentWeek : false;
                return (
                  <div
                    key={week.weekNum}
                    className={`vault-heatmap-cell ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
                    style={{ '--fill-height': `${week.percent}%` } as React.CSSProperties}
                  >
                    <span className="heatmap-week-label">W{week.weekNum}</span>
                    <span className="heatmap-percent">
                      {isFuture ? '—' : `${week.percent}%`}
                    </span>
                    <span className="heatmap-tasks">
                      {isFuture
                        ? formatDateShort(week.start)
                        : `${week.done}/${week.total}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workstream Breakdown */}
          {breakdown && breakdown.length > 0 && (
            <div className="vault-breakdown">
              <div className="vault-breakdown-title">
                <BarChart3 size={14} />
                Workstream Breakdown
              </div>
              {breakdown.map((ws) => (
                <div key={ws.id} className="vault-breakdown-item">
                  <div
                    className="breakdown-color"
                    style={{ backgroundColor: ws.color }}
                  />
                  <div className="breakdown-info">
                    <span className="breakdown-name">{ws.name}</span>
                    <span className="breakdown-count">
                      {ws.done}/{ws.total} done
                    </span>
                  </div>
                  <div className="breakdown-bar-track">
                    <div
                      className="breakdown-bar-fill"
                      style={{
                        width: `${ws.percent}%`,
                        backgroundColor: ws.color,
                      }}
                    />
                  </div>
                  <span className="breakdown-percent">{ws.percent}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty state when no tasks exist at all */}
          {stats && stats.total === 0 && (
            <div
              className="card flex flex-col items-center justify-center text-center p-8 gap-3"
              style={{ minHeight: '200px' }}
            >
              <BarChart3
                size={40}
                strokeWidth={2}
                style={{ color: 'var(--color-text-muted)' }}
              />
              <h3
                style={{
                  fontSize: 'var(--text-base)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                No Data Yet
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  maxWidth: '360px',
                }}
              >
                Start completing tasks in the Today and Week views. Your
                progress will be tracked here across your{' '}
                {config?.challengeWeeks ?? 7}-week challenge.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dsa' && config?.customChecklistJson !== 'skip' && (
        <div className="vault-dsa-wrapper">
          <DSAChecklist />
        </div>
      )}
    </div>
  );
}
