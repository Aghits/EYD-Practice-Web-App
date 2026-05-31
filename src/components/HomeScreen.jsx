import React, { useState, useMemo } from 'react';
import {
  Play, Zap, Flame, Trophy, Star, Sparkles, Loader2, BookOpen, Lock
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import UpgradeModal from './UpgradeModal';
import { generateExercise } from '../utils/gemini';
import { getLevel } from '../utils/scoring';
import setsData from '../data/sets.json';

import { isSetFree, FREE_PREVIEW_SETS } from '../utils/premium';

export default function HomeScreen() {
  const { xp, streak, history, setProgress, goToSet, startExercise, settings } = useAppStore();
  const { isPremium, isDevMode } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const levelInfo = getLevel(xp);

  const recentAccuracy = history.length
    ? Math.round(history.slice(0, 10).reduce((s, h) => s + h.accuracy, 0) / Math.min(history.length, 10))
    : null;

  // Filtered sets list
  const filteredSets = useMemo(() => {
    if (difficultyFilter === 'all') return setsData;
    return setsData.filter(s => s.difficulty === difficultyFilter);
  }, [difficultyFilter]);

  const handleQuickPlay = async () => {
    setLoading(true);
    try {
      const ex = await generateExercise(settings.geminiApiKey, 'random');
      startExercise(ex, null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Compact Stats Hero */}
      <div className="glass-card p-6 relative overflow-hidden text-center space-y-2">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(108,99,255,0.3), transparent 60%)' }} />
        <div className="relative space-y-2">
          <h1 className="text-3xl font-extrabold gradient-text leading-tight">
            EYD V Trainer
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Kuasai kaidah ejaan bahasa Indonesia secara terstruktur dan terarah.
          </p>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <Stat icon={<Flame size={16} style={{ color: '#ff9f43' }} />} value={streak} label="Streak" />
            <Stat icon={<Zap size={16} style={{ color: '#a89dff' }} />} value={xp} label="XP" />
            {recentAccuracy !== null && (
              <Stat icon={<Trophy size={16} style={{ color: '#ffd166' }} />} value={`${recentAccuracy}%`} label="Akurasi" />
            )}
          </div>

          {/* XP bar */}
          <div className="max-w-xs mx-auto mt-2">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              <span>Lv.{levelInfo.level} — {levelInfo.label}</span>
              <span>{levelInfo.next ? `${levelInfo.next.min - xp} XP lagi` : 'Max Level!'}</span>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${levelInfo.progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Set Filter Chips */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Pilih Set Latihan
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <FilterChip active={difficultyFilter === 'all'} onClick={() => setDifficultyFilter('all')}>
            Semua
          </FilterChip>
          <FilterChip active={difficultyFilter === 'beginner'} onClick={() => setDifficultyFilter('beginner')}>
            🌱 Pemula
          </FilterChip>
          <FilterChip active={difficultyFilter === 'intermediate'} onClick={() => setDifficultyFilter('intermediate')}>
            ⚡ Menengah
          </FilterChip>
          <FilterChip active={difficultyFilter === 'advanced'} onClick={() => setDifficultyFilter('advanced')}>
            🔥 Mahir
          </FilterChip>
        </div>
      </div>

      {/* Set Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSets.map((set) => {
          const progress = setProgress[set.id] || { completedExercises: [], scores: {}, stars: 0 };
          const completedCount = set.exerciseIds.filter(id => progress.completedExercises.includes(id)).length;
          const totalCount = set.exerciseIds.length;
          
          const free = isSetFree(set);
          const isLocked = !free && !isPremium && !isDevMode;
          
          return (
            <button
              key={set.id}
              onClick={isLocked ? () => setShowUpgrade(true) : () => goToSet(set.id)}
              className="glass-card p-5 flex items-start gap-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              style={{
                borderColor: isLocked
                  ? 'var(--border)'
                  : completedCount === totalCount
                  ? 'rgba(16, 185, 129, 0.3)'
                  : completedCount > 0
                  ? 'rgba(108, 99, 255, 0.4)'
                  : 'var(--border)',
                background: isLocked
                  ? 'rgba(255, 255, 255, 0.01)'
                  : completedCount === totalCount
                  ? 'rgba(16, 185, 129, 0.03)'
                  : 'var(--bg-card)',
                opacity: isLocked ? 0.65 : 1
              }}
            >
              {/* Premium Lock Overlay Badge */}
              {isLocked && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    👑 Premium
                  </span>
                  <Lock size={12} className="text-purple-400" />
                </div>
              )}

              {/* Emoji or Number */}
              <div className="text-3xl flex-shrink-0 bg-neutral-900/30 p-2.5 rounded-xl border border-neutral-800">
                {set.emoji}
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="font-extrabold text-sm leading-snug line-clamp-1 pr-16" style={{ color: 'var(--text-primary)' }}>
                  {set.title}
                </h3>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge-${set.difficulty} text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded`}>
                    {set.difficulty === 'beginner' ? 'Pemula' : set.difficulty === 'intermediate' ? 'Menengah' : 'Mahir'}
                  </span>
                  {set.isNew && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 flex items-center gap-0.5 animate-pulse shadow-sm shadow-amber-500/20">
                      ✨ Baru
                    </span>
                  )}
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {totalCount} soal
                  </span>
                </div>

                {/* Stars - hidden if locked */}
                {!isLocked && (
                  <div className="flex gap-0.5 pt-0.5">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        size={13}
                        fill={s <= progress.stars ? '#fbbf24' : 'none'}
                        style={{ color: s <= progress.stars ? '#fbbf24' : 'var(--text-muted)' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Ring & Fraction - hidden if locked */}
              {!isLocked && (
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <ProgressRing value={completedCount} max={totalCount} />
                  <span className="text-[10px] font-bold" style={{ color: completedCount === totalCount ? '#10b981' : 'var(--text-muted)' }}>
                    {completedCount}/{totalCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Play (Secondary) */}
      <div className="pt-4 text-center">
        <button
          onClick={handleQuickPlay}
          disabled={loading}
          className="w-full max-w-sm mx-auto glass-card flex items-center justify-center gap-2.5 py-3 hover:bg-neutral-800/10 active:scale-95 transition-all text-sm font-semibold"
          style={{ color: 'var(--text-primary)', border: '1px dashed var(--border)' }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          )}
          <span>🎲 Latihan Acak (Luar Set)</span>
        </button>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-extrabold text-lg" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function FilterChip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
      style={{
        background: active ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
        borderColor: active ? 'var(--primary)' : 'var(--border)',
        color: active ? '#ffffff' : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  );
}

function ProgressRing({ value, max, size = 32, strokeWidth = 3 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / max) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={value === max ? '#10b981' : 'var(--primary)'}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </svg>
  );
}
