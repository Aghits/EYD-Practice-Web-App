import React, { useEffect, useRef, useMemo } from 'react';
import { Trophy, Star, Zap, RefreshCw, Home, ChevronRight, Target, X, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateExercise, getExerciseById } from '../utils/gemini';
import setsData from '../data/sets.json';
import InteractiveText from './InteractiveText';
import FeedbackPanel from './FeedbackPanel';
import { tokenizeText, buildErrorSet, enrichErrors } from '../utils/tokenizer';

export default function ResultsScreen() {
  const { result, currentExercise, selectedTokenIds, modifiedTokens, settings, resetExercise, startExercise, goTo, streak, xp, activeCategory, currentSetId, setProgress } = useAppStore();
  const hasAnimated = useRef(false);

  if (!result || !currentExercise) {
    goTo('home');
    return null;
  }

  const tokens = useMemo(
    () => (currentExercise ? tokenizeText(currentExercise.text) : []),
    [currentExercise?.text]
  );

  const enrichedErrors = useMemo(
    () => (currentExercise ? enrichErrors(tokens, currentExercise.errors, currentExercise.text) : []),
    [tokens, currentExercise?.errors, currentExercise?.text]
  );

  const { tp, fp, missed, accuracy, xp: gainedXp, perfect } = result;

  const getGrade = (acc) => {
    if (acc === 100) return { label: 'Sempurna!', color: '#00d9a0', emoji: '🏆' };
    if (acc >= 80)  return { label: 'Bagus!',     color: '#a78bfa', emoji: '⭐' };
    if (acc >= 50)  return { label: 'Cukup',      color: '#fbbf24', emoji: '👍' };
    return           { label: 'Terus Latihan', color: '#f87171', emoji: '💪' };
  };

  const grade = getGrade(accuracy);

  const currentSet = useMemo(() => {
    if (!currentSetId) return null;
    return setsData.find(s => s.id === currentSetId);
  }, [currentSetId]);

  const setProgressInfo = useMemo(() => {
    if (!currentSetId) return null;
    return setProgress[currentSetId] || { completedExercises: [], scores: {}, stars: 0 };
  }, [currentSetId, setProgress]);

  const allCompleted = useMemo(() => {
    if (!currentSet || !setProgressInfo) return false;
    const completedCount = currentSet.exerciseIds.filter(id => setProgressInfo.completedExercises.includes(id)).length;
    return completedCount === currentSet.exerciseIds.length;
  }, [currentSet, setProgressInfo]);

  const nextExId = useMemo(() => {
    if (!currentSet || !setProgressInfo) return null;
    const completed = setProgressInfo.completedExercises || [];
    return currentSet.exerciseIds.find(id => !completed.includes(id));
  }, [currentSet, setProgressInfo]);

  const handleNext = async () => {
    const diff = currentExercise.difficulty;
    const currentId = currentExercise.baseId || currentExercise.id;
    const ex = await generateExercise(settings.geminiApiKey, diff, activeCategory, currentId);
    startExercise(ex, activeCategory);
  };

  const handleNextSetExercise = () => {
    if (nextExId) {
      const ex = getExerciseById(nextExId);
      if (ex) {
        const sessionExercise = {
          ...ex,
          baseId: ex.id,
          id: `set_${currentSetId}_${ex.id}_${Date.now()}`
        };
        startExercise(sessionExercise, null);
      }
    }
  };

  const handleTryAgain = () => {
    startExercise({ ...currentExercise });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-slide-up">
      {/* Set Completion Celebration */}
      {allCompleted && currentSet && setProgressInfo && (
        <div className="glass-card p-6 text-center space-y-4 border-yellow-500/30 bg-yellow-500/5 animate-pop">
          <div className="text-4xl animate-bounce">🎉 Set Selesai! 🎉</div>
          <h3 className="text-lg font-extrabold text-yellow-400">Selamat! Anda menyelesaikan Set "{currentSet.title}"</h3>
          <div className="flex justify-center gap-1.5 pt-1">
            {[1, 2, 3].map(s => (
              <Star
                key={s}
                size={30}
                fill={s <= setProgressInfo.stars ? '#fbbf24' : 'none'}
                style={{ color: s <= setProgressInfo.stars ? '#fbbf24' : 'var(--text-muted)' }}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Bintang diperoleh berdasarkan akurasi rata-rata seluruh soal dalam set ini.
          </p>
        </div>
      )}

      {/* Grade card */}
      <div
        className="glass-card p-6 text-center space-y-3 relative overflow-hidden"
        style={{ borderColor: `${grade.color}33` }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${grade.color}, transparent 70%)` }}
        />
        <div className="text-5xl">{grade.emoji}</div>
        <h2 className="text-2xl font-extrabold" style={{ color: grade.color }}>{grade.label}</h2>

        {perfect && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold animate-pop"
            style={{ background: 'rgba(0,217,160,0.15)', color: '#00d9a0', border: '1px solid rgba(0,217,160,0.3)' }}
          >
            <Star size={14} />Perfect Round! +20 Bonus XP
          </div>
        )}

        {/* Accuracy ring + score */}
        <div className="flex items-center justify-center">
          <AccuracyRing accuracy={accuracy} color={grade.color} />
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<CheckCircle size={20} style={{ color: '#00d9a0' }} />}
          value={tp}
          label="Benar"
          color="#00d9a0"
        />
        <StatCard
          icon={<X size={20} style={{ color: '#ff4757' }} />}
          value={fp}
          label="Salah Pilih"
          color="#ff4757"
        />
        <StatCard
          icon={<Target size={20} style={{ color: '#ffd166' }} />}
          value={missed}
          label="Terlewat"
          color="#ffd166"
        />
      </div>

      {/* Interactive Review */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Tinjauan Hasil Latihan
        </h3>
        <InteractiveText
          exercise={currentExercise}
          submitted={true}
          enrichedErrors={enrichedErrors}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold px-2 py-1 justify-center" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#00d9a0]" /> Benar (Sesuai)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#ff4757]" /> Salah Pilih</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#ffd166]" /> Terlewat</span>
        </div>

        <FeedbackPanel
          enrichedErrors={enrichedErrors}
          selectedTokenIds={selectedTokenIds}
          tokens={tokens}
          modifiedTokens={modifiedTokens}
        />
      </div>

      {/* XP gained */}
      <div
        className="glass-card p-4 flex items-center justify-between"
        style={{ borderColor: 'rgba(108,99,255,0.3)' }}
      >
        <div className="flex items-center gap-2">
          <Zap size={20} style={{ color: '#a89dff' }} />
          <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>XP Didapat</span>
        </div>
        <span className="text-2xl font-extrabold gradient-text animate-count-up">+{gainedXp}</span>
      </div>

      {/* Streak */}
      {streak > 1 && (
        <div
          className="glass-card p-3 flex items-center gap-3 animate-pop"
          style={{ borderColor: 'rgba(255,159,67,0.3)' }}
        >
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold text-sm" style={{ color: '#ff9f43' }}>{streak} Hari Berturut-turut!</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pertahankan streak-mu!</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleTryAgain} className="btn-ghost flex items-center justify-center gap-2">
          <RefreshCw size={16} />Ulangi
        </button>
        {currentSetId ? (
          nextExId ? (
            <button onClick={handleNextSetExercise} className="btn-primary flex items-center justify-center gap-2">
              Lanjutkan Set <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={resetExercise} className="btn-primary flex items-center justify-center gap-2">
              Kembali ke Set <ChevronRight size={16} />
            </button>
          )
        ) : (
          <button onClick={handleNext} className="btn-primary flex items-center justify-center gap-2">
            Soal Berikutnya <ChevronRight size={16} />
          </button>
        )}
      </div>

      {currentSetId && (
        <button onClick={resetExercise} className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all py-1.5" style={{ color: 'var(--text-muted)' }}>
          Kembali ke Detail Set
        </button>
      )}
      <button onClick={() => goTo('home')} className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all py-1.5" style={{ color: 'var(--text-muted)' }}>
        <Home size={15} /> Kembali ke Beranda
      </button>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card animate-pop">
      {icon}
      <span className="text-2xl font-extrabold" style={{ color }}>{value}</span>
      <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function AccuracyRing({ accuracy, color }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (accuracy / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" className="progress-ring absolute">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className="text-center">
        <div className="text-3xl font-extrabold" style={{ color }}>{accuracy}%</div>
        <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Akurasi</div>
      </div>
    </div>
  );
}

