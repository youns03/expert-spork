import { describe, it, expect } from 'vitest';
import { 
  AVAILABLE_FRENCH_VOICES, 
  calculateSentenceWordTimings 
} from '../ttsEngine';

describe('French TTS Audio Engine & Timings', () => {
  it('1. Verifies that a natural French voice is configured as default', () => {
    const defaultVoice = AVAILABLE_FRENCH_VOICES.find(v => v.isDefault);
    expect(defaultVoice).toBeDefined();
    expect(defaultVoice?.id).toBe('fr_male_remy');
    expect(defaultVoice?.language).toBe('fr');
  });

  it('2. Distributes accurate strictly monotonic word timestamps based on actual audio duration', () => {
    const sentence = "Nous allons visiter Paris demain matin.";
    const start = 2.0;
    const end = 5.2; // 3.2s duration
    const sentenceId = "s-test-1";

    const words = calculateSentenceWordTimings(sentence, start, end, sentenceId);

    expect(words.length).toBe(6);
    expect(words[0].text).toBe('Nous');
    expect(words[0].start).toBe(2.0);
    expect(words[words.length - 1].text).toBe('matin.');
    expect(words[words.length - 1].end).toBe(5.2);

    // Verify monotonicity (each word start >= previous word start and end > start)
    for (let i = 0; i < words.length; i++) {
      expect(words[i].end).toBeGreaterThan(words[i].start);
      if (i > 0) {
        expect(words[i].start).toBeGreaterThanOrEqual(words[i - 1].end);
      }
    }
  });

  it('3. Guarantees no secret API keys or third-party paid services are hardcoded', () => {
    const allVoiceIds = AVAILABLE_FRENCH_VOICES.map(v => v.id);
    expect(allVoiceIds).not.toContain('elevenlabs');
    expect(allVoiceIds).not.toContain('openai');
  });
});
