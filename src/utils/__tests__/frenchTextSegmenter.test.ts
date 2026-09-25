import { describe, it, expect } from 'vitest';
import { 
  normalizeFrenchText, 
  splitIntoRawSentences, 
  chunkLongSentences, 
  segmentFrenchText,
  extractFrenchWordTokens
} from '../frenchTextSegmenter';

describe('French Text Segmenter', () => {
  it('1. Splits French text into sentences while preserving punctuation', () => {
    const raw = "Bonjour, comment allez-vous aujourd'hui ? Je voudrais commander un café et un croissant. Nous allons visiter Paris demain matin.";
    const sentences = splitIntoRawSentences(raw);

    expect(sentences.length).toBe(3);
    expect(sentences[0]).toBe("Bonjour, comment allez-vous aujourd'hui ?");
    expect(sentences[1]).toBe("Je voudrais commander un café et un croissant.");
    expect(sentences[2]).toBe("Nous allons visiter Paris demain matin.");
  });

  it('2. Preserves French abbreviations and apostrophes without unwanted splitting', () => {
    const raw = "M. Dupont et Dr. Martin habitent à Paris. C'est magnifique, n'est-ce pas ?";
    const sentences = splitIntoRawSentences(raw);

    expect(sentences.length).toBe(2);
    expect(sentences[0]).toContain("M. Dupont");
    expect(sentences[1]).toContain("C'est magnifique");
  });

  it('3. Splits overly long sentences at natural conjunctions/commas', () => {
    const longSentence = "Hier matin nous sommes allés au marché pour acheter des fruits frais et des légumes biologiques, mais il y avait une foule immense devant la boulangerie, donc nous avons décidé de prendre un café d'abord.";
    const chunked = chunkLongSentences([longSentence], 100);

    expect(chunked.length).toBeGreaterThan(1);
    chunked.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(130);
    });
  });

  it('4. Correctly extracts French word tokens with accented characters and contractions', () => {
    const sentence = "Est-ce que vous pouvez répéter, s'il vous plaît ?";
    const tokens = extractFrenchWordTokens(sentence);

    expect(tokens).toContain("Est-ce");
    expect(tokens).toContain("vous");
    expect(tokens).toContain("pouvez");
    expect(tokens).toContain("répéter");
    expect(tokens).toContain("s'il");
    expect(tokens).toContain("plaît");
  });

  it('5. Successfully segments the 5 required French learning sentences', () => {
    const text = `
      Bonjour, comment allez-vous aujourd'hui ?
      Je voudrais commander un café et un croissant.
      Nous allons visiter Paris demain matin.
      Est-ce que vous pouvez répéter, s'il vous plaît ?
      Il y a beaucoup de personnes dans cette salle.
    `;
    const segments = segmentFrenchText(text);

    expect(segments.length).toBe(5);
    expect(segments[0].text).toContain("Bonjour, comment allez-vous");
    expect(segments[1].text).toContain("commander un café");
    expect(segments[2].text).toContain("visiter Paris");
    expect(segments[3].text).toContain("s'il vous plaît");
    expect(segments[4].text).toContain("beaucoup de personnes");
  });
});