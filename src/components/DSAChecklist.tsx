import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useUserConfig } from '../db/hooks';
import { DSA_PHASES, TOTAL_LECTURES } from '../data/dsaLectures';
import './DSAChecklist.css';

// Type definitions matching the data structure
interface LectureItem {
  id: number;
  type: string;
  title: string;
}

interface LecturePhase {
  name: string;
  description?: string;
  items: LectureItem[];
}

// Function to generate high-contrast type colors dynamically
function getTypeColor(type: string): string {
  const defaultColors: Record<string, string> = {
    Intro: '#547792',
    Lec: '#3B82F6',
    Practice: '#10B981',
    Sunday: '#8B5CF6',
    Mentor: '#F97316',
    Material: '#FAB95B',
    PYQ: '#E53935',
  };

  if (defaultColors[type]) return defaultColors[type];

  // String-based HSL generator for custom checklist types
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 42%)`;
}

export default function DSAChecklist() {
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([0]));
  const config = useUserConfig();

  // Load phases and total lectures dynamically based on config
  let phases: LecturePhase[] = DSA_PHASES;
  let totalLecturesCount = TOTAL_LECTURES;

  if (config?.customChecklistJson && config.customChecklistJson !== 'skip') {
    try {
      phases = JSON.parse(config.customChecklistJson) as LecturePhase[];
      totalLecturesCount = phases.reduce((acc, p) => acc + (p.items?.length || 0), 0);
    } catch (e) {
      console.error('[Curriculum] Failed to parse custom checklist JSON, falling back to DSA:', e);
    }
  }

  // Get all completed item IDs from IndexedDB
  const completedIds = useLiveQuery(async () => {
    const rows = await db.dsaProgress.toArray();
    return new Set(rows.map((r) => r.lectureId));
  });

  const completed = completedIds ?? new Set<number>();
  const totalDone = completed.size;

  const togglePhase = (index: number) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleLecture = async (item: LectureItem) => {
    if (completed.has(item.id)) {
      await db.dsaProgress.delete(item.id);
    } else {
      await db.dsaProgress.put({ lectureId: item.id, completedAt: Date.now() });
    }
  };

  return (
    <div className="dsa-checklist">
      {/* Overall progress card */}
      <div className="dsa-overall-progress">
        <div className="progress-stats">
          <span className="progress-label">{config?.goalCategory || 'DSA'} Curriculum Progress</span>
          <span className="progress-fraction">
            [ {totalDone} / {totalLecturesCount} ]
          </span>
        </div>
        <div className="progress-container">
          <div
            className="progress-fill"
            style={{
              width: `${totalLecturesCount > 0 ? (totalDone / totalLecturesCount) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="progress-percent">
          {totalLecturesCount > 0 ? Math.round((totalDone / totalLecturesCount) * 100) : 0}% complete
        </div>
      </div>

      {/* Phase sections */}
      {phases.map((phase, phaseIdx) => {
        const isOpen = openPhases.has(phaseIdx);
        const phaseDone = phase.items.filter((i) => completed.has(i.id)).length;
        const phaseTotal = phase.items.length;
        const phasePercent = phaseTotal > 0 ? (phaseDone / phaseTotal) * 100 : 0;

        return (
          <div key={phaseIdx} className="dsa-phase">
            {/* Phase header */}
            <div className="dsa-phase-header" onClick={() => togglePhase(phaseIdx)}>
              <h3>{phase.name}</h3>
              <div className="phase-meta">
                <span className="phase-fraction">
                  {phaseDone}/{phaseTotal}
                </span>
                <ChevronDown
                  size={18}
                  className={`phase-chevron ${isOpen ? 'open' : ''}`}
                />
              </div>
            </div>

            {/* Phase progress bar */}
            <div className="dsa-phase-progress">
              <div
                className="dsa-phase-progress-fill"
                style={{ width: `${phasePercent}%` }}
              />
            </div>

            {/* Lecture items */}
            {isOpen && (
              <div className="dsa-items">
                {phase.items.map((item) => {
                  const isDone = completed.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`dsa-item ${isDone ? 'completed' : ''}`}
                      onClick={() => toggleLecture(item)}
                    >
                      <div className={`dsa-check ${isDone ? 'checked' : ''}`}>
                        {isDone && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className="dsa-item-content">
                        <span className="dsa-item-id">#{item.id}</span>
                        {item.type && (
                          <span
                            className="dsa-type-badge"
                            style={{ backgroundColor: getTypeColor(item.type) }}
                          >
                            {item.type.toUpperCase()}
                          </span>
                        )}
                        <span className="dsa-item-title">{item.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
