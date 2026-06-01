import type { Workstream } from '../db/models';

interface WorkstreamChipProps {
  workstream?: Workstream;
}

export default function WorkstreamChip({ workstream }: WorkstreamChipProps) {
  if (!workstream) return null;

  return (
    <span
      className="chip"
      style={{
        backgroundColor: `${workstream.color}22`, // 13% opacity tint
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-primary)',
        gap: 'var(--space-2)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: workstream.color,
          display: 'inline-block',
          border: '1px solid var(--color-border)',
        }}
      />
      {workstream.name}
    </span>
  );
}
