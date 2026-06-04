import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import TodayScreen from './screens/TodayScreen';
import ThisWeekScreen from './screens/ThisWeekScreen';
import VaultScreen from './screens/VaultScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationCenter from './screens/NotificationCenter';
import LoginScreen from './screens/LoginScreen';

function AppContent() {
  const { user, loading, isConfigured } = useAuth();

  if (isConfigured && loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <span className="auth-loading-text">Loading GrindOS...</span>
      </div>
    );
  }

  if (isConfigured && !user) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayScreen />} />
          <Route path="week" element={<ThisWeekScreen />} />
          <Route path="vault" element={<VaultScreen />} />
          <Route path="review" element={<ReviewScreen />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
