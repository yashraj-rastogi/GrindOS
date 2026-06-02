import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import AppShell from './components/AppShell';
import TodayScreen from './screens/TodayScreen';
import ThisWeekScreen from './screens/ThisWeekScreen';
import VaultScreen from './screens/VaultScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingsScreen from './screens/SettingsScreen';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TodayScreen />} />
            <Route path="week" element={<ThisWeekScreen />} />
            <Route path="vault" element={<VaultScreen />} />
            <Route path="review" element={<ReviewScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
