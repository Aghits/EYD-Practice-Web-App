import React, { useMemo } from 'react';
import { tokenizeText, buildErrorSet, enrichErrors } from '../utils/tokenizer';
import { useAppStore } from '../store/useAppStore';
import { isErrorResolved, getPunctuationPlacement, shouldReplacePunctuation } from '../utils/scoring';

const CATEGORY_COLORS = {
  capitalization: '#a78bfa',
  punctuation:    '#38bdf8',
  comma:          '#34d399',
  spacing:        '#f472b6',
  abbreviation:   '#fb923c',
  affix:          '#e879f9',
  preposition:    '#22d3ee',
  compound:       '#4ade80',
  loanword:       '#facc15',
  numeral:        '#f87171',
  pronoun:        '#60a5fa',
  particle:       '#a3e635',
  formal:         '#fb7185',
  structure:      '#818cf8',
  foreign:        '#2dd4bf',
};

// Smart punctuation placement and replacement helper functions are imported from scoring.js

export default function InteractiveText({ exercise, submitted, enrichedErrors }) {
  const { selectedTokenIds, toggleToken, modifiedTokens } = useAppStore();

  const tokens = useMemo(
    () => (exercise ? tokenizeText(exercise.text) : []),
    [exercise?.text]
  );

  const errorIds = useMemo(
    () => (exercise ? buildErrorSet(tokens, exercise.errors, exercise.text) : new Set()),
    [tokens, exercise?.errors, exercise?.text]
  );

  const errorMap = useMemo(() => {
    const map = {};
    (enrichedErrors || []).forEach((e) => {
      e.tokenIds.forEach((id) => (map[id] = e));
    });
    return map;
  }, [enrichedErrors]);

  const logicallySelectedTokenIds = useMemo(() => {
    if (!submitted) return selectedTokenIds;
    const expanded = new Set(selectedTokenIds);
    (enrichedErrors || []).forEach(err => {
      if (err.tokenIds && err.tokenIds.some(id => selectedTokenIds.has(id))) {
        err.tokenIds.forEach(id => expanded.add(id));
      }
    });
    return expanded;
  }, [selectedTokenIds, submitted, enrichedErrors]);

  const italicTokenIds = useMemo(() => {
    const ids = new Set();
    if (!exercise || !exercise.italicWords || !exercise.italicWords.length || !tokens.length) return ids;

    const lowerText = exercise.text.toLowerCase();

    exercise.italicWords.forEach((phrase) => {
      if (!phrase) return;
      const lowerPhrase = phrase.toLowerCase();
      let startIdx = 0;
      while (true) {
        startIdx = lowerText.indexOf(lowerPhrase, startIdx);
        if (startIdx === -1) break;
        const endIdx = startIdx + phrase.length;

        tokens.forEach((tok) => {
          if (!tok.clickable) return;
          if (tok.startChar >= startIdx && tok.endChar <= endIdx) {
            ids.add(tok.id);
          }
        });

        startIdx += phrase.length;
      }
    });

    return ids;
  }, [tokens, exercise?.italicWords, exercise?.text]);

  const paragraphs = useMemo(() => {
    if (!tokens.length) return [];
    const result = [];
    let currentParagraph = [];

    tokens.forEach((tok) => {
      if (tok.type === 'space') {
        const newlineCount = (tok.text.match(/\n/g) || []).length;
        if (newlineCount >= 2) {
          if (currentParagraph.length > 0) {
            result.push(currentParagraph);
            currentParagraph = [];
          }
        } else {
          // Normalize single newlines to regular spaces to prevent layout/word-wrapping bugs
          const cleanText = newlineCount === 1 ? tok.text.replace(/\r?\n/g, ' ') : tok.text;
          currentParagraph.push({ ...tok, text: cleanText });
        }
      } else {
        currentParagraph.push(tok);
      }
    });

    if (currentParagraph.length > 0) {
      result.push(currentParagraph);
    }
    return result;
  }, [tokens]);

  if (!exercise) return null;

  return (
    <div className="glass-card p-5 leading-loose select-none space-y-4">
      {paragraphs.map((para, paraIdx) => (
        <div key={paraIdx} className="paragraph" style={{ fontSize: '0' }}>
          {para.map((tok) => {
            if (!tok.clickable) {
              return <span key={tok.id} className="token-space">{tok.text}</span>;
            }

            const isSelected = logicallySelectedTokenIds.has(tok.id);
            const isError = errorIds.has(tok.id);

            let className = 'token';
            if (tok.type === 'punct') className += ' token-punct';
            if (submitted) {
              const errInfo = errorMap[tok.id];
              const isResolved = errInfo ? isErrorResolved(errInfo, selectedTokenIds, modifiedTokens, tokens) : false;
              if (isSelected) {
                if (errInfo && isResolved) className += ' correct';
                else className += ' incorrect';
              } else {
                if (isError) className += ' missed';
              }
            } else if (selectedTokenIds.has(tok.id)) {
              className += ' selected';
            }

            const errInfo = errorMap[tok.id];
            const isItalicError = errInfo && errInfo.category === 'italic';
            let isItalic = false;

            if (isItalicError) {
              if (submitted) {
                isItalic = true;
              } else {
                isItalic = selectedTokenIds.has(tok.id);
              }
            } else {
              isItalic = italicTokenIds.has(tok.id);
            }

            const baseStyle = isItalic ? { fontStyle: 'italic' } : {};
            if (errInfo && CATEGORY_COLORS[errInfo.category]) {
              baseStyle['--cat-color'] = CATEGORY_COLORS[errInfo.category];
            }
            
            const appendedPunc = modifiedTokens[tok.id];

            let renderedContent = (
              <>
                {tok.text}
              </>
            );

            if (appendedPunc) {
              const correctText = errInfo ? errInfo.correct : null;
              if (tok.type === 'punct' && shouldReplacePunctuation(tok.text, appendedPunc, correctText)) {
                renderedContent = <span className="text-[var(--primary)] font-bold">{appendedPunc}</span>;
              } else {
                const placement = getPunctuationPlacement(tok.text, appendedPunc, correctText);
                if (placement === 'prepend') {
                  renderedContent = (
                    <>
                      <span className="text-[var(--primary)] font-bold">{appendedPunc}</span>
                      {tok.text}
                    </>
                  );
                } else {
                  renderedContent = (
                    <>
                      {tok.text}
                      <span className="text-[var(--primary)] font-bold">{appendedPunc}</span>
                    </>
                  );
                }
              }
            }

            return (
              <span key={tok.id} className={className} onClick={() => !submitted && toggleToken(tok.id)} title={submitted && errInfo ? `✅ ${errInfo.correct}` : undefined} style={baseStyle}>
                {renderedContent}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
