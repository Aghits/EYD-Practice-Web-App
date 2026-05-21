import React from 'react';
import { AlertCircle, CheckCircle2, BookOpen, Tag } from 'lucide-react';
import { CATEGORY_LABEL } from '../utils/gemini';
import { isErrorResolved } from '../utils/scoring';


export default function FeedbackPanel({ enrichedErrors, selectedTokenIds, tokens, modifiedTokens }) {
  const correctly   = enrichedErrors.filter(e => isErrorResolved(e, selectedTokenIds, modifiedTokens, tokens));
  const missed      = enrichedErrors.filter(e => !isErrorResolved(e, selectedTokenIds, modifiedTokens, tokens));

  return (
    <div className="space-y-3 animate-slide-up">
      <h3 className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
        Penjelasan Kesalahan
      </h3>

      {enrichedErrors.map((err, idx) => {
        const wasFound = isErrorResolved(err, selectedTokenIds, modifiedTokens, tokens);
        return (
          <ErrorCard
            key={idx}
            err={err}
            found={wasFound}
            delay={idx * 80}
          />
        );
      })}

      {enrichedErrors.length === 0 && (
        <p className="text-sm py-3 text-center" style={{ color: 'var(--text-muted)' }}>
          Tidak ada kesalahan yang terdeteksi dalam soal ini.
        </p>
      )}
    </div>
  );
}

function ErrorCard({ err, found, delay }) {
  const catLabel = CATEGORY_LABEL[err.category] ?? err.category;
  return (
    <div
      className="glass-card p-4 space-y-2 animate-slide-up"
      style={{
        animationDelay: `${delay}ms`,
        borderLeft: `3px solid ${found ? 'var(--success)' : 'var(--warning)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 flex-wrap">
        {found
          ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
          : <AlertCircle  size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
        }
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm line-through"
            style={{
              color: 'var(--danger)',
              fontStyle: err.italic ? 'italic' : 'normal',
              fontWeight: 'normal',
            }}
            dangerouslySetInnerHTML={{ __html: err.word }}
          />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span
            className="text-sm"
            style={{
              color: 'var(--success)',
              fontStyle: (err.category === 'italic' || err.italic) ? 'italic' : 'normal',
              fontWeight: 'normal',
            }}
            dangerouslySetInnerHTML={{ __html: err.correct }}
          />
        </div>
        <span className="ml-auto category-chip flex items-center gap-1">
          <Tag size={10} />
          {catLabel}
        </span>
      </div>

      {/* Explanation */}
      <div
        className="flex items-start gap-2 rounded-xl p-3 text-sm"
        style={{ background: 'rgba(108,99,255,0.08)', color: 'var(--text-primary)' }}
      >
        <BookOpen size={14} className="mt-0.5 shrink-0" style={{ color: '#a89dff' }} />
        <span>{err.explanation}</span>
      </div>

      {/* Rule badge */}
      {err.rule && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          📘 Kaidah: <span className="font-semibold">{err.rule}</span>
        </p>
      )}
    </div>
  );
}
