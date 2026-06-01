interface ProgressBarProps {
  done: number;
  total: number;
}

export default function ProgressBar({ done, total }: ProgressBarProps) {
  const percentage = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="progress-container">
      <div
        className="progress-fill"
        style={{ width: `${percentage}%` }}
      />
      <div className="progress-label fraction">
        [ {done} / {total} ]
      </div>
    </div>
  );
}
