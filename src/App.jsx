import React from 'react';
import { useAppStore } from './store/useAppStore';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SetDetailScreen from './components/SetDetailScreen';
import ExerciseScreen from './components/ExerciseScreen';
import ResultsScreen from './components/ResultsScreen';
import ProgressDashboard from './components/ProgressDashboard';
import SettingsScreen from './components/SettingsScreen';

export default function App() {
  const screen = useAppStore((s) => s.screen);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
      <Header />

      <main className="flex-1 pb-10">
        {screen === 'home'       && <HomeScreen />}
        {screen === 'set-detail' && <SetDetailScreen />}
        {screen === 'exercise'   && <ExerciseScreen />}
        {screen === 'results'    && <ResultsScreen />}
        {screen === 'progress'   && <ProgressDashboard />}
        {screen === 'settings'   && <SettingsScreen />}
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-safe-bottom" />
    </div>
  );
}
