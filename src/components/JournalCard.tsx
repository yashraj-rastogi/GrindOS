import { Trash2 } from 'lucide-react';
import { MOOD_EMOJI, MOOD_LABELS } from '../db/models';
import type { JournalEntry as JournalEntryType } from '../db/models';

interface JournalCardProps {
  entry: JournalEntryType;
  onDelete?: (id: string) => void;
  onClick?: (entry: JournalEntryType) => void;
}

export default function JournalCard({ entry, onDelete, onClick }: JournalCardProps) {
  const dateObj = new Date(entry.date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const truncatedContent =
    entry.content.length > 120
      ? entry.content.slice(0, 120) + '…'
      : entry.content;

  return (
    <div
      className="journal-card"
      onClick={() => onClick?.(entry)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="journal-card-header">
        <div className="journal-card-date">
          <span className="journal-day">{dayName}</span>
          <span className="journal-date-label">{dateLabel}</span>
        </div>
        <div className="journal-card-mood" title={MOOD_LABELS[entry.mood]}>
          {MOOD_EMOJI[entry.mood]}
        </div>
      </div>

      {truncatedContent && (
        <p className="journal-card-content">{truncatedContent}</p>
      )}

      {entry.tags.length > 0 && (
        <div className="journal-card-tags">
          {entry.tags.map((tag) => (
            <span key={tag} className="journal-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {onDelete && (
        <button
          className="journal-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          title="Delete journal entry"
        >
          <Trash2 size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
