import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { seedDefaults } from './db/seed'
import { initializeRollover } from './domain/rollover'
import { initializeNotificationScheduler } from './domain/notifications'
import { initializeTemplateEngine } from './domain/templateEngine'

// Sequential startup initialization to avoid race conditions
async function initTracker() {
  try {
    // 1. Seed defaults first (Workstreams, Notifications, Templates, Vault Backlog)
    await seedDefaults();

    // 2. Initialize daily 4 AM rollover tracking
    await initializeRollover();

    // 3. Initialize background scheduled local reminders
    initializeNotificationScheduler();

    // 4. Initialize weekly template auto-generation
    await initializeTemplateEngine();

    console.log('[Tracker] Startup initialization completed successfully');
  } catch (err) {
    console.error('[Tracker] Startup initialization failed:', err);
  }
}

initTracker();



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
