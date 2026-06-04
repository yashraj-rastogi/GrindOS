// ============================================================
// GrindOS — Login / Landing Screen
// ============================================================

import { Zap, Target, BarChart3, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-card animate-fade-in-up">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">G</div>
          <h1 className="login-title">GrindOS</h1>
          <p className="login-subtitle">Your Personal Execution Cockpit</p>
        </div>

        {/* Feature highlights */}
        <div className="login-features">
          <div className="login-feature">
            <Target size={18} strokeWidth={2.5} />
            <span>Plan your day & week with precision</span>
          </div>
          <div className="login-feature">
            <BarChart3 size={18} strokeWidth={2.5} />
            <span>Track progress across your challenge</span>
          </div>
          <div className="login-feature">
            <BookOpen size={18} strokeWidth={2.5} />
            <span>Journal daily reflections & reviews</span>
          </div>
          <div className="login-feature">
            <Zap size={18} strokeWidth={2.5} />
            <span>Synced across all your devices</span>
          </div>
        </div>

        {/* Sign In Button */}
        <button className="login-google-btn" onClick={signInWithGoogle}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Footer */}
        <p className="login-footer-text">
          Your data is synced securely via Firebase and stored locally for offline access.
        </p>
      </div>

      {/* Background decoration */}
      <div className="login-bg-decor" />
    </div>
  );
}
