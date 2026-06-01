import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  initialValue?: string;
}

export default function SearchBar({
  placeholder = 'Search tasks...',
  onSearch,
  initialValue = '',
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 250);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div
      className="flex items-center gap-2"
      style={{
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        border: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-surface)',
        width: '100%',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)',
      }}
    >
      <Search size={18} strokeWidth={2.5} style={{ color: 'var(--color-muted)' }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          border: 'none',
          outline: 'none',
          padding: 0,
          background: 'transparent',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-primary)',
          flex: 1,
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="btn-icon"
          style={{ width: '24px', height: '24px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Clear search"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
