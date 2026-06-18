import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, BookOpen, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORY_LABEL } from '../utils/gemini';
import { isErrorResolved } from '../utils/scoring';

export default function FeedbackPanel({ enrichedErrors, selectedTokenIds, tokens, modifiedTokens, focusedErrorIndex }) {
  const [expandedIndices, setExpandedIndices] = useState(new Set());

  // Listen for focused error selections from parent/InteractiveText to auto-expand & scroll
  useEffect(() => {
    if (focusedErrorIndex && focusedErrorIndex.index !== undefined) {
      const idx = focusedErrorIndex.index;
      setExpandedIndices((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });

      // Smooth scroll to the targeted error card
      setTimeout(() => {
        const el = document.getElementById(`error-card-${idx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [focusedErrorIndex]);

  const toggleExpand = (idx) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <h3 className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
        Penjelasan Kesalahan
      </h3>

      {enrichedErrors.map((err, idx) => {
        const wasFound = isErrorResolved(err, selectedTokenIds, modifiedTokens, tokens);
        const isExpanded = expandedIndices.has(idx);

        return (
          <ErrorCard
            key={idx}
            idx={idx}
            err={err}
            found={wasFound}
            isExpanded={isExpanded}
            onToggle={toggleExpand}
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

function ErrorCard({ err, idx, found, isExpanded, onToggle, delay }) {
  const catLabel = CATEGORY_LABEL[err.category] ?? err.category;

  return (
    <div
      id={`error-card-${idx}`}
      className="glass-card p-4 space-y-3 animate-slide-up transition-all duration-300"
      style={{
        animationDelay: `${delay}ms`,
        borderLeft: `3px solid ${found ? 'var(--success)' : 'var(--warning)'}`,
      }}
    >
      {/* Collapsible Header */}
      <div
        onClick={() => onToggle(idx)}
        className="flex items-center gap-2 cursor-pointer select-none py-0.5 w-full justify-between"
      >
        <div className="flex items-center gap-2 flex-wrap text-left">
          {found ? (
            <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--success)' }} />
          ) : (
            <AlertCircle size={16} className="shrink-0" style={{ color: 'var(--warning)' }} />
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
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
              className="text-sm font-bold"
              style={{
                color: 'var(--success)',
                fontStyle: (err.category === 'italic' || err.italic) ? 'italic' : 'normal',
              }}
              dangerouslySetInnerHTML={{ __html: err.correct }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="category-chip text-[10px] flex items-center gap-1">
            <Tag size={10} />
            {catLabel}
          </span>
          {isExpanded ? (
            <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t border-white/5 animate-fade-in">
          <div
            className="flex items-start gap-2 rounded-xl p-3 text-sm"
            style={{ background: 'rgba(108,99,255,0.08)', color: 'var(--text-primary)' }}
          >
            <BookOpen size={14} className="mt-0.5 shrink-0" style={{ color: '#a89dff' }} />
            <span>{err.explanation}</span>
          </div>

          {err.rule && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📘 Kaidah: <span className="font-semibold">{err.rule}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
