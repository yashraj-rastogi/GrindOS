import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { DSA_PHASES, TOTAL_LECTURES, TYPE_COLORS, TYPE_LABELS } from '../data/dsaLectures';
import type { LectureItem } from '../data/dsaLectures';
import './DSAChecklist.css';

export default function DSAChecklist() {
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([0]));

  // Get all completed lecture IDs from IndexedDB
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
          <span className="progress-label">DSA Progress</span>
          <span className="progress-fraction">
            [ {totalDone} / {TOTAL_LECTURES} ]
          </span>
        </div>
        <div className="progress-container">
          <div
            className="progress-fill"
            style={{
              width: `${TOTAL_LECTURES > 0 ? (totalDone / TOTAL_LECTURES) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="progress-percent">
          {TOTAL_LECTURES > 0 ? Math.round((totalDone / TOTAL_LECTURES) * 100) : 0}% complete
        </div>
      </div>

      {/* Phase sections */}
      {DSA_PHASES.map((phase, phaseIdx) => {
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
                        <span
                          className="dsa-type-badge"
                          style={{ backgroundColor: TYPE_COLORS[item.type] }}
                        >
                          {TYPE_LABELS[item.type]}
                        </span>
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
