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
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
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

  return (
    <aside
      className={`side-rail hide-mobile ${expanded ? 'side-rail-expanded' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo / brand area */}
      <div className="rail-header">
        <div className="rail-logo">G</div>
        {expanded && <span className="rail-brand">GrindOS</span>}
      </div>

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
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
          )}
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `rail-item ${isActive ? 'rail-item-active' : ''}`
          }
        >
          <Settings size={20} strokeWidth={2.5} />
          {expanded && <span className="rail-item-label">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
