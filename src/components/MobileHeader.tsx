import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotificationCount } from '../db/hooks';
import SyncIndicator from './SyncIndicator';
import UserAvatar from './UserAvatar';
import './MobileHeader.css';

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isConfigured, profileName, profileAvatar } = useAuth();
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

  const handleProfileClick = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

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

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className="user-avatar-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title="User Profile"
          >
            <UserAvatar avatarUrlOrId={profileAvatar} displayName={profileName} size={32} />
          </button>

          {menuOpen && (
            <div className="profile-dropdown animate-fade-in-up">
              <div className="profile-dropdown-header">
                <span className="profile-name">{profileName}</span>
                <span className="profile-email">{user?.email || 'Offline Local Account'}</span>
              </div>
              <button
                className="profile-signout-btn"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-primary)',
                  marginBottom: user ? 'var(--space-2)' : '0',
                }}
                onClick={handleProfileClick}
              >
                Manage Profile
              </button>
              {user && (
                <button className="profile-signout-btn" onClick={handleSignOut}>
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
