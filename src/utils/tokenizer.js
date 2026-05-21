/**
 * Finds the start and end character range of a specific occurrence of a word in a text.
 */
function findErrorCharRange(text, word, occurrence) {
  let startIndex = -1;
  for (let i = 0; i <= occurrence; i++) {
    startIndex = text.indexOf(word, startIndex + 1);
    if (startIndex === -1) break;
  }
  if (startIndex === -1) return null;
  return { start: startIndex, end: startIndex + word.length };
}

/**
 * Splits text into a flat array of token objects.
 * Each token has: { id, text, type: 'word'|'punct'|'space', clickable: bool, startChar, endChar }
 */
export function tokenizeText(text) {
  // Match: words (including hyphens within words), punctuation chars, or whitespace runs
  const regex = /[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*|[0-9]+|[^\w\s]|\s+/g;
  const tokens = [];
  let id = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = regex.lastIndex;
    let type;
    if (/^\s+$/.test(raw)) {
      type = 'space';
    } else if (/^[A-Za-zÀ-ÿ0-9]/.test(raw)) {
      type = 'word';
    } else {
      type = 'punct';
    }
    tokens.push({
      id: id++,
      text: raw,
      type,
      clickable: type !== 'space',
      startChar: start,
      endChar: end,
    });
  }
  return tokens;
}

/**
 * Given a tokenized array and an error list (each error has { word, occurrence }),
 * returns a Set of token IDs that are errors.
 */
export function buildErrorSet(tokens, errors, text) {
  const enriched = enrichErrors(tokens, errors, text);
  const errorIds = new Set();
  enriched.forEach(e => {
    e.tokenIds.forEach(id => errorIds.add(id));
  });
  return errorIds;
}

/**
 * Map each error's token ids back into the original errors array.
 * Returns errors enriched with { tokenId, tokenIds }.
 */
export function enrichErrors(tokens, errors, text) {
  const originalText = text || tokens.map(t => t.text).join('');

  return errors.map((err) => {
    const range = findErrorCharRange(originalText, err.word, err.occurrence ?? 0);
    const tokenIds = [];
    let firstMatchedIndex = -1;

    if (range) {
      tokens.forEach((tok, idx) => {
        if (!tok.clickable) return;
        if (tok.startChar < range.end && tok.endChar > range.start) {
          tokenIds.push(tok.id);
          if (firstMatchedIndex === -1) firstMatchedIndex = idx;
        }
      });

      // Edge case: if AI correction PREPENDS a punctuation mark (e.g. "terletak" -> ", terletak")
      // The user will naturally click the PREVIOUS word ("itu") to append a comma to it.
      // We must add the previous word's token ID to this error so they don't get penalized.
      if (firstMatchedIndex > 0 && err.correct && err.word) {
        const cleanCorrect = err.correct.replace(/\*/g, '');
        const matchPunc = cleanCorrect.match(/^([^\w\s])/);
        if (matchPunc && !err.word.startsWith(matchPunc[1])) {
          let prevIdx = firstMatchedIndex - 1;
          while (prevIdx >= 0 && !tokens[prevIdx].clickable) prevIdx--;
          if (prevIdx >= 0) {
            tokenIds.push(tokens[prevIdx].id);
          }
        }
      }
    }
    
    return {
      ...err,
      tokenIds,
      tokenId: tokenIds.length > 0 ? tokenIds[0] : null,
    };
  });
}
