/**
 * Audio Playback and Speech Synchronization Engine
 * Handles precise playback timing, word highlight tracking, and fixed French male speech integration.
 * Strictly NO Gemini API.
 */

import { AudioProject, SentenceItem, WordTiming } from '../types';
import { apiUrl } from './api';

export function getBestFrenchVoice(preferredVoiceId?: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Female voice keywords to strictly avoid when French Male is requested
  const femaleKeywords = ['female', 'femme', 'amelie', 'julie', 'audrey', 'hortense', 'denise', 'celine', 'lea', 'virginie', 'charlotte', 'aurélie', 'corinne', 'marie'];

  // Male voice keywords to strictly prioritize
  const maleKeywords = ['male', 'homme', 'thomas', 'nicolas', 'paul', 'bernard', 'henri', 'guy', 'claude', 'alain', 'david', 'mathieu', 'pierre'];

  // 1. Check if an exact voice matches
  if (preferredVoiceId) {
    const directMatch = voices.find(v => 
      (v.voiceURI.toLowerCase().includes(preferredVoiceId.toLowerCase()) || 
       v.name.toLowerCase().includes(preferredVoiceId.toLowerCase())) &&
      !femaleKeywords.some(f => v.name.toLowerCase().includes(f))
    );
    if (directMatch) return directMatch;
  }

  // 2. Strict male French voice lookup
  const frenchMale = voices.find(v => {
    const isFr = v.lang.startsWith('fr') || v.lang.includes('FR');
    const nameLower = v.name.toLowerCase();
    const isMale = maleKeywords.some(m => nameLower.includes(m));
    const isNotFemale = !femaleKeywords.some(f => nameLower.includes(f));
    return isFr && (isMale || isNotFemale);
  });
  if (frenchMale) return frenchMale;

  // 3. Any standard French voice that is not explicitly female
  const standardFrenchNonFemale = voices.find(v => {
    const isFr = v.lang.startsWith('fr') || v.lang.includes('FR');
    return isFr && !femaleKeywords.some(f => v.name.toLowerCase().includes(f));
  });
  if (standardFrenchNonFemale) return standardFrenchNonFemale;

  const standardFrench = voices.find(v => v.lang.startsWith('fr') || v.lang.includes('FR'));
  return standardFrench || voices[0] || null;
}

