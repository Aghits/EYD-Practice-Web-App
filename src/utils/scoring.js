const PUNCTUATION_CATEGORIES = new Set([
  'comma', 'period', 'semicolon', 'colon', 'dash', 'question', 
  'quotation', 'single-quotation', 'parentheses', 'slash', 'apostrophe', 'hyphen'
]);

export function getPunctuationPlacement(tokenText, appliedPunc, correctText) {
  if (!correctText || !appliedPunc) return 'append';
  if (appliedPunc === '(' || appliedPunc === '[') return 'prepend';
  if (appliedPunc === ')' || appliedPunc === ']') return 'append';
  
  if (appliedPunc !== '"' && appliedPunc !== "'") {
    return 'append';
  }

  const cleanCorrect = correctText.toLowerCase().replace(/\*/g, '');
  const cleanToken = tokenText.toLowerCase();

  const idx = cleanCorrect.indexOf(cleanToken);
  if (idx === -1) return 'append';

  const beforeStr = cleanCorrect.substring(0, idx).trim();
  if (beforeStr.endsWith(appliedPunc)) {
    return 'prepend';
  }

  const afterStr = cleanCorrect.substring(idx + cleanToken.length).trim();
  if (afterStr.startsWith(appliedPunc) || /^[.,?!;:]+\s*['"]/.test(afterStr)) {
    return 'append';
  }

  return 'append';
}

export function shouldReplacePunctuation(tokenText, appliedPunc, correctText) {
  if (!correctText) return true;
  const cleanCorrect = correctText.replace(/\*/g, '');
  
  // If the correct text contains both the original punctuation and the applied punctuation
  // adjacent to each other (e.g. ',"' or '."'), then we should append/prepend instead of replacing.
  const adjacent1 = tokenText + appliedPunc;
  const adjacent2 = appliedPunc + tokenText;
  if (cleanCorrect.includes(adjacent1) || cleanCorrect.includes(adjacent2)) {
    return false;
  }
  
  return true;
}

export function isErrorResolved(err, selectedIds, modifiedTokens, tokens) {
  const hasSelected = err.tokenIds
    ? err.tokenIds.some(id => selectedIds.has(id))
    : (err.tokenId != null && selectedIds.has(err.tokenId));

  if (!hasSelected) return false;

  // Number/numeral formatting errors (e.g. thousands separators using dot, or decimals using comma)
  // are skipped from strict punctuation validation because the punctuation bank doesn't support 
  // inserting multiple punctuation marks inside a token. Clicking/selecting the token is sufficient.
  const ruleLower = (err.rule || '').toLowerCase();
  const isNumberFormatting = 
    (err.category === 'period' || err.category === 'comma') &&
    (ruleLower.includes('ribuan') || ruleLower.includes('desimal') || /\d[.,]\d/.test(err.correct || ''));

  if (isNumberFormatting) {
    return true;
  }

  // Parentheses and brackets are also skipped from strict punctuation validation because 
  // the punctuation bank cannot support inserting both opening and closing marks on the same word
  // or token range. Simply selecting the incorrect tokens is sufficient to resolve the error.
  const isParenthesesOrBrackets = err.category === 'parentheses' || err.category === 'brackets';
  if (isParenthesesOrBrackets) {
    return true;
  }

  if (PUNCTUATION_CATEGORIES.has(err.category)) {
    if (!tokens || !tokens.length) return false;

    const tokenIndices = err.tokenIds
      .map(id => tokens.findIndex(t => t.id === id))
      .filter(idx => idx !== -1);
    
    if (tokenIndices.length === 0) return false;

    const minIdx = Math.min(...tokenIndices);
    const maxIdx = Math.max(...tokenIndices);

    let userText = '';
    for (let i = minIdx; i <= maxIdx; i++) {
      const tok = tokens[i];
      let tokText = tok.text;
      if (modifiedTokens && modifiedTokens[tok.id]) {
        const appendedPunc = modifiedTokens[tok.id];
        const correctText = err.correct;
        if (tok.type === 'punct' && shouldReplacePunctuation(tok.text, appendedPunc, correctText)) {
          tokText = appendedPunc;
        } else {
          const placement = getPunctuationPlacement(tok.text, appendedPunc, correctText);
          if (placement === 'prepend') {
            tokText = appendedPunc + tok.text;
          } else {
            tokText = tok.text + appendedPunc;
          }
        }
      } else if (tok.type === 'punct' && selectedIds.has(tok.id)) {
        tokText = '';
      }
      userText += tokText;
    }

    const normalize = (str) => {
      let s = str.replace(/[\s\*]/g, '').toLowerCase();
      const ruleLower = (err.rule || '').toLowerCase();
      const isAppositive = ruleLower.includes('aposisi') || 
                            ruleLower.includes('penjelasan tambahan') || 
                            ruleLower.includes('penyisipan');
      if (isAppositive) {
        s = s.replace(/—/g, ',');
      }
      return s;
    };
    
    return normalize(userText) === normalize(err.correct);
  }

  return true;
}

/**
 * Computes round result from user selections vs ground-truth error token ids.
 */
export function computeResult(selectedIds, errorIds, enrichedErrors, tokens, modifiedTokens) {
  if (!enrichedErrors || enrichedErrors.length === 0) {
    let tp = 0; // correctly identified errors
    let fp = 0; // wrongly flagged (not errors)
    let missed = 0;

    selectedIds.forEach((id) => {
      if (errorIds.has(id)) tp++;
      else fp++;
    });

    errorIds.forEach((id) => {
      if (!selectedIds.has(id)) missed++;
    });

    const totalErrors = errorIds.size;
    const denominator = tp + fp + missed;
    const accuracy = denominator === 0 ? 100 : Math.round((tp / denominator) * 100);

    // XP formula: 10 per correct, -3 per false positive, +20 bonus if perfect
    const perfect = tp === totalErrors && fp === 0 && totalErrors > 0;
    const xp = Math.max(0, tp * 10 - fp * 3 + (perfect ? 20 : 0));

    return { tp, fp, missed, accuracy, xp, perfect };
  }

  // Error-based calculation (calculates counts based on distinct error objects)
  const tp = enrichedErrors.filter(err => isErrorResolved(err, selectedIds, modifiedTokens, tokens)).length;
  const missed = enrichedErrors.length - tp;
  const fp = [...selectedIds].filter(id => !errorIds.has(id)).length;

  const totalErrors = enrichedErrors.length;
  const denominator = tp + fp + missed;
  const accuracy = denominator === 0 ? 100 : Math.round((tp / denominator) * 100);

  const perfect = tp === totalErrors && fp === 0 && totalErrors > 0;
  const xp = Math.max(0, tp * 10 - fp * 3 + (perfect ? 20 : 0));

  return { tp, fp, missed, accuracy, xp, perfect };
}

/**
 * Level thresholds
 */
const LEVELS = [
  { level: 1, min: 0,    label: 'Pemula' },
  { level: 2, min: 100,  label: 'Mahir' },
  { level: 3, min: 300,  label: 'Ahli' },
  { level: 4, min: 600,  label: 'Pakar' },
  { level: 5, min: 1000, label: 'Master EYD' },
];

export function getLevel(totalXp) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (totalXp >= l.min) current = l;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1];
  const progress = next
    ? ((totalXp - current.min) / (next.min - current.min)) * 100
    : 100;
  return { ...current, next, progress: Math.min(100, Math.round(progress)) };
}

/**
 * Returns updated streak info given lastDate (ISO string) and today.
 */
export function updateStreak(lastDate, currentStreak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!lastDate) return { streak: 1, lastDate: today.toISOString() };

  const last = new Date(lastDate);
  last.setHours(0, 0, 0, 0);
  const diff = Math.round((today - last) / 86400000);

  if (diff === 0) return { streak: currentStreak, lastDate: lastDate };
  if (diff === 1) return { streak: currentStreak + 1, lastDate: today.toISOString() };
  return { streak: 1, lastDate: today.toISOString() };
}
