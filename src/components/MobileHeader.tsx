import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotificationCount } from '../db/hooks';
import SyncIndicator from './SyncIndicator';
import './MobileHeader.css';

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadNotificationCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  const firstLetter = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <header className="mobile-header hide-desktop">
      <div className="mobile-header-brand">
        <div className="mobile-logo">G</div>
        <h1 className="mobile-title">GrindOS</h1>
      </div>
      <div className="mobile-header-actions" ref={dropdownRef}>
        {isConfigured && user && <SyncIndicator />}

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
          className="btn-icon notif-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <Bell size={20} strokeWidth={2.5} />
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        <button
          className="btn-icon"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings size={20} strokeWidth={2.5} />
        </button>

        {isConfigured && user && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              className="user-avatar-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title="User profile"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  className="user-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="user-avatar-placeholder">{firstLetter}</span>
              )}
            </button>

            {menuOpen && (
              <div className="profile-dropdown animate-fade-in-up">
                <div className="profile-dropdown-header">
                  <span className="profile-name">{user.displayName || 'User'}</span>
                  <span className="profile-email">{user.email}</span>
                </div>
                <button className="profile-signout-btn" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
