import React, { useMemo } from 'react';
import { shouldReplacePunctuation, getPunctuationPlacement } from '../utils/scoring';

export default function ModifiedPreview({ tokens, selectedTokenIds, modifiedTokens, enrichedErrors }) {
  const errorMap = useMemo(() => {
    const map = {};
    (enrichedErrors || []).forEach((e) => {
      if (e.tokenIds) {
        e.tokenIds.forEach((id) => (map[id] = e));
      }
    });
    return map;
  }, [enrichedErrors]);

  const previewElements = useMemo(() => {
    if (!tokens || !tokens.length) return null;
    
    return tokens.map((tok) => {
      let tokText = tok.text;
      if (tok.type === 'space') {
        return <span key={tok.id} className="whitespace-pre-wrap">{tokText}</span>;
      }

      const errInfo = errorMap[tok.id];
      const correctText = errInfo ? errInfo.correct : null;

      if (modifiedTokens && modifiedTokens[tok.id] !== undefined) {
        const appendedPunc = modifiedTokens[tok.id];
        if (tok.type === 'punct' && shouldReplacePunctuation(tok.text, appendedPunc, correctText)) {
          return (
            <span key={tok.id} className="text-[var(--brand)] font-extrabold underline decoration-2">
              {appendedPunc}
            </span>
          );
        } else {
          const placement = getPunctuationPlacement(tok.text, appendedPunc, correctText);
          if (placement === 'prepend') {
            return (
              <span key={tok.id}>
                <span className="text-[var(--brand)] font-extrabold underline decoration-2">{appendedPunc}</span>
                {tok.text}
              </span>
            );
          } else {
            return (
              <span key={tok.id}>
                {tok.text}
                <span className="text-[var(--brand)] font-extrabold underline decoration-2">{appendedPunc}</span>
              </span>
            );
          }
        }
      } else if (tok.type === 'punct' && selectedTokenIds.has(tok.id)) {
        // Punctuation is selected to be deleted (hidden from preview)
        return null;
      }

      return <span key={tok.id}>{tokText}</span>;
    });
  }, [tokens, selectedTokenIds, modifiedTokens, errorMap]);

  return (
    <div className="glass-card p-4 space-y-2 border border-dashed border-white/10 bg-white/[0.01] animate-fade-in text-left">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
        Pratinjau Kalimat Anda
      </h4>
      <p className="text-base font-medium leading-relaxed text-[var(--text-primary)]">
        {previewElements}
      </p>
    </div>
  );
}
