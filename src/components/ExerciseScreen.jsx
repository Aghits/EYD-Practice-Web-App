import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Lightbulb, Send, MousePointerClick } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { tokenizeText, buildErrorSet, enrichErrors } from '../utils/tokenizer';
import { computeResult, shouldReplacePunctuation, getPunctuationPlacement } from '../utils/scoring';
import { CATEGORY_LABEL } from '../utils/gemini';
import InteractiveText from './InteractiveText';
import FeedbackPanel from './FeedbackPanel';

const DIFF_LABEL = { beginner: 'Pemula', intermediate: 'Menengah', advanced: 'Mahir' };
const DIFF_CLASS = { beginner: 'badge-beginner', intermediate: 'badge-intermediate', advanced: 'badge-advanced' };

export default function ExerciseScreen() {
  const { currentExercise, selectedTokenIds, modifiedTokens, submitted, submitAnswer, resetExercise, goTo, activePunctuation, setActivePunctuation } = useAppStore();
  const [hintLevel, setHintLevel] = useState(0);
  const [isPuncBankOpen, setIsPuncBankOpen] = useState(false);

  // Cache the last valid exercise locally so it remains rendered during exit transitions
  const [cachedExercise, setCachedExercise] = useState(null);

  const exercise = currentExercise || cachedExercise;

  useEffect(() => {
    if (currentExercise) {
      setCachedExercise(currentExercise);
    }
  }, [currentExercise]);

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

  if (!exercise) return null;

  const handleSubmit = () => {
    if (selCount < 2) {
      const confirmSubmit = window.confirm("Kamu baru memilih 1, yakin mau periksa?");
      if (!confirmSubmit) return;
    }
    const result = computeResult(selectedTokenIds, errorIds, enrichedErrors, tokens, modifiedTokens);
    // Pass enriched errors (with tokenIds) to the store
    exercise._enrichedErrors = enrichedErrors;
    submitAnswer(result);
  };

  const selCount = selectedTokenIds.size;

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

      {/* Interactive text */}
      <InteractiveText
        exercise={exercise}
        submitted={submitted}
        enrichedErrors={enrichedErrors}
      />

      {/* Hint */}
      {!submitted && (
        <div className="space-y-2">
          <button
            onClick={() => {
              if (hintLevel === 3) {
                setHintLevel(0);
              } else {
                setHintLevel(hintLevel + 1);
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold transition-all"
            style={{ color: '#fb923c' }}
          >
            <Lightbulb size={15} />
            {hintLevel > 0 ? `Petunjuk (Level ${hintLevel}/3): Lihat berikutnya` : 'Tampilkan petunjuk'}
          </button>
          
          {hintLevel > 0 && (
            <div
              className="rounded-xl p-3 text-sm animate-fade-in space-y-2"
              style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fbbf24' }}
            >
              {hintLevel >= 1 && (
                <p>
                  💡 <strong>Petunjuk 1:</strong> Ada beberapa kesalahan ejaan, tanda baca, atau penulisan kata dalam paragraf ini. Periksa dengan teliti setiap kata.
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
                  🎯 <strong>Petunjuk 3 (Jumlah):</strong> Terdapat tepat <strong className="text-base text-white bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/20">{exercise.errors.length}</strong> kesalahan dalam paragraf ini.
                </p>
              )}
              
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setHintLevel(0)}
                  className="text-xs hover:underline"
                  style={{ color: '#fb923c' }}
                >
                  Sembunyikan Petunjuk
                </button>
              </div>
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

      {/* Submit / feedback */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selCount === 0}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Send size={16} />
          Periksa Jawaban
        </button>
      ) : (
        <div className="space-y-5">
          <FeedbackPanel
            enrichedErrors={enrichedErrors}
            selectedTokenIds={selectedTokenIds}
            tokens={tokens}
            modifiedTokens={modifiedTokens}
          />

          {/* Side-by-side Diff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {/* Teks Anda */}
            <div className="glass-card p-4 space-y-2 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Teks Anda
              </h4>
              <p className="text-base font-medium leading-loose text-white/80">
                {renderUserDiffText(tokens, selectedTokenIds, modifiedTokens, enrichedErrors)}
              </p>
            </div>

            {/* Teks yang Benar */}
            <div className="glass-card p-4 space-y-2 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Teks yang Benar
              </h4>
              <p className="text-base font-medium leading-loose">
                {renderCorrectDiffText(tokens, enrichedErrors)}
              </p>
            </div>
          </div>

          <button
            onClick={() => goTo('results')}
            className="btn-primary w-full"
          >
            Lihat Hasil →
          </button>
        </div>
      )}
    </div>
  );
}

function buildCorrectedText(text, errors) {
  // Clean the markdown markers from the text first
  const cleanText = text.replace(/\*\*|\*/g, '');
  
  // 1. Map each error to its starting character index using the occurrence property on cleanText
  const errorsWithIndex = errors.map(err => {
    let startIndex = -1;
    const occurrence = err.occurrence ?? 0;
    
    // Clean asterisks from the error word too, just in case
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

  // Filter out any errors that we couldn't find in the text
  const validErrors = errorsWithIndex.filter(err => err.start !== -1);

  // 2. Sort the errors by start index in descending order (highest index first)
  validErrors.sort((a, b) => b.start - a.start);

  // 3. Apply the replacements in reverse order to avoid index shifts
  let result = cleanText;
  validErrors.forEach(err => {
    result = result.substring(0, err.start) + err.correct + result.substring(err.end);
  });

  return result;
}

function renderUserDiffText(tokens, selectedTokenIds, modifiedTokens, enrichedErrors) {
  const errorMap = {};
  (enrichedErrors || []).forEach((e) => {
    e.tokenIds.forEach((id) => (errorMap[id] = e));
  });

  return tokens.map((tok) => {
    if (tok.type === 'space') {
      return <span key={tok.id} className="whitespace-pre-wrap">{tok.text}</span>;
    }

    const errInfo = errorMap[tok.id];
    const correctText = errInfo ? errInfo.correct : null;
    const isSelected = selectedTokenIds.has(tok.id);

    let tokText = tok.text;
    let styleClass = '';

    if (modifiedTokens && modifiedTokens[tok.id] !== undefined) {
      const appendedPunc = modifiedTokens[tok.id];
      const isCorrect = errInfo && errInfo.correct && errInfo.correct.includes(appendedPunc);
      styleClass = isCorrect ? 'text-[var(--success)] font-bold' : 'text-[var(--danger)] font-bold';
      
      if (tok.type === 'punct' && shouldReplacePunctuation(tok.text, appendedPunc, correctText)) {
        return <span key={tok.id} className={styleClass}>{appendedPunc}</span>;
      } else {
        const placement = getPunctuationPlacement(tok.text, appendedPunc, correctText);
        if (placement === 'prepend') {
          return (
            <span key={tok.id}>
              <span className={styleClass}>{appendedPunc}</span>
              {tok.text}
            </span>
          );
        } else {
          return (
            <span key={tok.id}>
              {tok.text}
              <span className={styleClass}>{appendedPunc}</span>
            </span>
          );
        }
      }
    } else if (tok.type === 'punct' && isSelected) {
      return <span key={tok.id} className="text-[var(--danger)] line-through mx-0.5">{tok.text}</span>;
    }

    if (isSelected) {
      const isRealError = errInfo !== undefined;
      styleClass = isRealError ? 'text-[var(--success)] font-bold' : 'text-[var(--danger)] font-bold';
    }

    return (
      <span key={tok.id} className={styleClass}>
        {tokText}
      </span>
    );
  });
}

function renderCorrectDiffText(tokens, enrichedErrors) {
  const errorMap = {};
  const renderedErrors = new Set();
  (enrichedErrors || []).forEach((e) => {
    e.tokenIds.forEach((id) => (errorMap[id] = e));
  });

  return tokens.map((tok) => {
    if (tok.type === 'space') {
      return <span key={tok.id} className="whitespace-pre-wrap">{tok.text}</span>;
    }

    const errInfo = errorMap[tok.id];
    if (errInfo) {
      if (renderedErrors.has(errInfo.id)) {
        return null;
      }
      renderedErrors.add(errInfo.id);
      
      const cleanCorrect = errInfo.correct.replace(/\*\*|\*/g, '');
      return (
        <span key={tok.id} className="text-[var(--success)] font-bold bg-[var(--success-dim)] px-1 py-0.5 rounded border border-[rgba(0,217,160,0.2)]">
          {cleanCorrect}
        </span>
      );
    }

    return <span key={tok.id}>{tok.text}</span>;
  });
}
