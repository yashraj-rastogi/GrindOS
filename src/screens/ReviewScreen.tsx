import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Trophy,
  AlertTriangle,
  Scale,
  Target,
  Sparkles,
  Check,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { getWeekBounds, toDateString } from '../utils/dates';
import { TaskStatus, Mood, MOOD_EMOJI, MOOD_LABELS } from '../db/models';
import { upsertJournalEntry, deleteJournalEntry } from '../db/operations';
import { useJournalEntry, useRecentJournals } from '../db/hooks';
import Confetti from '../components/Confetti';
import JournalCard from '../components/JournalCard';
import './ReviewScreen.css';

type ReviewTab = 'weekly' | 'journal';

export default function ReviewScreen() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('weekly');

  return (
    <div className="screen-container animate-fade-in-up">
      {/* Tab Switcher */}
      <div className="review-tabs">
        <button
          className={`review-tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          <RotateCcw size={16} strokeWidth={2.5} />
          <span>Weekly Review</span>
        </button>
        <button
          className={`review-tab ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          <BookOpen size={16} strokeWidth={2.5} />
          <span>EOD Journal</span>
        </button>
      </div>

      {activeTab === 'weekly' && <WeeklyReview />}
      {activeTab === 'journal' && <EODJournal />}
    </div>
  );
}

/* ============================================================
   Weekly Review (Existing Stepper — unchanged logic)
   ============================================================ */

