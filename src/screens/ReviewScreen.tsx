import { useState } from 'react';
import { ArrowRight, ArrowLeft, Trophy, AlertTriangle, Scale, Target, Sparkles, Check } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { getWeekBounds, toDateString } from '../utils/dates';
import { TaskStatus } from '../db/models';
import Confetti from '../components/Confetti';
import './ReviewScreen.css';

export default function ReviewScreen() {
  const { start, end } = getWeekBounds();

  // Stepper State
  const [step, setStep] = useState(1);
  const [winsReflection, setWinsReflection] = useState('');
  const [missesReflection, setMissesReflection] = useState('');
  const [arbitrations, setArbitrations] = useState<Record<string, 'keep' | 'vault' | 'drop'>>({});
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Queries for completed and active unresolved tasks planned for this week
  const weekData = useLiveQuery(async () => {
    const allTasks = await db.tasks.toArray();
    const thisWeekTasks = allTasks.filter(
      (t) => t.plannedFor !== null && t.plannedFor >= start && t.plannedFor <= end
    );

    return {
      completed: thisWeekTasks.filter((t) => t.status === TaskStatus.DONE),
      unresolved: thisWeekTasks.filter((t) => t.status !== TaskStatus.DONE),
    };
  }, [start, end]);

  const completedTasks = weekData?.completed || [];
  const unresolvedTasks = weekData?.unresolved || [];
  
  // Tasks with carryover counts that represent rollover debt
  const debtTasks = unresolvedTasks.filter((t) => t.rolloverCount > 0);

  // Initialize arbitration state when debt tasks load
  const handleSelectArbitration = (taskId: string, action: 'keep' | 'vault' | 'drop') => {
    setArbitrations((prev) => ({ ...prev, [taskId]: action }));
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 5));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCompleteReview = async () => {
    setIsSaving(true);
    try {
      await db.transaction('rw', [db.tasks, db.reviews], async () => {
        // 1. Add Review record to the DB
        await db.reviews.add({
          id: crypto.randomUUID(),
          weekStart: start,
          weekEnd: end,
          summary: `Wins reflection: ${winsReflection}\n\nMisses reflection: ${missesReflection}`,
          wins: [winsReflection],
          misses: [missesReflection],
          debtItems: Object.keys(arbitrations),
          nextWeekFocus,
          completedAt: Date.now(),
          createdAt: Date.now(),
        });

        // 2. Determine target date for rolled over tasks (Next Monday!)
        const nextMondayDate = new Date(end + 'T00:00:00');
        nextMondayDate.setDate(nextMondayDate.getDate() + 1);
        const nextMondayStr = toDateString(nextMondayDate);

        // 3. Process arbitrations & auto-rollover active unarbitrated ones
        for (const task of unresolvedTasks) {
          const action = arbitrations[task.id];

          if (action === 'vault') {
            await db.tasks.update(task.id, {
              status: TaskStatus.BACKLOG,
              plannedFor: null,
              updatedAt: Date.now(),
            });
          } else if (action === 'drop') {
            await db.tasks.update(task.id, {
              status: TaskStatus.DEFERRED,
              plannedFor: null,
              updatedAt: Date.now(),
            });
          } else {
            // 'keep' or auto-rollover default (Option A confirmed)
            await db.tasks.update(task.id, {
              status: task.status === TaskStatus.ROLLED_OVER ? TaskStatus.PLANNED : task.status,
              plannedFor: nextMondayStr,
              updatedAt: Date.now(),
            });
          }
        }
      });

      // Show celebration!
      setIsConfettiActive(true);
      setReviewCompleted(true);
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStepPercentage = () => ((step - 1) / 4) * 100;

  if (reviewCompleted) {
    return (
      <div className="screen-container animate-fade-in-up flex flex-col items-center justify-center text-center p-8 gap-4" style={{ minHeight: '80dvh' }}>
        <Confetti active={isConfettiActive} />
        
        <div
          className="flex items-center justify-center shrink-0 animate-scale-in"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--color-accent)',
            border: 'var(--border-thick)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--color-text-on-accent)',
            margin: '0 auto',
          }}
        >
          <Sparkles size={40} strokeWidth={2.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 style={{ textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
            Weekly Review Completed
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '460px', fontSize: 'var(--text-base)' }}>
            Excellent execution. Your reflections have been archived in Settings, remaining unarbitrated tasks have been rolled over to next Monday, and your planner is clear.
          </p>
        </div>

        <button
          onClick={() => {
            setStep(1);
            setWinsReflection('');
            setMissesReflection('');
            setArbitrations({});
            setNextWeekFocus('');
            setIsConfettiActive(false);
            setReviewCompleted(false);
          }}
          className="btn btn-primary mt-4"
        >
          Restart Stepper (Reset View)
        </button>
      </div>
    );
  }

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Date Header */}
      <div className="screen-date-header">
        <h1>Weekly Review</h1>
        <p className="section-header">Reflect • Reset • Refocus</p>
      </div>

      <div className="stepper-container">
        {/* Progress header */}
        <div className="stepper-header">
          <span className="mono" style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
            STEP {step} OF 5
          </span>
          <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {step === 1 ? 'WINS' : step === 2 ? 'MISSES' : step === 3 ? 'ARBITRATION' : step === 4 ? 'FOCUS' : 'ARCHIVE'}
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="stepper-progress">
          <div className="stepper-progress-fill" style={{ width: `${getStepPercentage()}%` }} />
        </div>

        {/* Stepper Content */}
        {step === 1 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Trophy size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Log Your Wins</h2>
            </div>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Review the tasks you successfully smashed this week. Take a second to appreciate your velocity and write your primary achievements.
            </p>

            {/* List of completed tasks */}
            <div className="flex flex-col gap-2 p-3 card-flat bg-dots" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <span className="picker-label" style={{ color: 'var(--color-muted)', borderBottom: '1px solid rgba(26,50,99,0.1)', paddingBottom: '4px' }}>
                Completed Targets ({completedTasks.length})
              </span>
              {completedTasks.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                  No completed tasks found for this week.
                </p>
              ) : (
                completedTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-1" style={{ fontSize: 'var(--text-xs)' }}>
                    <Check size={12} strokeWidth={3} style={{ color: 'var(--color-success)' }} />
                    <span style={{ fontWeight: '600' }}>{t.title}</span>
                  </div>
                ))
              )}
            </div>

            {/* Input area */}
            <div className="flex flex-col gap-1 mt-auto">
              <label htmlFor="wins-input" className="picker-label">Reflection & Personal Wins</label>
              <textarea
                id="wins-input"
                className="textarea"
                placeholder="What went exceptionally well this week? (e.g. Smashed 4 DSA trees lectures, finished Q3 Work milestones...)"
                value={winsReflection}
                onChange={(e) => setWinsReflection(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} strokeWidth={2.5} style={{ color: 'var(--color-danger)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Analyze Your Misses</h2>
            </div>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Execution requires honesty. What didn't get finished or was deferred? Write down why they stalled to avoid repeating patterns.
            </p>

            {/* List of active carryovers */}
            <div className="flex flex-col gap-2 p-3 card-flat bg-dots" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <span className="picker-label" style={{ color: 'var(--color-muted)', borderBottom: '1px solid rgba(26,50,99,0.1)', paddingBottom: '4px' }}>
                Unresolved Carryovers ({unresolvedTasks.length})
              </span>
              {unresolvedTasks.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                  Zero carryover debt! Incredible execution this week.
                </p>
              ) : (
                unresolvedTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1" style={{ fontSize: 'var(--text-xs)' }}>
                    <span>{t.title}</span>
                    {t.rolloverCount > 0 && (
                      <span className="mono" style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>
                        ×{t.rolloverCount} rolled
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input area */}
            <div className="flex flex-col gap-1 mt-auto">
              <label htmlFor="misses-input" className="picker-label">Challenges & Blockers</label>
              <textarea
                id="misses-input"
                className="textarea"
                placeholder="What held you back? (e.g. Overestimated capacity, got distracted on social, work fire drills...)"
                value={missesReflection}
                onChange={(e) => setMissesReflection(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Scale size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Rescheduled Debt Arbitration</h2>
            </div>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Carryover carryovers build toxic drag. Make deliberate decisions for unresolved tasks. High-debt items ($\ge 2$ rollovers) are marked.
            </p>

            {/* List of items to arbitrate */}
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 p-1" style={{ maxHeight: '240px' }}>
              {debtTasks.length === 0 ? (
                <div className="text-center py-6">
                  <p style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                    No rollover debt active this week. All carryovers are low-debt! You can proceed to next step.
                  </p>
                </div>
              ) : (
                debtTasks.map((t) => {
                  const currentChoice = arbitrations[t.id] || 'keep';
                  return (
                    <div key={t.id} className="arbitration-row">
                      <div className="flex flex-col flex-1 gap-1">
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                          {t.title}
                        </span>
                        <span className="mono" style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                          ROLLOVER COUNT: <strong style={{ color: t.rolloverCount >= 2 ? 'var(--color-danger)' : 'inherit' }}>×{t.rolloverCount}</strong>
                        </span>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="arbitration-buttons">
                        <button
                          type="button"
                          className={`chip arbitration-btn ${currentChoice === 'keep' ? 'active' : ''}`}
                          onClick={() => handleSelectArbitration(t.id, 'keep')}
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          className={`chip arbitration-btn ${currentChoice === 'vault' ? 'active' : ''}`}
                          onClick={() => handleSelectArbitration(t.id, 'vault')}
                        >
                          Vault
                        </button>
                        <button
                          type="button"
                          className={`chip arbitration-btn ${currentChoice === 'drop' ? 'active' : ''}`}
                          onClick={() => handleSelectArbitration(t.id, 'drop')}
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Target size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Plan Next Week's Focus</h2>
            </div>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              A clean slate is coming. What is your singular focus for next week? What milestones are non-negotiable?
            </p>

            <div className="flex flex-col gap-1 mt-4 flex-1">
              <label htmlFor="focus-input" className="picker-label">Objectives & Targets</label>
              <textarea
                id="focus-input"
                className="textarea flex-1"
                placeholder="Next Week Non-Negotiables: (e.g. Master dynamic programming, ship critical sprint backend refactor, hit gym 3 times...)"
                value={nextWeekFocus}
                onChange={(e) => setNextWeekFocus(e.target.value)}
                style={{ minHeight: '140px' }}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Sparkles size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Confirm & Archive</h2>
            </div>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Confirm your reflection. Locking in will save your weekly history, automatically roll remaining carryovers to next Monday, and clear your active planner.
            </p>

            <div className="flex flex-col gap-2 p-3 card-flat bg-dots flex-1" style={{ fontSize: 'var(--text-xs)' }}>
              <span className="picker-label" style={{ color: 'var(--color-muted)', borderBottom: '1px solid rgba(26,50,99,0.1)', paddingBottom: '4px' }}>
                Reflection Summary
              </span>
              <div>
                <strong>Completed this week:</strong> {completedTasks.length} tasks
              </div>
              <div>
                <strong>Active unresolved remaining:</strong> {unresolvedTasks.length} tasks
              </div>
              {Object.keys(arbitrations).length > 0 && (
                <div>
                  <strong>Arbitrations decided:</strong> {Object.values(arbitrations).filter((v) => v === 'vault').length} vaulted, {Object.values(arbitrations).filter((v) => v === 'drop').length} dropped
                </div>
              )}
              {winsReflection && (
                <div className="truncate">
                  <strong>Wins:</strong> {winsReflection}
                </div>
              )}
              {nextWeekFocus && (
                <div className="truncate">
                  <strong>Next Focus:</strong> {nextWeekFocus}
                </div>
              )}
            </div>

            <button
              onClick={handleCompleteReview}
              className="btn btn-primary w-full mt-4 btn-cta"
              disabled={isSaving}
              style={{
                borderWidth: '3px',
                borderColor: 'var(--color-dark)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {isSaving ? 'Saving...' : 'Lock In Reflection ↗'}
            </button>
          </div>
        )}

        {/* Stepper Footer Controls */}
        <div className="flex justify-between gap-4 mt-2">
          {step > 1 ? (
            <button className="btn btn-secondary flex-1" onClick={handlePrev} disabled={isSaving}>
              <ArrowLeft size={16} strokeWidth={3} />
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {step < 5 ? (
            <button className="btn btn-primary flex-1" onClick={handleNext} disabled={isSaving}>
              Next Step
              <ArrowRight size={16} strokeWidth={3} />
            </button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}
