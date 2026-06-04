import { Moon, Sun, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './MobileHeader.css';

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="mobile-header hide-desktop">
      <div className="mobile-header-brand">
        <div className="mobile-logo">G</div>
        <h1 className="mobile-title">GrindOS</h1>
      </div>
      <div className="mobile-header-actions">
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon size={20} strokeWidth={2.5} />
          ) : (
            <Sun size={20} strokeWidth={2.5} />
          )}
        </button>
        <button
          className="btn-icon"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings size={20} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
