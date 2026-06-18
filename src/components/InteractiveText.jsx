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
  redundansi:     '#fb7185',
  spelling:       '#f59e0b',
  italic:         '#60a5fa',
  paralelisme:    '#e879f9',
};

// Smart punctuation placement and replacement helper functions are imported from scoring.js

export default function InteractiveText({ exercise, submitted, enrichedErrors, onErrorTap }) {
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

  const handleTokenClick = (tok) => {
    if (submitted) {
      const err = errorMap[tok.id];
      if (err && onErrorTap) {
        const idx = enrichedErrors.findIndex(e => e === err);
        if (idx !== -1) {
          onErrorTap(idx);
        }
      }
      return;
    }
    toggleToken(tok.id, enrichedErrors);
  };

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
    let currentGroup = [];

    tokens.forEach((tok) => {
      if (tok.type === 'space') {
        if (currentGroup.length > 0) {
          currentParagraph.push({ type: 'group', tokens: currentGroup });
          currentGroup = [];
        }
        const newlineCount = (tok.text.match(/\n/g) || []).length;
        if (newlineCount >= 2) {
          if (currentParagraph.length > 0) {
            result.push(currentParagraph);
            currentParagraph = [];
          }
        } else {
          // Normalize single newlines to regular spaces to prevent layout/word-wrapping bugs
          const cleanText = newlineCount === 1 ? tok.text.replace(/\r?\n/g, ' ') : tok.text;
          currentParagraph.push({ ...tok, text: cleanText, type: 'space', clickable: false });
        }
      } else {
        currentGroup.push(tok);
      }
    });

    if (currentGroup.length > 0) {
      currentParagraph.push({ type: 'group', tokens: currentGroup });
    }
    if (currentParagraph.length > 0) {
      result.push(currentParagraph);
    }
    return result;
  }, [tokens]);

  const getVisualState = (t) => {
    if (!t) return 'normal';
    const isSel = logicallySelectedTokenIds.has(t.id);
    const isErr = errorIds.has(t.id);
    if (submitted) {
      const errInfo = errorMap[t.id];
      const isResolved = errInfo ? isErrorResolved(errInfo, selectedTokenIds, modifiedTokens, tokens) : false;
      if (isSel) {
        return errInfo && isResolved ? 'correct' : 'incorrect';
      } else {
        return isErr ? 'missed' : 'normal';
      }
    } else {
      return selectedTokenIds.has(t.id) ? 'selected' : 'normal';
    }
  };

  if (!exercise) return null;

  return (
    <div className="glass-card p-5 leading-loose select-none space-y-4">
      {paragraphs.map((para, paraIdx) => (
        <div key={paraIdx} className="paragraph" style={{ fontSize: '0' }}>
          {para.map((item, itemIdx) => {
            if (item.type === 'space') {
              return <span key={item.id} className="token-space">{item.text}</span>;
            }

            // Group of non-space tokens that must stay together (no line breaks inside)
            return (
              <span key={itemIdx} style={{ whiteSpace: 'nowrap' }}>
                {item.tokens.map((tok, tokIdx) => {
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
                    isItalic = italicTokenIds.has(tok.id) || tok.italic;
                  }

                  const prevToken = tokIdx > 0 ? item.tokens[tokIdx - 1] : null;
                  const nextToken = tokIdx < item.tokens.length - 1 ? item.tokens[tokIdx + 1] : null;

                  const state = getVisualState(tok);
                  const prevHighlight = prevToken ? getVisualState(prevToken) : 'normal';
                  const nextHighlight = nextToken ? getVisualState(nextToken) : 'normal';

                  const shouldMergeLeft = prevToken && state !== 'normal' && state === prevHighlight;
                  const shouldMergeRight = nextToken && state !== 'normal' && state === nextHighlight;

                  const baseStyle = {
                    ...(isItalic ? { fontStyle: 'italic' } : {}),
                    ...(tok.bold ? { fontWeight: '700', color: '#ffffff' } : {}),
                    ...(submitted && !isError ? { cursor: 'default' } : {}),
                    ...(shouldMergeLeft ? {
                      paddingLeft: '0px',
                      marginLeft: '0px',
                      borderLeftWidth: '0px',
                      borderTopLeftRadius: '0px',
                      borderBottomLeftRadius: '0px'
                    } : {}),
                    ...(shouldMergeRight ? {
                      paddingRight: '0px',
                      marginRight: '0px',
                      borderRightWidth: '0px',
                      borderTopRightRadius: '0px',
                      borderBottomRightRadius: '0px'
                    } : {})
                  };
                  if (errInfo && CATEGORY_COLORS[errInfo.category]) {
                    baseStyle['--cat-color'] = CATEGORY_COLORS[errInfo.category];
                  }
                  
                  const appendedPunc = modifiedTokens[tok.id];
 
                  if (appendedPunc && tok.type !== 'punct') {
                    const correctText = errInfo ? errInfo.correct : null;
                    const placement = getPunctuationPlacement(tok.text, appendedPunc, correctText);
                    const isResolved = errInfo ? isErrorResolved(errInfo, selectedTokenIds, modifiedTokens, tokens) : false;
                    const puncClass = `token font-bold mx-[2px] ${
                      submitted 
                        ? (errInfo && isResolved ? 'correct' : 'incorrect')
                        : 'selected text-[var(--brand)]'
                    }`;
                    const puncStyle = {
                      ...(isItalic ? { fontStyle: 'italic' } : {}),
                      cursor: submitted ? 'default' : 'pointer'
                    };

                    if (placement === 'prepend') {
                      return (
                        <React.Fragment key={tok.id}>
                          <span 
                            className={puncClass} 
                            onClick={() => handleTokenClick(tok)} 
                            style={puncStyle}
                            title={submitted && errInfo ? `✅ ${errInfo.correct}` : undefined}
                          >
                            {appendedPunc}
                          </span>
                          <span 
                            className={className} 
                            onClick={() => handleTokenClick(tok)} 
                            style={baseStyle}
                            title={submitted && errInfo ? `✅ ${errInfo.correct}` : undefined}
                          >
                            {tok.text}
                          </span>
                        </React.Fragment>
                      );
                    } else {
                      return (
                        <React.Fragment key={tok.id}>
                          <span 
                            className={className} 
                            onClick={() => handleTokenClick(tok)} 
                            style={baseStyle}
                            title={submitted && errInfo ? `✅ ${errInfo.correct}` : undefined}
                          >
                            {tok.text}
                          </span>
                          <span 
                            className={puncClass} 
                            onClick={() => handleTokenClick(tok)} 
                            style={puncStyle}
                            title={submitted && errInfo ? `✅ ${errInfo.correct}` : undefined}
                          >
                            {appendedPunc}
                          </span>
                        </React.Fragment>
                      );
                    }
                  }

                  let renderedContent = (
                    <>
                      {tok.text}
                    </>
                  );

                  if (appendedPunc) {
                    const correctText = errInfo ? errInfo.correct : null;
                    if (tok.type === 'punct' && shouldReplacePunctuation(tok.text, appendedPunc, correctText)) {
                      renderedContent = <span className="text-[var(--brand)] font-bold">{appendedPunc}</span>;
                    }
                  }

                  return (
                    <span key={tok.id} className={className} onClick={() => handleTokenClick(tok)} title={submitted && errInfo ? `✅ ${errInfo.correct}` : undefined} style={baseStyle}>
                      {renderedContent}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
