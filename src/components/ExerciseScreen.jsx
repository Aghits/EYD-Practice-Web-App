import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Lightbulb, Send, MousePointerClick, Star, Zap, RefreshCw, Home, ChevronRight, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { tokenizeText, buildErrorSet, enrichErrors } from '../utils/tokenizer';
import { computeResult, shouldReplacePunctuation, getPunctuationPlacement } from '../utils/scoring';
import { CATEGORY_LABEL, generateExercise, getExerciseById } from '../utils/gemini';
import setsData from '../data/sets.json';
import InteractiveText from './InteractiveText';
import FeedbackPanel from './FeedbackPanel';

const DIFF_LABEL = { beginner: 'Pemula', intermediate: 'Menengah', advanced: 'Mahir' };
const DIFF_CLASS = { beginner: 'badge-beginner', intermediate: 'badge-intermediate', advanced: 'badge-advanced' };

const getGrade = (acc) => {
  if (acc === 100) return { label: 'Sempurna!', color: '#00d9a0', emoji: '🏆' };
  if (acc >= 80)  return { label: 'Bagus!',     color: '#a78bfa', emoji: '⭐' };
  if (acc >= 50)  return { label: 'Cukup',      color: '#fbbf24', emoji: '👍' };
  return           { label: 'Terus Latihan', color: '#f87171', emoji: '💪' };
};