export class AudioEngine {
  private audioElement: HTMLAudioElement | null = null;
  private currentProject: AudioProject | null = null;
  private isPlayingState: boolean = false;
  private activeSpeed: number = 1.0;
  private projectCurrentTime: number = 0;
  private timerIntervalId: number | null = null;
  private onTimeUpdateCallback: ((time: number, isPlaying: boolean) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private isUsingSpeechSynthesis: boolean = false;
  private customBlobUrl: string | null = null;
  private activeSentenceAudio: HTMLAudioElement | null = null;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.preservesPitch = true;

    this.audioElement.addEventListener('ended', () => {
      this.handlePlaybackFinished();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.isUsingSpeechSynthesis && this.audioElement && !this.audioElement.paused) {
        this.projectCurrentTime = this.audioElement.currentTime;
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.projectCurrentTime, true);
        }
      }
    });

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public setCallbacks(
    onTimeUpdate: (time: number, isPlaying: boolean) => void,
    onEnded?: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    if (onEnded) this.onEndedCallback = onEnded;
  }

  public setPlaybackRate(rate: number) {
    this.activeSpeed = Math.max(0.5, Math.min(2.0, rate));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.activeSpeed;
    }
    if (this.activeSentenceAudio) {
      this.activeSentenceAudio.playbackRate = this.activeSpeed;
    }
  }

  public async loadProjectAudio(project: AudioProject, customAudioBlob?: Blob) {
    this.currentProject = project;
    this.stop();

    if (this.customBlobUrl) {
      URL.revokeObjectURL(this.customBlobUrl);
      this.customBlobUrl = null;
    }

    // 1. Custom audio blob
    if (customAudioBlob) {
      this.isUsingSpeechSynthesis = false;
      this.customBlobUrl = URL.createObjectURL(customAudioBlob);
      if (this.audioElement) {
        this.audioElement.src = this.customBlobUrl;
        this.audioElement.playbackRate = this.activeSpeed;
        this.audioElement.load();
      }
      return;
    }

    // 2. Real audio data URL from TTS or project
    if (project.audioDataUrl && (project.audioDataUrl.startsWith('data:audio/') || project.audioDataUrl.startsWith('blob:'))) {
      this.isUsingSpeechSynthesis = false;
      if (this.audioElement) {
        this.audioElement.src = project.audioDataUrl;
        this.audioElement.playbackRate = this.activeSpeed;
        this.audioElement.load();
      }
      return;
    }

    // 3. Fallback: speech synthesis
    this.isUsingSpeechSynthesis = true;
    if (this.audioElement) {
      this.audioElement.src = '';
    }
  }

  /**
   * Speak a specific single sentence with fixed French male voice immediately
   */
  public async speakSingleSentence(sentenceText: string, lang = 'fr', rate = this.activeSpeed) {
    if (!sentenceText.trim()) return;

    // Stop previous single sentence if playing
    if (this.activeSentenceAudio) {
      this.activeSentenceAudio.pause();
      this.activeSentenceAudio = null;
    }

    // 1. Try server French Male Neural voice
    try {
      const res = await fetch(apiUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentenceText.trim(),
          voice: 'fr-FR-RemyMultilingualNeural',
          rate: rate
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const snd = new Audio(data.audioBase64);
          snd.playbackRate = Math.max(0.6, Math.min(1.8, rate));
          this.activeSentenceAudio = snd;
          await snd.play();
          return;
        }
      }
    } catch (e) {
      console.warn('Fallback to local speech synthesis:', e);
    }

    // 2. Local fallback using strictly male French voice
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(sentenceText);
    utterance.lang = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : 'fr-FR';
    utterance.rate = Math.max(0.7, Math.min(1.4, rate));
    utterance.pitch = 0.95; // Slightly lower pitch for consistent male tone

    const frenchVoice = getBestFrenchVoice(this.currentProject?.voiceId);
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Continuous speech sequence for fallback mode
   */
  private startSpeechSequenceFrom(startTime: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !this.currentProject) return;

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const sentences = this.currentProject.sentences;
    if (!sentences || sentences.length === 0) return;

    const startIndex = sentences.findIndex(s => s.end > startTime);
    if (startIndex === -1) {
      this.handlePlaybackFinished();
      return;
    }

    let currentIndex = startIndex;

    const speakNext = () => {
      if (!this.isPlayingState || currentIndex >= sentences.length) {
        if (currentIndex >= sentences.length) {
          this.handlePlaybackFinished();
        }
        return;
      }

      window.speechSynthesis.resume();
      const s = sentences[currentIndex];
      
      if (this.projectCurrentTime < s.start) {
        this.projectCurrentTime = s.start;
      }

      const textToSpeak = s.french || s.text;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = this.currentProject?.language === 'en' ? 'en-US' : 'fr-FR';
      utterance.rate = Math.max(0.7, Math.min(1.3, this.activeSpeed));
      utterance.pitch = 0.95;

      const frenchVoice = getBestFrenchVoice(this.currentProject?.voiceId);
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onend = () => {
        if (!this.isPlayingState) return;
        this.projectCurrentTime = s.end;
        currentIndex++;
        setTimeout(() => {
          if (this.isPlayingState) {
            speakNext();
          }
        }, 150);
      };

      utterance.onerror = (e) => {
        if (this.isPlayingState && e.error !== 'canceled' && e.error !== 'interrupted') {
          currentIndex++;
          speakNext();
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech synthesis error:', err);
      }
    };

    speakNext();
  }

  public async play() {
    this.isPlayingState = true;

    if (!this.isUsingSpeechSynthesis && this.audioElement && this.audioElement.src && !this.audioElement.src.endsWith('/')) {
      try {
        await this.audioElement.play();
      } catch {
        this.startSpeechSequenceFrom(this.projectCurrentTime);
      }
    } else {
      this.startSpeechSequenceFrom(this.projectCurrentTime);
    }

    this.startProgressTicker();
  }

  public pause() {
    this.isPlayingState = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.activeSentenceAudio) {
      this.activeSentenceAudio.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.stopProgressTicker();
  }

  public stop() {
    this.pause();
    this.projectCurrentTime = 0;
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, false);
    }
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlayingState;
    this.projectCurrentTime = Math.max(0, seconds);

    if (!this.isUsingSpeechSynthesis && this.audioElement && this.audioElement.src && !this.audioElement.src.endsWith('/')) {
      this.audioElement.currentTime = this.projectCurrentTime;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.projectCurrentTime, wasPlaying);
    }

    if (wasPlaying) {
      if (this.isUsingSpeechSynthesis) {
        this.startSpeechSequenceFrom(this.projectCurrentTime);
      } else if (this.audioElement) {
        this.audioElement.play().catch(() => {});
      }
    }
  }

  public getCurrentTime(): number {
    if (!this.isUsingSpeechSynthesis && this.audioElement && this.audioElement.src && !this.audioElement.paused && !this.audioElement.ended) {
      return this.audioElement.currentTime;
    }
    return this.projectCurrentTime;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  private startProgressTicker() {
    this.stopProgressTicker();

    let lastTick = performance.now();

    this.timerIntervalId = window.setInterval(() => {
      if (!this.isPlayingState || !this.currentProject) return;

      const now = performance.now();
      const deltaSeconds = ((now - lastTick) / 1000) * this.activeSpeed;
      lastTick = now;

      if (!this.isUsingSpeechSynthesis && this.audioElement && this.audioElement.src && !this.audioElement.paused) {
        this.projectCurrentTime = this.audioElement.currentTime;
      } else {
        this.projectCurrentTime += deltaSeconds;
      }

      if (this.projectCurrentTime >= this.currentProject.duration) {
        this.projectCurrentTime = this.currentProject.duration;
        this.handlePlaybackFinished();
        return;
      }

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.projectCurrentTime, true);
      }
    }, 25); // high 40fps precision for buttery smooth walking fill
  }

  private stopProgressTicker() {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.projectCurrentTime, false);
    }
  }

  private handlePlaybackFinished() {
    this.isPlayingState = false;
    this.stopProgressTicker();
    if (this.onEndedCallback) {
      this.onEndedCallback();
    }
  }
}

