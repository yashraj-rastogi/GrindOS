import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  CalendarRange,
  Archive,
  RotateCcw,
  Settings,
  Sun,
  Moon,
  Bell,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotificationCount } from '../db/hooks';
import SyncIndicator from './SyncIndicator';
import './SideRail.css';

const navItems = [
  { to: '/', icon: CalendarDays, label: 'Today' },
  { to: '/week', icon: CalendarRange, label: 'This Week' },
  { to: '/vault', icon: Archive, label: 'Vault' },
  { to: '/review', icon: RotateCcw, label: 'Review' },
];

export default function SideRail() {
  const [expanded, setExpanded] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isConfigured } = useAuth();
  const unreadCount = useUnreadNotificationCount();

  const firstLetter = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <aside
      className={`side-rail hide-mobile ${expanded ? 'side-rail-expanded' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo / brand area */}
      <div className="rail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="rail-logo">G</div>
          {expanded && <span className="rail-brand">GrindOS</span>}
        </div>
        {expanded && isConfigured && user && <SyncIndicator />}
      </div>

      {/* User profile area */}
      {isConfigured && user && (
        <div className="rail-user">
          <div className="rail-avatar">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="rail-avatar-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="rail-avatar-placeholder">{firstLetter}</span>
            )}
          </div>
          {expanded && (
            <div className="rail-user-info">
              <span className="rail-user-name" title={user.displayName || 'User'}>
                {user.displayName || 'User'}
              </span>
              <span className="rail-user-email" title={user.email || ''}>
                {user.email}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation items */}
      <nav className="rail-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rail-item ${isActive ? 'rail-item-active' : ''}`
            }
            end={item.to === '/'}
          >
            <item.icon size={20} strokeWidth={2.5} />
            {expanded && <span className="rail-item-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="rail-footer">
        <button className="rail-item" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? (
            <Moon size={20} strokeWidth={2.5} />
          ) : (
            <Sun size={20} strokeWidth={2.5} />
          )}
          {expanded && (
            <span className="rail-item-label">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
        </button>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `rail-item ${isActive ? 'rail-item-active' : ''}`
          }
        >
          <span className="notif-btn">
            <Bell size={20} strokeWidth={2.5} />
            {unreadCount !== undefined && unreadCount > 0 && (
              <span className="notif-badge rail-notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          {expanded && <span className="rail-item-label">Notifications</span>}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `rail-item ${isActive ? 'rail-item-active' : ''}`
          }
        >
          <Settings size={20} strokeWidth={2.5} />
          {expanded && <span className="rail-item-label">Settings</span>}
        </NavLink>

        {isConfigured && user && expanded && (
          <button className="rail-item rail-signout-btn" onClick={signOut} title="Sign out">
            <LogOut size={20} strokeWidth={2.5} />
            <span className="rail-item-label">Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
