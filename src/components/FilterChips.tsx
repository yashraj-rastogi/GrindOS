import type { Workstream } from '../db/models';
import './FilterChips.css';

interface FilterChipsProps {
  workstreams: Workstream[];
  selectedWorkstreamId: string | null;
  onSelectWorkstream: (id: string | null) => void;
}

export default function FilterChips({
  workstreams,
  selectedWorkstreamId,
  onSelectWorkstream,
}: FilterChipsProps) {
  return (
    <div className="filter-chips-scroll">
      {/* ALL chip */}
      <button
        type="button"
        className={`chip filter-chip ${selectedWorkstreamId === null ? 'active' : ''}`}
        onClick={() => onSelectWorkstream(null)}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-text-secondary)',
            display: 'inline-block',
            marginRight: 'var(--space-1.5)',
            border: '1px solid var(--color-border)',
          }}
        />
        ALL
      </button>

      {/* Workstream chips */}
      {workstreams.map((ws) => (
        <button
          key={ws.id}
          type="button"
          className={`chip filter-chip ${selectedWorkstreamId === ws.id ? 'active' : ''}`}
          onClick={() => onSelectWorkstream(ws.id)}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: ws.color,
              display: 'inline-block',
              marginRight: 'var(--space-1.5)',
              border: '1px solid var(--color-border)',
            }}
          />
          {ws.name}
        </button>
      ))}
    </div>
  );
}
