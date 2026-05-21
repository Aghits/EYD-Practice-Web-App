import React from 'react';
import { BookOpen, BarChart2, Settings, Flame, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getLevel } from '../utils/scoring';

export default function Header() {
  const { screen, xp, streak, goTo } = useAppStore();

  const levelInfo = getLevel(xp);

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: 'rgba(15,14,26,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => goTo('home')}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#6C63FF,#a78bfa)' }}>
            📝
          </div>
          <span className="hidden sm:block font-extrabold text-sm tracking-tight gradient-text">EYD V</span>
        </button>

        {/* XP bar */}
        <div className="flex-1 max-w-[160px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: '#a89dff' }}>
              <Zap size={10} className="inline mr-0.5" />Lv.{levelInfo.level} {levelInfo.label}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{xp} XP</span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#ff9f43' }}>
            <Flame size={16} className="text-orange-400" />
            <span>{streak}</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavBtn icon={<BookOpen size={17} />} active={screen === 'home' || screen === 'exercise' || screen === 'results'} onClick={() => goTo('home')} title="Beranda" />
            <NavBtn icon={<BarChart2 size={17} />} active={screen === 'progress'} onClick={() => goTo('progress')} title="Progress" />
            <NavBtn icon={<Settings size={17} />} active={screen === 'settings'} onClick={() => goTo('settings')} title="Pengaturan" />
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavBtn({ icon, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      style={{
        background: active ? 'var(--brand-dim)' : 'transparent',
        color: active ? 'var(--brand)' : 'var(--text-muted)',
        border: active ? '1px solid rgba(108,99,255,0.35)' : '1px solid transparent',
      }}
    >
      {icon}
    </button>
  );
}
