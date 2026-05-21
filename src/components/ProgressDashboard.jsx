import React, { useMemo } from 'react';
import { BarChart2, Target, Flame, Zap, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getLevel } from '../utils/scoring';
import { CATEGORY_LABEL } from '../utils/gemini';

export default function ProgressDashboard() {
  const { xp, streak, history, categoryStats } = useAppStore();
  const levelInfo = getLevel(xp);

  const totalCompleted = history.length;
  const avgAccuracy = totalCompleted
    ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / totalCompleted)
    : 0;
  const totalXpEarned = history.reduce((s, h) => s + (h.xp || 0), 0);

  // Category performance sorted by most-missed
  const catPerf = useMemo(() => {
    return Object.entries(categoryStats)
      .filter(([cat]) => cat !== 'loan-general')
      .map(([cat, stats]) => ({
        cat,
        label: CATEGORY_LABEL[cat] ?? cat,

        correct: stats.correct,
        total: stats.total,
        rate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((a, b) => a.rate - b.rate);
  }, [categoryStats]);

  // Last 7 sessions accuracy
  const recent7 = history.slice(0, 7).reverse();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-extrabold gradient-text">Progress Saya</h1>

      {/* Level card */}
      <div className="glass-card p-5 space-y-3 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(108,99,255,0.25), transparent 60%)' }} />
        <div className="relative flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#a78bfa)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}
          >
            {levelInfo.level}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Level Saat Ini</p>
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{levelInfo.label}</h2>
            {levelInfo.next && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {levelInfo.next.min - xp} XP lagi → {levelInfo.next.label}
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>{xp} XP</span>
            <span>{levelInfo.next?.min ?? xp} XP</span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <Trophy size={22} style={{ color: '#ffd166' }} />
          <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{totalCompleted}</span>
          <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>Soal Selesai</span>
        </div>
        <div className="stat-card">
          <Target size={22} style={{ color: '#00d9a0' }} />
          <span className="text-2xl font-extrabold" style={{ color: '#00d9a0' }}>{avgAccuracy}%</span>
          <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>Rata-rata Akurasi</span>
        </div>
        <div className="stat-card">
          <Flame size={22} style={{ color: '#ff9f43' }} />
          <span className="text-2xl font-extrabold" style={{ color: '#ff9f43' }}>{streak}</span>
          <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>Hari Berturut-turut</span>
        </div>
        <div className="stat-card">
          <Zap size={22} style={{ color: '#a89dff' }} />
          <span className="text-2xl font-extrabold" style={{ color: '#a89dff' }}>{totalXpEarned}</span>
          <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>Total XP</span>
        </div>
      </div>

      {/* Accuracy mini-chart (last 7) */}
      {recent7.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#a89dff' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Akurasi 7 Sesi Terakhir</h3>
          </div>
          <div className="flex items-end gap-2 h-24">
            {recent7.map((h, i) => {
              const acc = h.accuracy;
              const color = acc >= 80 ? '#00d9a0' : acc >= 50 ? '#fbbf24' : '#f87171';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold" style={{ color }}>{acc}%</span>
                  <div
                    className="w-full rounded-t-lg"
                    style={{ height: `${(acc / 100) * 64}px`, background: color, opacity: 0.8 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            {recent7.map((h, i) => (
              <div key={i} className="flex-1 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category performance */}
      {catPerf.length > 0 && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} style={{ color: '#a89dff' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Performa per Kategori</h3>
          </div>
          <div className="space-y-3">
            {catPerf.map(({ cat, label, rate, correct, total }) => {
              const color = rate >= 80 ? '#00d9a0' : rate >= 50 ? '#fbbf24' : '#f87171';
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
                    <span className="font-bold" style={{ color }}>
                      {correct}/{total} — {rate}%
                    </span>
                  </div>
                  <div className="xp-bar-track">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${rate}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {catPerf[0]?.rate < 60 && (
            <div
              className="flex items-start gap-2 rounded-xl p-3 text-xs"
              style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', color: '#fca5a5' }}
            >
              <span>⚠️</span>
              <span>
                Kategori <strong>{catPerf[0].label}</strong> perlu ditingkatkan — akurasi {catPerf[0].rate}%.
                Coba latihan terfokus pada kategori ini!
              </span>
            </div>
          )}
        </div>
      )}

      {totalCompleted === 0 && (
        <div className="text-center py-10 space-y-2">
          <p className="text-4xl">📊</p>
          <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Belum ada data progress.</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selesaikan latihan pertamamu untuk melihat statistik di sini.</p>
        </div>
      )}
    </div>
  );
}
