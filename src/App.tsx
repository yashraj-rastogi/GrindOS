import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import AppShell from './components/AppShell';
import TodayScreen from './screens/TodayScreen';
import ThisWeekScreen from './screens/ThisWeekScreen';
import BacklogScreen from './screens/BacklogScreen';
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
            <Route path="backlog" element={<BacklogScreen />} />
            <Route path="review" element={<ReviewScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
