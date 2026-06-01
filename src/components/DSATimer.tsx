import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Award } from 'lucide-react';

export default function DSATimer() {
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setSessionCompleted(true);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (sessionCompleted) {
      setSessionCompleted(false);
      setTimeLeft(1500);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(1500);
    setSessionCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="card mb-4"
      style={{
        borderWidth: '3px',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        background: 'var(--color-bg-elevated)',
        padding: 'var(--space-4)',
      }}
    >
      <div className="flex items-center justify-between border-b pb-2 mb-3" style={{ borderColor: 'var(--color-border)' }}>
        <span className="section-header" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', margin: 0 }}>
          ⚡ DSA PRACTICE TIMER
        </span>
        <span
          className="mono"
          style={{
            fontSize: '10px',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
            padding: '2px 6px',
            border: '2px solid var(--color-border)',
            fontWeight: 'bold',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          POMODORO
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 py-2">
        {sessionCompleted ? (
          <div className="flex flex-col items-center text-center gap-1 animate-scale-in">
            <Award size={36} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
              SESSION COMPLETE!
            </span>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Practice logged. Keep executing.
            </p>
          </div>
        ) : (
          /* Oversized monospaced numerals */
          <div
            className="mono"
            style={{
              fontSize: '3.5rem',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              letterSpacing: '0.02em',
              lineHeight: 1,
              textShadow: '2px 2px 0px rgba(26, 50, 99, 0.1)',
            }}
          >
            {formatTime(timeLeft)}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 w-full">
          <button
            onClick={toggleTimer}
            className={`btn flex-1 ${isActive ? 'btn-secondary' : 'btn-primary'}`}
            style={{ borderWidth: '2px', padding: 'var(--space-2) var(--space-4)' }}
          >
            {isActive ? (
              <>
                <Pause size={14} strokeWidth={3} /> Pause
              </>
            ) : (
              <>
                <Play size={14} strokeWidth={3} /> {sessionCompleted ? 'Restart' : 'Start Focus'}
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="btn btn-secondary shrink-0"
            style={{ borderWidth: '2px', padding: 'var(--space-2) var(--space-3)' }}
            title="Reset Timer"
          >
            <RotateCcw size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
