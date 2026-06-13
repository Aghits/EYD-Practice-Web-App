import React, { useMemo, useState } from 'react';
import { ChevronLeft, Lightbulb, Send, MousePointerClick } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { tokenizeText, buildErrorSet, enrichErrors } from '../utils/tokenizer';
import { computeResult } from '../utils/scoring';
import { CATEGORY_LABEL } from '../utils/gemini';
import InteractiveText from './InteractiveText';

import FeedbackPanel from './FeedbackPanel';

const DIFF_LABEL = { beginner: 'Pemula', intermediate: 'Menengah', advanced: 'Mahir' };
const DIFF_CLASS = { beginner: 'badge-beginner', intermediate: 'badge-intermediate', advanced: 'badge-advanced' };

export default function ExerciseScreen() {
  const { currentExercise, selectedTokenIds, modifiedTokens, submitted, submitAnswer, resetExercise, goTo, activePunctuation, setActivePunctuation } = useAppStore();
  const [showHint, setShowHint] = useState(false);

  const exercise = currentExercise;

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
            {exercise.categories?.map((c) => (
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
        <div>
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-sm font-semibold transition-all"
            style={{ color: '#fb923c' }}
          >
            <Lightbulb size={15} />
            {showHint ? 'Sembunyikan petunjuk' : 'Tampilkan petunjuk'}
          </button>
          {showHint && (
            <div
              className="mt-2 rounded-xl p-3 text-sm animate-fade-in"
              style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fbbf24' }}
            >
              Ada <strong>{exercise.errors.length}</strong> kesalahan dalam paragraf ini.
              Kategori: {exercise.categories?.map(c => <span key={c} className="category-chip mx-0.5">{CATEGORY_LABEL[c] ?? c}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Punctuation Bank */}
      {!submitted && (
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
            Sisipkan Tanda Baca
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            {['.', ',', ':', ';', '?', '-', '—', '/', '"', "'", '(', ')'].map(punc => (
              <button
                key={punc}
                onClick={() => setActivePunctuation(activePunctuation === punc ? null : punc)}
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
          {activePunctuation && (
            <p className="text-xs text-center animate-fade-in font-medium" style={{ color: 'var(--brand)' }}>
              Pilih kata di atas untuk menyisipkan <strong className="text-lg">{activePunctuation}</strong>
            </p>
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

          {/* Corrected text */}
          <div className="glass-card p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Teks yang Benar
            </h4>
            <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--success)' }}>
              {buildCorrectedText(exercise.text, exercise.errors)}
            </p>
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
