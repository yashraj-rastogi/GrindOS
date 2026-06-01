import { Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import BottomTabBar from './BottomTabBar';
import SideRail from './SideRail';

export default function AppShell() {
  return (
    <div className="app-layout bg-grid">
      {/* Desktop: collapsible side rail */}
      <SideRail />

      {/* Mobile: sticky top header */}
      <MobileHeader />

      {/* Main routed content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile: bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}