function WeeklyReview() {
  const { start, end } = getWeekBounds();

  const [step, setStep] = useState(1);
  const [winsReflection, setWinsReflection] = useState('');
  const [missesReflection, setMissesReflection] = useState('');
  const [arbitrations, setArbitrations] = useState<Record<string, 'keep' | 'vault' | 'drop'>>({});
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  const debtTasks = unresolvedTasks.filter((t) => t.rolloverCount > 0);

  const handleSelectArbitration = (taskId: string, action: 'keep' | 'vault' | 'drop') => {
    setArbitrations((prev) => ({ ...prev, [taskId]: action }));
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 5));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCompleteReview = async () => {
    setIsSaving(true);
    try {
      await db.transaction('rw', [db.tasks, db.reviews], async () => {
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

        const nextMondayDate = new Date(end + 'T00:00:00');
        nextMondayDate.setDate(nextMondayDate.getDate() + 1);
        const nextMondayStr = toDateString(nextMondayDate);

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
            await db.tasks.update(task.id, {
              status: task.status === TaskStatus.ROLLED_OVER ? TaskStatus.PLANNED : task.status,
              plannedFor: nextMondayStr,
              updatedAt: Date.now(),
            });
          }
        }
      });

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
      <div className="flex flex-col items-center justify-center text-center p-8 gap-4" style={{ minHeight: '60dvh' }}>
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
            Excellent execution. Your reflections have been archived, remaining unarbitrated tasks have been rolled over to next Monday.
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
    <>
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

        {/* Step 1: Wins */}
        {step === 1 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Trophy size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Log Your Wins</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Review the tasks you successfully smashed this week. Take a second to appreciate your velocity.
            </p>
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
            <div className="flex flex-col gap-1 mt-auto">
              <label htmlFor="wins-input" className="picker-label">Reflection & Personal Wins</label>
              <textarea
                id="wins-input"
                className="textarea"
                placeholder="What went exceptionally well this week?"
                value={winsReflection}
                onChange={(e) => setWinsReflection(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Misses */}
        {step === 2 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} strokeWidth={2.5} style={{ color: 'var(--color-danger)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Analyze Your Misses</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Execution requires honesty. What didn't get finished or was deferred?
            </p>
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
            <div className="flex flex-col gap-1 mt-auto">
              <label htmlFor="misses-input" className="picker-label">Challenges & Blockers</label>
              <textarea
                id="misses-input"
                className="textarea"
                placeholder="What held you back?"
                value={missesReflection}
                onChange={(e) => setMissesReflection(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Arbitration */}
        {step === 3 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Scale size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Debt Arbitration</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Carryover carryovers build toxic drag. Make deliberate decisions for unresolved tasks.
            </p>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 p-1" style={{ maxHeight: '240px' }}>
              {debtTasks.length === 0 ? (
                <div className="text-center py-6">
                  <p style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                    No rollover debt active this week. You can proceed to next step.
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
                      <div className="arbitration-buttons">
                        <button type="button" className={`chip arbitration-btn ${currentChoice === 'keep' ? 'active' : ''}`} onClick={() => handleSelectArbitration(t.id, 'keep')}>Keep</button>
                        <button type="button" className={`chip arbitration-btn ${currentChoice === 'vault' ? 'active' : ''}`} onClick={() => handleSelectArbitration(t.id, 'vault')}>Vault</button>
                        <button type="button" className={`chip arbitration-btn ${currentChoice === 'drop' ? 'active' : ''}`} onClick={() => handleSelectArbitration(t.id, 'drop')}>Drop</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Step 4: Focus */}
        {step === 4 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Target size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Plan Next Week's Focus</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              A clean slate is coming. What is your singular focus for next week?
            </p>
            <div className="flex flex-col gap-1 mt-4 flex-1">
              <label htmlFor="focus-input" className="picker-label">Objectives & Targets</label>
              <textarea
                id="focus-input"
                className="textarea flex-1"
                placeholder="Next Week Non-Negotiables..."
                value={nextWeekFocus}
                onChange={(e) => setNextWeekFocus(e.target.value)}
                style={{ minHeight: '140px' }}
              />
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="card step-card">
            <div className="flex items-center gap-2">
              <Sparkles size={20} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>Confirm & Archive</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Confirm your reflection. Locking in will save your weekly history and roll remaining carryovers.
            </p>
            <div className="flex flex-col gap-2 p-3 card-flat bg-dots flex-1" style={{ fontSize: 'var(--text-xs)' }}>
              <span className="picker-label" style={{ color: 'var(--color-muted)', borderBottom: '1px solid rgba(26,50,99,0.1)', paddingBottom: '4px' }}>
                Reflection Summary
              </span>
              <div><strong>Completed this week:</strong> {completedTasks.length} tasks</div>
              <div><strong>Active unresolved remaining:</strong> {unresolvedTasks.length} tasks</div>
              {Object.keys(arbitrations).length > 0 && (
                <div>
                  <strong>Arbitrations decided:</strong>{' '}
                  {Object.values(arbitrations).filter((v) => v === 'vault').length} vaulted,{' '}
                  {Object.values(arbitrations).filter((v) => v === 'drop').length} dropped
                </div>
              )}
              {winsReflection && <div className="truncate"><strong>Wins:</strong> {winsReflection}</div>}
              {nextWeekFocus && <div className="truncate"><strong>Next Focus:</strong> {nextWeekFocus}</div>}
            </div>
            <button
              onClick={handleCompleteReview}
              className="btn btn-primary w-full mt-4 btn-cta"
              disabled={isSaving}
              style={{ borderWidth: '3px', borderColor: 'var(--color-dark)', boxShadow: 'var(--shadow-md)' }}
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
    </>
  );
}

/* ============================================================
   EOD Journal
   ============================================================ */

function EODJournal() {
  const today = toDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.NEUTRAL);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Reactive queries
  const existingEntry = useJournalEntry(selectedDate);
  const recentEntries = useRecentJournals(15);

  // Sync form state when existing entry loads or date changes
  const loadedDate = existingEntry?.date;
  if (loadedDate === selectedDate && !isEditing) {
    if (existingEntry && content !== existingEntry.content) {
      // We need to set initial state but can't do it during render
      // This is handled in the effect below
    }
  }

  // Effect: load existing entry data into form
  const handleLoadEntry = () => {
    if (existingEntry) {
      setContent(existingEntry.content);
      setSelectedMood(existingEntry.mood);
    } else {
      setContent('');
      setSelectedMood(Mood.NEUTRAL);
    }
    setIsEditing(false);
    setSaveSuccess(false);
  };

  // When date changes, reset the form
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setContent('');
    setSelectedMood(Mood.NEUTRAL);
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      await upsertJournalEntry({
        date: selectedDate,
        content: content.trim(),
        mood: selectedMood,
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save journal entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Delete this journal entry?')) {
      try {
        await deleteJournalEntry(id);
        if (existingEntry?.id === id) {
          setContent('');
          setSelectedMood(Mood.NEUTRAL);
        }
      } catch (err) {
        console.error('Failed to delete journal entry:', err);
      }
    }
  };

  const handleEditExisting = () => {
    if (existingEntry) {
      setContent(existingEntry.content);
      setSelectedMood(existingEntry.mood);
      setIsEditing(true);
    }
  };

  // Determine if we're creating new or have an existing entry
  const hasExisting = existingEntry && existingEntry.date === selectedDate;
  const showForm = !hasExisting || isEditing;

  return (
    <>
      <div className="screen-date-header">
        <h1>EOD Journal</h1>
        <p className="section-header">Daily Reflection & Thoughts</p>
      </div>

      {/* Date Picker */}
      <div className="journal-date-picker">
        <label htmlFor="journal-date" className="picker-label">Select Date</label>
        <input
          id="journal-date"
          type="date"
          className="input"
          value={selectedDate}
          max={today}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {/* Existing Entry View */}
      {hasExisting && !isEditing && (
        <div className="card journal-existing-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '28px' }}>{MOOD_EMOJI[existingEntry.mood]}</span>
              <div>
                <span className="picker-label" style={{ margin: 0 }}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>
                  {MOOD_LABELS[existingEntry.mood]} day
                </span>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handleEditExisting} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
              Edit
            </button>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginTop: 'var(--space-3)' }}>
            {existingEntry.content}
          </p>
        </div>
      )}

      {/* Write/Edit Form */}
      {showForm && (
        <div className="card journal-form-card">
          {/* Mood Selector */}
          <div className="journal-mood-section">
            <span className="picker-label">How was your day?</span>
            <div className="journal-mood-row">
              {(Object.values(Mood) as Mood[]).map((mood) => (
                <button
                  key={mood}
                  className={`journal-mood-btn ${selectedMood === mood ? 'active' : ''}`}
                  onClick={() => setSelectedMood(mood)}
                  title={MOOD_LABELS[mood]}
                >
                  <span className="mood-emoji">{MOOD_EMOJI[mood]}</span>
                  <span className="mood-label">{MOOD_LABELS[mood]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1">
            <label htmlFor="journal-content" className="picker-label">Your Thoughts</label>
            <textarea
              id="journal-content"
              className="textarea"
              placeholder="What happened today? What did you learn? What are you grateful for?&#10;&#10;Write freely — this is your space."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (!isEditing) setIsEditing(true);
              }}
              style={{ minHeight: '160px' }}
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="btn btn-primary flex-1"
              disabled={isSaving || !content.trim()}
              style={{ borderWidth: '3px' }}
            >
              {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved!' : hasExisting ? 'Update Entry' : 'Save Entry'}
            </button>
            {isEditing && hasExisting && (
              <button
                onClick={handleLoadEntry}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Entries History */}
      {recentEntries && recentEntries.length > 0 && (
        <div className="journal-history">
          <span className="picker-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
            Recent Entries
          </span>
          <div className="journal-history-list">
            {recentEntries
              .filter((e) => e.date !== selectedDate || !isEditing)
              .map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDeleteEntry}
                  onClick={(e) => handleDateChange(e.date)}
                />
              ))}
          </div>
        </div>
      )}
    </>
  );
}
