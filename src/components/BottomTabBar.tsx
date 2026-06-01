import { NavLink } from 'react-router-dom';
import { CalendarDays, CalendarRange, Archive, RotateCcw } from 'lucide-react';
import './BottomTabBar.css';

const tabs = [
  { to: '/', icon: CalendarDays, label: 'Today' },
  { to: '/week', icon: CalendarRange, label: 'This Week' },
  { to: '/backlog', icon: Archive, label: 'Backlog' },
  { to: '/review', icon: RotateCcw, label: 'Review' },
];

export default function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar hide-desktop">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `tab-item ${isActive ? 'tab-active' : ''}`
          }
          end={tab.to === '/'}
        >
          <tab.icon size={22} strokeWidth={2.5} />
          <span className="tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
