import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  Icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      className="card bg-dots flex flex-col items-center text-center p-6 gap-4"
      style={{
        minHeight: '280px',
        justifyContent: 'center',
        borderWidth: '3px',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: '64px',
          height: '64px',
          backgroundColor: 'var(--color-accent)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--color-text-on-accent)',
        }}
      >
        <Icon size={32} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 style={{ textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', fontSize: 'var(--text-lg)' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', fontSize: 'var(--text-sm)' }}>
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button className="btn btn-primary mt-2" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
