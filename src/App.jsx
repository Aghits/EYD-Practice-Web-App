import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SetDetailScreen from './components/SetDetailScreen';
import ExerciseScreen from './components/ExerciseScreen';
import ProgressDashboard from './components/ProgressDashboard';
import SettingsScreen from './components/SettingsScreen';
import LearningSeriesScreen from './components/LearningSeriesScreen';
import AuthScreen from './components/AuthScreen';
import KataBakuGame from './components/KataBakuGame';
import TransitionWrapper from './components/TransitionWrapper';
import { Loader2 } from 'lucide-react';

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const { user, loading, isDevMode, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4" style={{ background: 'var(--bg-main)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#6C63FF,#a78bfa)' }}>
          📝
        </div>
        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={16} className="animate-spin text-purple-400" />
          <span>Memuat data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg-main)' }}>
      {isDevMode && (
        <div className="w-full text-center py-1.5 text-xs font-extrabold text-amber-300 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-center gap-1.5 select-none animate-fade-in shrink-0">
          ⚙️ Dev Mode — Auth & Premium Bypass
        </div>
      )}
      
      <Header />

      <main className="flex-1 transition-container">
        <TransitionWrapper show={screen === 'home'}>
          <HomeScreen />
        </TransitionWrapper>
        <TransitionWrapper show={screen === 'set-detail'}>
          <SetDetailScreen />
        </TransitionWrapper>
        <TransitionWrapper show={screen === 'exercise'}>
          <ExerciseScreen />
        </TransitionWrapper>

        <TransitionWrapper show={screen === 'progress'}>
          <ProgressDashboard />
        </TransitionWrapper>
        <TransitionWrapper show={screen === 'settings'}>
          <SettingsScreen />
        </TransitionWrapper>
        <TransitionWrapper show={screen === 'days-series'}>
          <LearningSeriesScreen />
        </TransitionWrapper>
        <TransitionWrapper show={screen === 'kata-baku-game'}>
          <KataBakuGame />
        </TransitionWrapper>
      </main>

      {!user && !isDevMode && <AuthScreen />}

      {/* Bottom safe area for mobile */}
      <div className="h-safe-bottom" />
    </div>
  );
}