// Precise continuous progress calculation for seamless walking highlight
export function calculateWordProgress(currentTime: number, start: number, end: number): number {
  if (currentTime <= start) return 0;
  if (currentTime >= end) return 1;
  const duration = Math.max(end - start, 0.0001);
  return Math.max(0, Math.min(1, (currentTime - start) / duration));
}

// Auto distribute word timestamps evenly across sentence duration with 0 gap
export function autoDistributeWordTimestamps(
  sentenceText: string,
  sentenceStart: number,
  sentenceEnd: number,
  sentenceId: string
): WordTiming[] {
  const words = sentenceText.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const totalDuration = Math.max(sentenceEnd - sentenceStart, 0.1);
  const charCounts = words.map(w => Math.max(w.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '').length, 1.5));
  const totalChars = charCounts.reduce((a, b) => a + b, 0);

  let currentStart = sentenceStart;
  return words.map((w, idx) => {
    const isLast = idx === words.length - 1;
    const wordDuration = isLast
      ? Math.max(0.05, sentenceEnd - currentStart)
      : (charCounts[idx] / totalChars) * totalDuration;

    const start = currentStart;
    const end = isLast ? sentenceEnd : currentStart + wordDuration;
    currentStart = end;

    return {
      id: `${sentenceId}-w-${idx + 1}`,
      text: w,
      start: Math.round(start * 1000) / 1000,
      end: Math.round(end * 1000) / 1000
    };
  });
}
