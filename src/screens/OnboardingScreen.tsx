import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Zap, Target, Calendar, Upload, Bell, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { db } from '../db/database';
import { toDateString } from '../utils/dates';
import './OnboardingScreen.css';

// Initial Template suggestions by category
interface SuggestionTemplate {
  title: string;
  notes: string;
  daysOfWeek: number[];
  daily: boolean;
  checked: boolean;
}

const CATEGORY_TEMPLATES: Record<string, SuggestionTemplate[]> = {
  Coding: [
    { title: 'Solve 3 DSA Problems', notes: 'Focus on recursion/graphs/DP', daysOfWeek: [1, 2, 3, 4, 5], daily: false, checked: true },
    { title: 'Work on Side Project', notes: 'Build GrindOS features!', daysOfWeek: [6, 7], daily: false, checked: true },
    { title: 'Read Technical Blog', notes: 'Explore medium, dev.to or tech newsletters', daysOfWeek: [2, 4], daily: false, checked: false },
  ],
  Fitness: [
    { title: 'Strength Training Workout', notes: 'Push/Pull/Legs rotation', daysOfWeek: [1, 3, 5], daily: false, checked: true },
    { title: 'Cardio Session', notes: '30-40 mins zone 2 run or cycle', daysOfWeek: [2, 4], daily: false, checked: true },
    { title: 'Stretching & Mobility', notes: '15 mins yoga/mobility routine', daysOfWeek: [], daily: true, checked: false },
  ],
  Learning: [
    { title: 'Core Study Session', notes: 'Deep focus study block', daysOfWeek: [], daily: true, checked: true },
    { title: 'Review & Active Recall', notes: 'Flashcards and summary note reviews', daysOfWeek: [5], daily: false, checked: true },
    { title: 'Watch Lecture / Video', notes: 'Coursework or educational tutorials', daysOfWeek: [1, 3], daily: false, checked: false },
  ],
  Career: [
    { title: 'Job Search & Applications', notes: 'Apply to at least 3 relevant roles', daysOfWeek: [1, 2, 3, 4, 5], daily: false, checked: true },
    { title: 'Networking Outreach', notes: 'Reach out to 2 professionals on LinkedIn', daysOfWeek: [2, 4], daily: false, checked: true },
    { title: 'System Design / System Prep', notes: 'Practice architecting scaled apps', daysOfWeek: [6], daily: false, checked: false },
  ],
  Custom: [
    { title: 'Daily Execution Review', notes: 'Review completed tasks and journal', daysOfWeek: [], daily: true, checked: true },
    { title: 'Next Week Planning', notes: 'Schedule templates and plan priorities', daysOfWeek: [7], daily: false, checked: true },
  ],
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Goal setting
  const [goalCategory, setGoalCategory] = useState('Coding');
  const [goalDescription, setGoalDescription] = useState('');

  // Step 2: Timeline
  const [challengeWeeks, setChallengeWeeks] = useState(7);

  // Step 3: Checklist
  const [checklistMode, setChecklistMode] = useState<'default' | 'skip' | 'custom'>('default');
  const [customChecklistJson, setCustomChecklistJson] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  // Step 4: Templates (populated dynamically when Step 1 changes)
  const [templates, setTemplates] = useState<SuggestionTemplate[]>([]);

  // Step 5: Notifications
  const [standupEnabled, setStandupEnabled] = useState(true);
  const [standupTime, setStandupTime] = useState('08:00');
  const [eodEnabled, setEodEnabled] = useState(true);
  const [eodTime, setEodTime] = useState('21:00');
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [reviewDay, setReviewDay] = useState('Sunday');
  const [reviewTime, setReviewTime] = useState('19:00');

  // Fetch workstreams for template mapping
  const workstreams = useLiveQuery(() => db.workstreams.toArray()) || [];

  // Update templates suggestions when goalCategory changes
  useEffect(() => {
    const suggestions = CATEGORY_TEMPLATES[goalCategory] || CATEGORY_TEMPLATES.Custom;
    setTemplates(suggestions.map(t => ({ ...t })));
  }, [goalCategory]);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const error = validateChecklist(text);
        if (error) {
          setUploadError(error);
        } else {
          setCustomChecklistJson(text);
        }
      } catch (err) {
        setUploadError('Failed to read file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const validateChecklist = (jsonStr: string): string | null => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) return 'Curriculum must be a JSON array of phases.';
      for (let i = 0; i < parsed.length; i++) {
        const phase = parsed[i];
        if (typeof phase !== 'object' || !phase) return `Phase at index ${i} must be an object.`;
        if (typeof phase.name !== 'string') return `Phase at index ${i} must have a "name" string.`;
        if (!Array.isArray(phase.items)) return `Phase at index ${i} must have an "items" array.`;
        for (let j = 0; j < phase.items.length; j++) {
          const item = phase.items[j];
          if (typeof item !== 'object' || !item) return `Item at phase ${i}, index ${j} must be an object.`;
          if (typeof item.id !== 'number') return `Item at phase ${i}, index ${j} must have a numeric "id".`;
          if (typeof item.title !== 'string') return `Item at phase ${i}, index ${j} must have a "title" string.`;
          if (item.type && typeof item.type !== 'string') return `Item at phase ${i}, index ${j} "type" must be a string.`;
        }
      }
      return null;
    } catch (err) {
      return 'Invalid JSON format: ' + (err as Error).message;
    }
  };

  const handleTemplateToggle = (index: number) => {
    setTemplates(prev => prev.map((t, idx) => idx === index ? { ...t, checked: !t.checked } : t));
  };

  const handleTemplateTextChange = (index: number, newTitle: string) => {
    setTemplates(prev => prev.map((t, idx) => idx === index ? { ...t, title: newTitle } : t));
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const now = Date.now();

      // 1. Save config updates
      await db.userConfig.update('default', {
        goalCategory,
        goalDescription: goalDescription.trim() || `${goalCategory} Challenge`,
        challengeWeeks,
        challengeStartDate: toDateString(),
        customChecklistJson: checklistMode === 'custom' ? customChecklistJson : (checklistMode === 'skip' ? 'skip' : undefined),
        onboardingCompleted: true,
        updatedAt: now,
      });

      // 2. Map and save templates
      // Delete seeded templates first to start fresh based on category
      await db.weeklyTemplates.clear();
      
      const selectedSuggested = templates.filter(t => t.checked);
      
      // Match template category to workstream
      let workstreamId = workstreams[0]?.id || crypto.randomUUID();
      const matchedWs = workstreams.find(ws => {
        if (goalCategory === 'Coding') return ws.name.toLowerCase() === 'dsa';
        if (goalCategory === 'Fitness') return ws.name.toLowerCase() === 'personal';
        if (goalCategory === 'Learning') return ws.name.toLowerCase() === 'study';
        return ws.name.toLowerCase() === 'personal';
      });
      if (matchedWs) workstreamId = matchedWs.id;

      for (let i = 0; i < selectedSuggested.length; i++) {
        const t = selectedSuggested[i];
        await db.weeklyTemplates.add({
          id: crypto.randomUUID(),
          title: t.title,
          notes: t.notes,
          workstreamId,
          priority: 'none',
          daysOfWeek: t.daysOfWeek,
          daily: t.daily,
          estimate: 15,
          tags: [],
          dsaAutoLink: false,
          active: true,
          sortOrder: i,
          createdAt: now,
        });
      }

      // 3. Update Notification schedules
      const notifications = await db.notifications.toArray();
      for (const notif of notifications) {
        if (notif.kind === 'standup') {
          await db.notifications.update(notif.id, {
            enabled: standupEnabled,
            schedule: standupTime,
          });
        } else if (notif.kind === 'end_of_day') {
          await db.notifications.update(notif.id, {
            enabled: eodEnabled,
            schedule: eodTime,
          });
        } else if (notif.kind === 'weekly_review') {
          await db.notifications.update(notif.id, {
            enabled: reviewEnabled,
            schedule: `${reviewDay} ${reviewTime}`,
          });
        }
      }

    } catch (err) {
      console.error('[Onboarding] Failed to complete setup:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !goalDescription.trim()) return;
    if (step === 3 && checklistMode === 'custom' && (!customChecklistJson || uploadError)) return;
    
    if (step === 5) {
      completeOnboarding();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const categories = [
    { id: 'Coding', label: 'Coding 💻' },
    { id: 'Fitness', label: 'Fitness 🏋️' },
    { id: 'Learning', label: 'Learning 📚' },
    { id: 'Career', label: 'Career 💼' },
    { id: 'Custom', label: 'Custom ⚡' },
  ];

  return (
    <div className="onboarding-screen">
      <div className="onboarding-container">
        {/* Progress indicator */}
        <div className="onboarding-progress">
          <div className="onboarding-step-label">Step {step} of 5</div>
          <div className="onboarding-progress-bar">
            <div className="onboarding-progress-fill" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        </div>

        {/* Step 1: Goal Statement */}
        {step === 1 && (
          <div className="onboarding-step animate-fade-in-up">
            <div className="step-header">
              <div className="step-icon"><Target size={24} strokeWidth={2.5} /></div>
              <h2>Define your Execution Goal</h2>
            </div>
            <p className="step-desc">Pick your primary focus area and describe what you plan to accomplish.</p>
            
            <div className="categories-picker">
              <label className="onboarding-label">Goal Category</label>
              <div className="categories-grid">
                {categories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`category-btn ${goalCategory === c.id ? 'active' : ''}`}
                    onClick={() => setGoalCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="goalDesc" className="onboarding-label">Goal Description</label>
              <textarea
                id="goalDesc"
                className="onboarding-textarea"
                rows={3}
                placeholder={`Example: Solve 200 DSA problems and learn React to secure a software engineering role.`}
                value={goalDescription}
                onChange={e => setGoalDescription(e.target.value)}
                maxLength={150}
                required
              />
              <span className="char-count">{goalDescription.length}/150</span>
            </div>
          </div>
        )}

        {/* Step 2: Timeline */}
        {step === 2 && (
          <div className="onboarding-step animate-fade-in-up">
            <div className="step-header">
              <div className="step-icon"><Calendar size={24} strokeWidth={2.5} /></div>
              <h2>Define your Timeline</h2>
            </div>
            <p className="step-desc">How many weeks is your challenge period? We default to a standard 7-week cycle.</p>
            
            <div className="timeline-picker-container">
              <div className="timeline-badge">
                {challengeWeeks} {challengeWeeks === 1 ? 'Week' : 'Weeks'}
              </div>
              <input
                type="range"
                className="timeline-slider"
                min="1"
                max="52"
                value={challengeWeeks}
                onChange={e => setChallengeWeeks(parseInt(e.target.value, 10))}
              />
              <div className="timeline-ticks">
                <span>1 Week</span>
                <span>12 Weeks</span>
                <span>24 Weeks</span>
                <span>52 Weeks (1 Year)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Curriculum Upload */}
        {step === 3 && (
          <div className="onboarding-step animate-fade-in-up">
            <div className="step-header">
              <div className="step-icon"><Upload size={24} strokeWidth={2.5} /></div>
              <h2>Curriculum Checklist</h2>
            </div>
            <p className="step-desc">GrindOS can maintain a progress checklist. Skip it, use the default DSA curriculum, or upload your own.</p>
            
            <div className="checklist-modes-grid">
              <button
                type="button"
                className={`mode-btn ${checklistMode === 'default' ? 'active' : ''}`}
                onClick={() => setChecklistMode('default')}
              >
                <h3>DSA Curriculum</h3>
                <p>Standard 137-lecture curriculum pre-loaded.</p>
              </button>
              
              <button
                type="button"
                className={`mode-btn ${checklistMode === 'skip' ? 'active' : ''}`}
                onClick={() => setChecklistMode('skip')}
              >
                <h3>No Checklist</h3>
                <p>Hide curriculum checklist in Vault dashboard.</p>
              </button>
              
              <button
                type="button"
                className={`mode-btn ${checklistMode === 'custom' ? 'active' : ''}`}
                onClick={() => setChecklistMode('custom')}
              >
                <h3>Upload Custom JSON</h3>
                <p>Provide a custom JSON syllabus to track.</p>
              </button>
            </div>

            {checklistMode === 'custom' && (
              <div className="custom-upload-box">
                <label className="file-dropzone">
                  <Upload size={32} />
                  <span>{fileName || 'Select JSON curriculum file'}</span>
                  <input
                    type="file"
                    accept=".json"
                    className="file-input-hidden"
                    onChange={handleJsonUpload}
                  />
                </label>
                {uploadError && <div className="upload-error-alert">{uploadError}</div>}
                {!uploadError && customChecklistJson && (
                  <div className="upload-success-alert">✓ Valid curriculum file parsed successfully!</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Suggested Templates */}
        {step === 4 && (
          <div className="onboarding-step animate-fade-in-up">
            <div className="step-header">
              <div className="step-icon"><Zap size={24} strokeWidth={2.5} /></div>
              <h2>Initial Weekly Templates</h2>
            </div>
            <p className="step-desc">Weekly templates generate recurring tasks for you automatically. Choose which suggested templates to active:</p>

            <div className="suggestions-list">
              {templates.map((t, idx) => (
                <div key={idx} className={`suggestion-card ${t.checked ? 'active' : ''}`}>
                  <div className="suggestion-card-header">
                    <button
                      type="button"
                      className={`suggestion-checkbox ${t.checked ? 'checked' : ''}`}
                      onClick={() => handleTemplateToggle(idx)}
                    >
                      {t.checked && <Check size={14} strokeWidth={3} />}
                    </button>
                    <input
                      type="text"
                      className="suggestion-title-input"
                      value={t.title}
                      onChange={e => handleTemplateTextChange(idx, e.target.value)}
                      placeholder="Template title"
                      disabled={!t.checked}
                    />
                  </div>
                  <div className="suggestion-card-body">
                    <p className="suggestion-notes">{t.notes}</p>
                    <div className="suggestion-days">
                      {t.daily ? (
                        <span className="day-badge daily">Daily</span>
                      ) : (
                        t.daysOfWeek.map(d => {
                          const labels = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          return <span key={d} className="day-badge">{labels[d]}</span>;
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Reminders */}
        {step === 5 && (
          <div className="onboarding-step animate-fade-in-up">
            <div className="step-header">
              <div className="step-icon"><Bell size={24} strokeWidth={2.5} /></div>
              <h2>Configure Reminders</h2>
            </div>
            <p className="step-desc">Keep your routine consistent. Configure your notification reminder times:</p>

            <div className="reminders-list">
              {/* Standup */}
              <div className="reminder-item-card">
                <div className="reminder-header-row">
                  <div className="reminder-toggle-row">
                    <button
                      type="button"
                      className={`toggle-switch ${standupEnabled ? 'on' : ''}`}
                      onClick={() => setStandupEnabled(!standupEnabled)}
                    >
                      <span className="toggle-handle" />
                    </button>
                    <span className="reminder-title-label">Morning Standup Gate</span>
                  </div>
                  <input
                    type="time"
                    className="time-picker-input"
                    value={standupTime}
                    onChange={e => setStandupTime(e.target.value)}
                    disabled={!standupEnabled}
                  />
                </div>
                <p className="reminder-desc-label">Prompt to review rollover debt and organize your day at the start of your routine.</p>
              </div>

              {/* EOD Journal */}
              <div className="reminder-item-card">
                <div className="reminder-header-row">
                  <div className="reminder-toggle-row">
                    <button
                      type="button"
                      className={`toggle-switch ${eodEnabled ? 'on' : ''}`}
                      onClick={() => setEodEnabled(!eodEnabled)}
                    >
                      <span className="toggle-handle" />
                    </button>
                    <span className="reminder-title-label">End of Day Reflection</span>
                  </div>
                  <input
                    type="time"
                    className="time-picker-input"
                    value={eodTime}
                    onChange={e => setEodTime(e.target.value)}
                    disabled={!eodEnabled}
                  />
                </div>
                <p className="reminder-desc-label">Prompt to log EOD wins, journal reflections, and confirm task carryovers.</p>
              </div>

              {/* Weekly Review */}
              <div className="reminder-item-card">
                <div className="reminder-header-row">
                  <div className="reminder-toggle-row">
                    <button
                      type="button"
                      className={`toggle-switch ${reviewEnabled ? 'on' : ''}`}
                      onClick={() => setReviewEnabled(!reviewEnabled)}
                    >
                      <span className="toggle-handle" />
                    </button>
                    <span className="reminder-title-label">Weekly Review Loop</span>
                  </div>
                  <div className="reminder-time-group">
                    <select
                      className="day-picker-select"
                      value={reviewDay}
                      onChange={e => setReviewDay(e.target.value)}
                      disabled={!reviewEnabled}
                    >
                      <option value="Monday">Mon</option>
                      <option value="Friday">Fri</option>
                      <option value="Saturday">Sat</option>
                      <option value="Sunday">Sun</option>
                    </select>
                    <input
                      type="time"
                      className="time-picker-input"
                      value={reviewTime}
                      onChange={e => setReviewTime(e.target.value)}
                      disabled={!reviewEnabled}
                    />
                  </div>
                </div>
                <p className="reminder-desc-label">Prompt to perform your guided weekly reset stepper and evaluate execution scores.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="onboarding-actions">
          {step > 1 ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={prevStep}
              disabled={loading}
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={nextStep}
            disabled={
              loading ||
              (step === 1 && !goalDescription.trim()) ||
              (step === 3 && checklistMode === 'custom' && (!customChecklistJson || !!uploadError))
            }
          >
            {loading ? (
              'Saving Configuration...'
            ) : step === 5 ? (
              <>
                Complete Setup
                <Check size={16} strokeWidth={2.5} />
              </>
            ) : (
              <>
                Next Step
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