export default function ExerciseScreen() {
  const { 
    currentExercise, 
    selectedTokenIds, 
    modifiedTokens, 
    submitted, 
    result, 
    submitAnswer, 
    resetExercise, 
    startExercise, 
    goTo, 
    activePunctuation, 
    setActivePunctuation,
    streak,
    activeCategory,
    currentSetId,
    setProgress,
    settings
  } = useAppStore();

  const [hintLevel, setHintLevel] = useState(0);
  const [isPuncBankOpen, setIsPuncBankOpen] = useState(false);
  const [showConfirmInline, setShowConfirmInline] = useState(false);
  const [focusedErrorIndex, setFocusedErrorIndex] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Cache the last valid exercise locally so it remains rendered during exit transitions
  const [cachedExercise, setCachedExercise] = useState(null);
  const [cachedResult, setCachedResult] = useState(null);

  const exercise = currentExercise || cachedExercise;
  const displayResult = result || cachedResult;

  useEffect(() => {
    if (currentExercise) {
      setCachedExercise(currentExercise);
    }
  }, [currentExercise]);

  useEffect(() => {
    if (result) {
      setCachedResult(result);
    }
  }, [result]);

  const tokens = useMemo(
    () => (exercise ? tokenizeText(exercise.text) : []),
    [exercise?.text]
  );

  const errorIds = useMemo(
    () => (exercise ? buildErrorSet(tokens, exercise.errors, exercise.text) : new Set()),
    [tokens, exercise?.errors, exercise?.text]
  );

  const enrichedErrors = useMemo(
    () => (exercise ? enrichErrors(tokens, exercise.errors, exercise.text) : []),
    [tokens, exercise?.errors, exercise?.text]
  );

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

  if (!exercise) return null;

  const handleSubmit = () => {
    const computed = computeResult(selectedTokenIds, errorIds, enrichedErrors, tokens, modifiedTokens);
    // Pass enriched errors (with tokenIds) to the store
    exercise._enrichedErrors = enrichedErrors;
    submitAnswer(computed);
  };

  const handleNext = async () => {
    setIsGenerating(true);
    try {
      const diff = exercise.difficulty;
      const currentId = exercise.baseId || exercise.id;
      const ex = await generateExercise(settings.geminiApiKey, diff, activeCategory, currentId);
      startExercise(ex, activeCategory);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
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
    startExercise({ ...exercise });
  };

  const selCount = selectedTokenIds.size;
  const grade = displayResult ? getGrade(displayResult.accuracy) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={resetExercise}
          className="p-2 rounded-lg hover:bg-neutral-800/10 active:scale-95 transition-all flex items-center justify-center"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <ChevronLeft size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={DIFF_CLASS[exercise.difficulty]}>
              {DIFF_LABEL[exercise.difficulty]}
            </span>
            {submitted && exercise.categories?.map((c) => (
              <span key={c} className="category-chip">{CATEGORY_LABEL[c] ?? c}</span>
            ))}
            {exercise.aiGenerated && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }}>
                ✨ AI
              </span>
            )}
          </div>
          <h2 className="font-bold text-base mt-1" style={{ color: 'var(--text-primary)' }}>
            {exercise.title}
          </h2>
        </div>
      </div>

      {/* Instruction */}
      {!submitted && (
        <div
          className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm animate-fade-in"
          style={{ background: 'var(--brand-dim)', border: '1px solid rgba(108,99,255,0.2)', color: '#c5bfff' }}
        >
          <MousePointerClick size={16} className="mt-0.5 shrink-0" />
          <span>
            Ketuk/klik kata atau tanda baca yang <strong>salah</strong> menurut kaidah EYD V.
            {selCount > 0 && <span className="ml-2 font-bold text-white">{selCount} dipilih</span>}
          </span>
        </div>
      )}

      {/* 2. Compact Score Bar (Rendered only after submission) */}
      {submitted && grade && displayResult && (
        <div className="glass-card p-4 flex items-center justify-between animate-fade-in">
          {/* Left: Grade emoji + accuracy */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{grade.emoji}</span>
            <div className="text-left">
              <div className="text-xl font-extrabold" style={{ color: grade.color }}>
                {displayResult.accuracy}%
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {grade.label}
              </div>
            </div>
          </div>
          
          {/* Right: Stats inline */}
          <div className="flex gap-4">
            <MiniStat value={displayResult.tp} label="Benar" color="#00d9a0" />
            <MiniStat value={displayResult.fp} label="Salah" color="#ff4757" />
            <MiniStat value={displayResult.missed} label="Terlewat" color="#ffd166" />
          </div>
        </div>
      )}

      {/* 3. Set completion celebration */}
      {submitted && allCompleted && currentSet && setProgressInfo && (
        <div className="glass-card p-5 text-center space-y-3 border-yellow-500/30 bg-yellow-500/5 animate-pop">
          <div className="text-3xl animate-bounce">🎉 Set Selesai! 🎉</div>
          <h3 className="text-sm font-extrabold text-yellow-400">Selamat! Anda menyelesaikan Set "{currentSet.title}"</h3>
          <div className="flex justify-center gap-1.5 pt-1">
            {[1, 2, 3].map(s => (
              <Star
                key={s}
                size={26}
                fill={s <= setProgressInfo.stars ? '#fbbf24' : 'none'}
                style={{ color: s <= setProgressInfo.stars ? '#fbbf24' : 'var(--text-muted)' }}
              />
            ))}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Bintang diperoleh berdasarkan akurasi rata-rata seluruh soal dalam set ini.
          </p>
        </div>
      )}

      {/* Interactive text */}
      <div className="space-y-3">
        <InteractiveText
          exercise={exercise}
          submitted={submitted}
          enrichedErrors={enrichedErrors}
          onErrorTap={(idx) => setFocusedErrorIndex({ index: idx, ts: Date.now() })}
        />
        {submitted && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold px-2 py-1 justify-center animate-fade-in" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#00d9a0]" /> Benar</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#ff4757]" /> Salah</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#ffd166]" /> Terlewat</span>
          </div>
        )}
      </div>

      {/* Hint */}
      {!submitted && (
        <div className="space-y-2">
          {hintLevel < 3 && (
            <button
              onClick={() => setHintLevel(hintLevel + 1)}
              className="flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 text-left"
              style={{ color: '#fb923c' }}
            >
              <Lightbulb size={15} />
              {hintLevel === 0 ? '💡 Petunjuk' : hintLevel === 1 ? '💡 Petunjuk Lanjutan' : '💡 Petunjuk Terakhir'}
            </button>
          )}
          
          {hintLevel > 0 && (
            <div
              className="rounded-xl p-3 text-sm text-left animate-fade-in space-y-2"
              style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fbbf24' }}
            >
              {hintLevel >= 1 && (
                <p>
                  💡 <strong>Petunjuk 1:</strong> Ada beberapa kesalahan dalam teks ini.
                </p>
              )}
              {hintLevel >= 2 && (
                <p>
                  🔍 <strong>Petunjuk 2 (Kategori):</strong> Kesalahan mencakup bidang{' '}
                  {exercise.categories?.map((c, idx) => (
                    <React.Fragment key={c}>
                      {idx > 0 && ', '}
                      <span className="font-bold underline">{CATEGORY_LABEL[c] ?? c}</span>
                    </React.Fragment>
                  ))}.
                </p>
              )}
              {hintLevel >= 3 && (
                <p>
                  🎯 <strong>Petunjuk 3 (Jumlah):</strong> Jumlah kesalahan: <strong className="text-base text-white bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/20">{exercise.errors.length}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Punctuation Bank */}
      {!submitted && (
        <div className="glass-card p-3 space-y-3">
          <button
            onClick={() => setIsPuncBankOpen(!isPuncBankOpen)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider px-2 py-1.5 hover:bg-white/5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-2">
              📂 Sisipkan Tanda Baca
              {activePunctuation && (
                <span className="normal-case bg-[var(--brand-dim)] text-[var(--brand)] px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[rgba(108,99,255,0.2)] animate-pulse">
                  Aktif: <strong className="text-sm font-bold">{activePunctuation}</strong>
                </span>
              )}
            </span>
            <span className={`transition-transform duration-200 ${isPuncBankOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {isPuncBankOpen && (
            <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-white/5 animate-fade-in">
              {['.', ',', ':', ';', '?', '-', '—', '/', '"', "'", '(', ')'].map(punc => (
                <button
                  key={punc}
                  onClick={() => {
                    setActivePunctuation(activePunctuation === punc ? null : punc);
                    setIsPuncBankOpen(false); // Auto-collapsing after a punctuation is selected
                  }}
                  className={`w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                    activePunctuation === punc 
                      ? 'bg-[var(--brand)] text-white shadow-[0_0_15px_rgba(108,99,255,0.4)] scale-110' 
                      : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  {punc}
                </button>
              ))}
            </div>
          )}

          {activePunctuation && (
            <div className="flex items-center justify-between bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.15)] rounded-xl px-3 py-2 text-xs animate-fade-in">
              <span className="font-medium text-left" style={{ color: 'var(--brand)' }}>
                Ketuk kata pada kalimat di atas untuk menyisipkan tanda baca <strong className="text-sm font-bold">{activePunctuation}</strong>
              </span>
              <button 
                onClick={() => setActivePunctuation(null)}
                className="text-[var(--text-muted)] hover:text-white font-semibold underline px-1.5 py-0.5 rounded hover:bg-white/5"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Error cards collapsible + linked */}
      {submitted && (
        <FeedbackPanel
          enrichedErrors={enrichedErrors}
          selectedTokenIds={selectedTokenIds}
          tokens={tokens}
          modifiedTokens={modifiedTokens}
          focusedErrorIndex={focusedErrorIndex}
        />
      )}

      {/* 6. Side-by-side corrected text diff comparison */}
      {submitted && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="font-bold text-sm text-left" style={{ color: 'var(--text-muted)' }}>
            Perbandingan Teks
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="glass-card p-4 space-y-2 text-left flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Teks Salah
              </h4>
              <p className="text-base font-medium leading-loose">
                {buildHighlightedDiff(exercise.text, exercise.errors, 'wrong')}
              </p>
            </div>

            <div className="glass-card p-4 space-y-2 text-left flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Teks Benar
              </h4>
              <p className="text-base font-medium leading-loose">
                {buildHighlightedDiff(exercise.text, exercise.errors, 'correct')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. XP gained + streak */}
      {submitted && displayResult && (
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          <div className="glass-card p-3 flex-1 flex items-center justify-between" style={{ borderColor: 'rgba(108,99,255,0.2)' }}>
            <div className="flex items-center gap-2 text-sm">
              <Zap size={16} style={{ color: '#a89dff' }} />
              <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>XP Didapat</span>
            </div>
            <span className="text-lg font-extrabold gradient-text">+{displayResult.xp}</span>
          </div>

          {streak > 1 && (
            <div className="glass-card p-3 flex-1 flex items-center gap-2 animate-pop" style={{ borderColor: 'rgba(255,159,67,0.2)' }}>
              <span className="text-lg">🔥</span>
              <div className="text-left">
                <span className="font-bold text-xs" style={{ color: '#ff9f43' }}>{streak} Hari Berturut-turut!</span>
                <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>Pertahankan streak-mu!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit / Action buttons */}
      {!submitted ? (
        <>
          {showConfirmInline ? (
            <div className="glass-card p-4 space-y-3 border-amber-500/30 bg-amber-500/5 text-center animate-fade-in">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Kamu baru memilih {selCount} kata. Yakin mau periksa?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowConfirmInline(false);
                    handleSubmit();
                  }}
                  className="btn-primary py-2 px-4 text-xs font-bold"
                >
                  Ya, Periksa
                </button>
                <button
                  onClick={() => setShowConfirmInline(false)}
                  className="btn-ghost py-2 px-4 text-xs font-bold"
                >
                  Kembali
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (selCount < 2) {
                  setShowConfirmInline(true);
                } else {
                  handleSubmit();
                }
              }}
              disabled={selCount === 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Periksa Jawaban
            </button>
          )}
        </>
      ) : (
        <div className="space-y-3">
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
              <button 
                onClick={handleNext} 
                disabled={isGenerating} 
                className="btn-primary flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : null}
                Soal Berikutnya <ChevronRight size={16} />
              </button>
            )}
          </div>

          <button onClick={() => goTo('home')} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1 hover:underline" style={{ color: 'var(--text-muted)' }}>
            <Home size={14} /> Kembali ke Beranda
          </button>
        </div>
      )}
    </div>
  );
}

function MiniStat({ value, label, color }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-extrabold" style={{ color }}>{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function buildHighlightedDiff(text, errors, type) {
  if (!text) return null;
  const cleanText = text.replace(/\*\*|\*/g, '');
  
  const errorsWithIndex = errors.map(err => {
    let startIndex = -1;
    const occurrence = err.occurrence ?? 0;
    const cleanWord = err.word.replace(/\*\*|\*/g, '');
    const cleanCorrect = err.correct ? err.correct.replace(/\*\*|\*/g, '') : '';
    
    for (let i = 0; i <= occurrence; i++) {
      startIndex = cleanText.indexOf(cleanWord, startIndex + 1);
      if (startIndex === -1) break;
    }
    return {
      ...err,
      word: cleanWord,
      correct: cleanCorrect,
      start: startIndex,
      end: startIndex !== -1 ? startIndex + cleanWord.length : -1
    };
  });

  const validErrors = errorsWithIndex.filter(err => err.start !== -1);
  validErrors.sort((a, b) => a.start - b.start);

  let lastIndex = 0;
  const elements = [];

  validErrors.forEach((err, idx) => {
    if (err.start > lastIndex) {
      elements.push(
        <span key={`normal-${idx}`} className="whitespace-pre-wrap font-medium text-white/70">
          {cleanText.substring(lastIndex, err.start)}
        </span>
      );
    }

    if (type === 'wrong') {
      elements.push(
        <span key={`wrong-${idx}`} className="text-[var(--danger)] line-through font-bold bg-[var(--danger-dim)] px-1 py-0.5 rounded border border-[rgba(255,71,87,0.2)] mx-0.5 whitespace-pre-wrap">
          {err.word}
        </span>
      );
    } else {
      elements.push(
        <span key={`correct-${idx}`} className="text-[var(--success)] font-bold bg-[var(--success-dim)] px-1 py-0.5 rounded border border-[rgba(0,217,160,0.2)] mx-0.5 whitespace-pre-wrap">
          {err.correct}
        </span>
      );
    }

    lastIndex = err.end;
  });

  if (lastIndex < cleanText.length) {
    elements.push(
      <span key="normal-end" className="whitespace-pre-wrap font-medium text-white/70">
        {cleanText.substring(lastIndex)}
      </span>
    );
  }

  return elements;
}
