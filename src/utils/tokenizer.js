/**
 * Helper to parse markdown-style markers (**bold** and *italic*) from text,
 * returning the cleaned text and the character index ranges of the marked words.
 */
export function parseMarkdownMarkers(rawText) {
  if (!rawText) return { cleanText: '', boldRanges: [], italicRanges: [] };
  let cleanText = '';
  const boldRanges = [];
  const italicRanges = [];
  
  let i = 0;
  while (i < rawText.length) {
    if (rawText.startsWith('**', i)) {
      const closingIdx = rawText.indexOf('**', i + 2);
      if (closingIdx !== -1) {
        const content = rawText.slice(i + 2, closingIdx);
        const start = cleanText.length;
        cleanText += content;
        const end = cleanText.length;
        boldRanges.push({ start, end });
        i = closingIdx + 2;
        continue;
      }
    } else if (rawText.startsWith('*', i)) {
      const closingIdx = rawText.indexOf('*', i + 1);
      if (closingIdx !== -1) {
        const content = rawText.slice(i + 1, closingIdx);
        const start = cleanText.length;
        cleanText += content;
        const end = cleanText.length;
        italicRanges.push({ start, end });
        i = closingIdx + 1;
        continue;
      }
    }
    cleanText += rawText[i];
    i++;
  }
  
  return { cleanText, boldRanges, italicRanges };
}

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
 * Each token has: { id, text, type: 'word'|'punct'|'space', clickable: bool, startChar, endChar, bold: bool, italic: bool }
 */
export function tokenizeText(text) {
  const { cleanText, boldRanges, italicRanges } = parseMarkdownMarkers(text);
  // Match: words (including hyphens within words), punctuation chars, or whitespace runs
  const regex = /[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*|[0-9]+|[^\w\s]|\s+/g;
  const tokens = [];
  let id = 0;
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
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
    
    const isBold = boldRanges.some(r => start >= r.start && end <= r.end);
    const isItalic = italicRanges.some(r => start >= r.start && end <= r.end);

    tokens.push({
      id: id++,
      text: raw,
      type,
      clickable: type !== 'space',
      startChar: start,
      endChar: end,
      bold: isBold,
      italic: isItalic
    });
  }
  return tokens;
}

/**
 * Given a tokenized array and an error list (each error has { word, occurrence }),
 * returns a Set of token IDs that are errors.
 */
export function buildErrorSet(tokens, errors, text) {
  const { cleanText } = parseMarkdownMarkers(text);
  const enriched = enrichErrors(tokens, errors, cleanText);
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
  const { cleanText } = parseMarkdownMarkers(text || tokens.map(t => t.text).join(''));
  const originalText = cleanText;

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
        const originalStartsPunc = err.word.match(/^([^\w\s])/);
        if (matchPunc && !originalStartsPunc && !err.word.startsWith(matchPunc[1])) {
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
