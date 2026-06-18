import React, { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Play, Star, CheckCircle2, Award } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { isSetFree } from '../utils/premium';
import { getExerciseById } from '../utils/gemini';
import setsData from '../data/sets.json';

export default function SetDetailScreen() {
  const { currentSetId, setProgress, startExercise, goTo } = useAppStore();
  const { isPremium, isDevMode } = useAuthStore();

  // Cache the last valid set data locally so it remains visible during exit transition
  const [cachedSet, setCachedSet] = useState(null);

  const currentSet = setsData.find((s) => s.id === currentSetId) || cachedSet;

  useEffect(() => {
    const foundSet = setsData.find((s) => s.id === currentSetId);
    if (foundSet) {
      setCachedSet(foundSet);
    }
  }, [currentSetId]);

  // Gated premium check: redirect home if unauthorized
  useEffect(() => {
    if (currentSet) {
      const free = isSetFree(currentSet);
      if (!free && !isPremium && !isDevMode) {
        goTo('home');
      }
    }
  }, [currentSet, isPremium, isDevMode, goTo]);

  if (!currentSet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Set tidak ditemukan.</p>
        <button onClick={() => goTo('home')} className="btn-primary mt-4 py-2 px-6">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const progress = setProgress[currentSet.id] || {
    completedExercises: [],
    scores: {},
    stars: 0,
  };

  const exercises = currentSet.exerciseIds.map((id) => getExerciseById(id)).filter(Boolean);

  const completedCount = currentSet.exerciseIds.filter(id => progress.completedExercises.includes(id)).length;
  const totalCount = currentSet.exerciseIds.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);

  // Find the next incomplete but unlocked exercise index
  let nextExerciseIndex = 0;
  for (let i = 0; i < exercises.length; i++) {
    const isCompleted = progress.completedExercises.includes(exercises[i].id);
    if (!isCompleted) {
      nextExerciseIndex = i;
      break;
    }
    // If all are completed, default to 0 or leave at last
    if (i === exercises.length - 1) {
      nextExerciseIndex = 0; // Or allow replaying from start
    }
  }

  const handleStartExercise = (ex) => {
    // Generate transient ID for this specific session
    const sessionExercise = {
      ...ex,
      baseId: ex.id,
      id: `set_${currentSet.id}_${ex.id}_${Date.now()}`,
    };
    startExercise(sessionExercise, null);
  };

  const handleContinue = () => {
    // Start the first incomplete exercise
    const incomplete = exercises.find(ex => !progress.completedExercises.includes(ex.id));
    if (incomplete) {
      handleStartExercise(incomplete);
    } else if (exercises.length > 0) {
      // Replay first
      handleStartExercise(exercises[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => goTo('home')}
          className="p-2 rounded-lg hover:bg-neutral-800/10 active:scale-95 transition-all"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
        <div>
          <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
            Set Detail
          </span>
          <h1 className="text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>{currentSet.emoji}</span>
            <span>{currentSet.title}</span>
          </h1>
        </div>
      </div>

      {/* Progress Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span
              className={`badge-${currentSet.difficulty} text-xs font-bold px-2 py-0.5 rounded`}
            >
              {currentSet.difficulty === 'beginner'
                ? '🌱 Pemula'
                : currentSet.difficulty === 'intermediate'
                ? '⚡ Menengah'
                : '🔥 Mahir'}
            </span>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {currentSet.description}
            </p>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 bg-neutral-900/40 px-2.5 py-1 rounded-full border border-yellow-500/20">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={16}
                fill={s <= progress.stars ? '#fbbf24' : 'none'}
                style={{ color: s <= progress.stars ? '#fbbf24' : 'var(--text-muted)' }}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            <span>Progress Latihan</span>
            <span>{completedCount} dari {totalCount} Selesai ({percentComplete}%)</span>
          </div>
          <div className="xp-bar-track h-2.5">
            <div
              className="xp-bar-fill h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentComplete}%`,
                background: percentComplete === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'var(--brand)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Daftar Soal
        </h2>
        <div className="space-y-3">
          {exercises.map((ex, idx) => {
            const isCompleted = progress.completedExercises.includes(ex.id);
            const score = progress.scores[ex.id];
            
            // Sequential Unlocking Rule
            const isUnlocked = idx === 0 || progress.completedExercises.includes(exercises[idx - 1].id);

            // Text preview snippet
            const snippet = ex.text.length > 70 ? ex.text.substring(0, 70) + '...' : ex.text;

            return (
              <button
                key={ex.id}
                disabled={!isUnlocked}
                onClick={() => handleStartExercise(ex)}
                className="glass-card w-full p-4 flex items-start gap-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  borderColor: !isUnlocked
                    ? 'transparent'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.2)'
                    : idx === nextExerciseIndex
                    ? 'rgba(108, 99, 255, 0.4)'
                    : 'var(--border)',
                  background: !isUnlocked
                    ? 'rgba(255, 255, 255, 0.02)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.04)'
                    : idx === nextExerciseIndex
                    ? 'rgba(108, 99, 255, 0.06)'
                    : 'var(--bg-card)',
                }}
              >
                {/* Number */}
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    background: isCompleted
                      ? 'rgba(16, 185, 129, 0.15)'
                      : idx === nextExerciseIndex
                      ? 'rgba(108, 99, 255, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isCompleted
                      ? '#10b981'
                      : idx === nextExerciseIndex
                      ? 'var(--brand)'
                      : 'var(--text-muted)',
                    border: isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : idx === nextExerciseIndex
                      ? '1px solid rgba(108, 99, 255, 0.3)'
                      : '1px solid transparent',
                  }}
                >
                  {idx + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {ex.title}
                    </span>
                  </div>
                  <p className="text-xs italic line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                    "{snippet}"
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0 flex items-center h-8">
                  {!isUnlocked ? (
                    <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                  ) : isCompleted ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">{score}%</span>
                    </div>
                  ) : idx === nextExerciseIndex ? (
                    <Play size={16} style={{ color: 'var(--brand)' }} />
                  ) : (
                    <Play size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Play/Continue Button */}
      <button
        onClick={handleContinue}
        className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold"
      >
        {completedCount === totalCount ? (
          <>
            <Award size={22} />
            Ulangi Set Latihan
          </>
        ) : (
          <>
            <Play size={22} />
            Lanjutkan Latihan
          </>
        )}
      </button>
    </div>
  );
}
