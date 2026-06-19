import React, { useState, useMemo } from 'react';
import {
  Play, Zap, Flame, Trophy, Star, Sparkles, Loader2, BookOpen, Lock, ArrowRight
} from 'lucide-react';
import { useAppStore, isDayLocked } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import UpgradeModal from './UpgradeModal';
import { generateExercise } from '../utils/gemini';
import { getLevel } from '../utils/scoring';
import setsData from '../data/sets.json';

import { isSetFree, FREE_PREVIEW_SETS } from '../utils/premium';

export default function HomeScreen() {
  const { xp, streak, history, setProgress, goToSet, startExercise, settings, goTo, daysProgress } = useAppStore();
  const { user, isPremium, isDevMode } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('beginner');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const levelInfo = getLevel(xp);
  const nextDay = daysProgress?.currentDay || 1;
  const isNextDayLocked = isDayLocked(nextDay, daysProgress, false, isDevMode);

  const recentAccuracy = history.length
    ? Math.round(history.slice(0, 10).reduce((s, h) => s + h.accuracy, 0) / Math.min(history.length, 10))
    : null;

  // Grouped active sets list
  const activeGroups = useMemo(() => {
    const groups = [
      { key: 'beginner', label: '🌱 Pemula', sets: [] },
      { key: 'intermediate', label: '⚡ Menengah', sets: [] },
      { key: 'advanced', label: '🔥 Mahir', sets: [] }
    ];
    setsData.forEach(set => {
      const group = groups.find(g => g.key === set.difficulty);
      if (group) {
        group.sets.push(set);
      }
    });
    
    if (difficultyFilter === 'all') {
      return groups.filter(g => g.sets.length > 0);
    }
    return groups.filter(g => g.key === difficultyFilter && g.sets.length > 0);
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

      {/* 7 Days Learning Series Banner */}
      <div className="glass-card p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 border border-purple-500/20" style={{ background: 'radial-gradient(circle at 100% 100%, rgba(108,99,255,0.08), transparent), rgba(28,26,46,0.35)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-purple-500/10">
            📅
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[var(--text-primary)]">Akselerasi PBM & PPU</span>
              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Aktif</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-md">
              Akselerasi pemahaman Kalimat Efektif, Konjungsi, Tanda Koma, Huruf Kapital, Makna Kata, & Bahasa Buatan.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!user || user === 'guest') {
              useAuthStore.setState({ user: null });
            } else {
              goTo('days-series');
            }
          }}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 active:scale-95 transition-all shadow-md shadow-purple-500/10 flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>
            {(!user || user === 'guest')
              ? 'Masuk untuk Belajar'
              : (!daysProgress || daysProgress.completedDays.length === 0)
              ? 'Mulai Belajar'
              : daysProgress.completedDays.length === 5
              ? 'Lihat Materi'
              : isNextDayLocked
              ? `Hari ${daysProgress.currentDay} • Buka Besok`
              : `Hari ${daysProgress.currentDay} • Lanjutkan`}
          </span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Kata Baku Challenge Banner */}
      <button
        onClick={() => goTo('kata-baku-game')}
        className="w-full glass-card p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all active:scale-[0.98] text-left group animate-fade-in"
        style={{ borderColor: 'rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.05)' }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'rgba(251,146,60,0.15)' }}>
          🎮
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm" style={{ color: '#fb923c' }}>
            Kata Baku Challenge
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Hafal 3 kata, pilih yang baku! Seberapa jauh kamu bisa bertahan?
          </p>
        </div>
        <ArrowRight size={18} className="shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: '#fb923c' }} />
      </button>

      {/* Set Filter Chips */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Pilih Set Latihan
        </h2>
        
        <div className="flex flex-wrap gap-2">
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

      {/* Set Groups */}
      <div className="space-y-8">
        {activeGroups.map(group => (
          <div key={group.key} className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span>{group.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.25 rounded-full bg-neutral-900/50 text-neutral-400 border border-neutral-800">
                {group.sets.length} Set
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.sets.map((set) => {
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
          </div>
        ))}
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
            <Sparkles size={16} style={{ color: 'var(--brand)' }} />
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
        background: active ? 'var(--brand)' : 'rgba(255,255,255,0.02)',
        borderColor: active ? 'var(--brand)' : 'var(--border)',
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
        stroke={value === max ? '#10b981' : 'var(--brand)'}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </svg>
  );
}
