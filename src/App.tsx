import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUserConfig } from './db/hooks';
import AppShell from './components/AppShell';
import TodayScreen from './screens/TodayScreen';
import ThisWeekScreen from './screens/ThisWeekScreen';
import VaultScreen from './screens/VaultScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationCenter from './screens/NotificationCenter';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';

function AppContent() {
  const { user, loading, isConfigured } = useAuth();
  const config = useUserConfig();

  // 1. Loading auth state
  if (isConfigured && loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <span className="auth-loading-text">Loading GrindOS...</span>
      </div>
    );
  }

  // 2. Auth guard: not logged in
  if (isConfigured && !user) {
    return <LoginScreen />;
  }

  // 3. Loading user configurations from database
  if (config === undefined) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <span className="auth-loading-text">Loading Configuration...</span>
      </div>
    );
  }

  // 4. Onboarding guard: wizard not completed
  if (config && !config.onboardingCompleted) {
    return <OnboardingScreen />;
  }

  // 5. Main application dashboard
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
          <Route path="profile" element={<ProfileScreen />} />
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
