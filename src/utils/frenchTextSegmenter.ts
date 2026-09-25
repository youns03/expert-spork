/**
 * French Text Segmenter for High-Precision Speech Synthesis & Audio Highlighting
 * Splits text into natural sentence units (100-200 chars) while respecting French punctuation,
 * abbreviations, and apostrophe contractions.
 */

// Common French abbreviations and titles that shouldn't trigger sentence splitting
const FRENCH_ABBREVIATIONS = new Set([
  'm', 'mme', 'mlle', 'dr', 'pr', 'prof', 'st', 'ste', 'etc', 'ex', 'c-a-d', 'c.-a-d', 'c.-à-d',
  'p.ex', 'vol', 'no', 'nos', 'art', 'chap', 'av', 'ap', 'j.-c', 'al', 'cf', 'fig', 'env'
]);

export interface SegmentedSentence {
  index: number;
  text: string;
  wordTokens: string[];
}

/**
 * Clean and normalize French text (supporting very long texts, multi-line books, and dialogue scripts)
 */
export function normalizeFrenchText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove invisible unicode formatting marks
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize quotes & guillemets
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    // Normalize dashes
    .replace(/[\u2013\u2014]/g, '-')
    // Clean excessive spaces while preserving newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Checks if a dot is part of a known French abbreviation
 */
function isAbbreviation(wordBeforeDot: string): boolean {
  const cleanWord = wordBeforeDot.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüç-]/g, '');
  return FRENCH_ABBREVIATIONS.has(cleanWord);
}

/**
 * Tokenize a French sentence into individual words/tokens while preserving apostrophes & hyphens
 */
export function extractFrenchWordTokens(sentenceText: string): string[] {
  const regex = /[a-zA-ZÀ-ÿ0-9]+(?:[-'][a-zA-ZÀ-ÿ0-9]+)*|[.,!?;:«»"()—–]/g;
  const matches = sentenceText.match(regex);
  if (!matches) {
    return sentenceText.split(/\s+/).filter(Boolean);
  }
  return matches.filter(token => /[a-zA-ZÀ-ÿ0-9]/.test(token));
}

/**
 * Split text into raw sentences using high-accuracy boundary detection
 */
export function splitIntoRawSentences(text: string): string[] {
  const normalized = normalizeFrenchText(text);
  if (!normalized) return [];

  const sentences: string[] = [];
  const paragraphs = normalized.split(/\n+/);

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // Fast path for short single-sentence paragraphs
    if (!/[.!?؟;]/.test(trimmedPara)) {
      sentences.push(trimmedPara);
      continue;
    }

    let current = '';
    const chars = trimmedPara.split('');
    const len = chars.length;

    for (let i = 0; i < len; i++) {
      const char = chars[i];
      current += char;

      const isLast = i === len - 1;
      const nextChar = isLast ? '' : chars[i + 1];
      const prevWord = current.trim().split(/\s+/).pop() || '';

      if (/[.!?؟]/.test(char)) {
        // Check ellipsis (...)
        if (char === '.' && (nextChar === '.' || (i > 0 && chars[i - 1] === '.'))) {
          continue;
        }
        // Check decimal number (e.g. 3.14 or 10.5)
        if (char === '.' && /\d/.test(nextChar) && /\d/.test(chars[i - 1] || '')) {
          continue;
        }
        // Check abbreviation (e.g. M. Dupont)
        if (char === '.' && isAbbreviation(prevWord)) {
          continue;
        }

        // Boundary condition
        if (isLast || /\s/.test(nextChar) || /['"»\)]/.test(nextChar) || nextChar === '-') {
          while (i + 1 < len && /['"»\)\-\s]/.test(chars[i + 1])) {
            if (/\s/.test(chars[i + 1]) && i + 2 < len && !/['"»\)]/.test(chars[i + 2])) {
              break;
            }
            i++;
            current += chars[i];
          }

          const trimmed = current.trim();
          if (trimmed.length > 0) {
            sentences.push(trimmed);
          }
          current = '';
        }
      }
    }

    const leftover = current.trim();
    if (leftover.length > 0) {
      sentences.push(leftover);
    }
  }

  return sentences;
}

/**
 * Subdivide overly long sentences (> 180 chars) at natural conjunctions, semicolons, or commas
 * to optimize TTS throughput and provide clean reader highlighting.
 */
export function chunkLongSentences(sentences: string[], maxChunkLength: number = 180): string[] {
  const result: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= maxChunkLength) {
      result.push(sentence);
      continue;
    }

    // Split along punctuation and major conjunctions
    const parts = sentence.split(/(?<=[,;:])\s+|\s+(?=(?:et|mais|donc|car|ou|puis|parce que|lorsque|quand|alors que|cependant|en effet)\s+)/i);
    let buffer = '';

    for (const part of parts) {
      if (!part.trim()) continue;

      if (buffer.length + part.length + 1 <= maxChunkLength) {
        buffer = buffer ? `${buffer} ${part}` : part;
      } else {
        if (buffer.trim()) {
          result.push(buffer.trim());
        }
        // If a single part is still oversized, force split on word boundaries
        if (part.length > maxChunkLength) {
          const words = part.split(/\s+/);
          let wBuffer = '';
          for (const w of words) {
            if (wBuffer.length + w.length + 1 <= maxChunkLength) {
              wBuffer = wBuffer ? `${wBuffer} ${w}` : w;
            } else {
              if (wBuffer) result.push(wBuffer.trim());
              wBuffer = w;
            }
          }
          buffer = wBuffer;
        } else {
          buffer = part;
        }
      }
    }

    if (buffer.trim()) {
      result.push(buffer.trim());
    }
  }

  return result.filter(s => s.trim().length > 0);
}

/**
 * Main segmenter entry point for texts of any length
 */
export function segmentFrenchText(text: string, maxChunkLength: number = 180): SegmentedSentence[] {
  const rawSentences = splitIntoRawSentences(text);
  const chunked = chunkLongSentences(rawSentences, maxChunkLength);

  return chunked.map((sentenceText, idx) => ({
    index: idx,
    text: sentenceText,
    wordTokens: extractFrenchWordTokens(sentenceText)
  }));
}
