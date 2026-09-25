export interface WordTiming {
  id: string;
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
  translation?: string;
}

export interface SentenceItem {
  id: string;
  text: string; // French or original text
  french?: string;
  arabic?: string; // Arabic translation
  translation?: string;
  start: number; // start in seconds
  end: number;   // end in seconds
  words: WordTiming[];
  audioBlobId?: string;
  audioDataUrl?: string;
  voiceId?: string;
  speed?: number;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'auto';

export interface AudioProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  language: 'fr' | 'en' | 'ar' | 'es' | 'other';
  direction: 'rtl' | 'ltr';
  level?: CEFRLevel;
  voiceId?: string;
  speed?: number;
  audioFileName?: string;
  audioDataUrl?: string; // base64 or blob URL for persistent offline playback
  duration: number;
  sentences: SentenceItem[];
  notes?: string;
  arabicTitle?: string;
  progressPercent?: number;
  bookmarked?: boolean;
  isOfflineReady?: boolean;
  sourceType?: 'tts_generated' | 'audio_uploaded' | 'whisperx_imported';
}

export type NavTab = 'library' | 'search' | 'stats' | 'voices' | 'settings';

export type HighlightStyle = 'gradient' | 'box' | 'underline';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ReaderConfig {
  style: HighlightStyle;
  color: string;
  speed: number;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'cairo' | 'tajawal' | 'amiri' | 'system';
  showTranslation: boolean;
  autoScroll: boolean;
  loopMode: 'none' | 'sentence' | 'word';
  theme: ThemeMode;
  studioAudioMastering?: boolean;
  vocalClarityBoost?: boolean;
  vocalWarmthBoost?: boolean;
  audioSampleRate?: 44100 | 24000;
}

export interface VoiceOption {
  id: string;
  name: string;
  language: 'fr' | 'en' | 'ar';
  gender: 'female' | 'male';
  description: string;
  isDefault?: boolean;
}

export interface ModelDownloadProgress {
  status: 'idle' | 'checking' | 'downloading' | 'ready' | 'error' | 'not_supported';
  progressPercent: number;
  loadedMB: number;
  totalMB: number;
  statusMessage: string;
}

export interface SynthesisProgress {
  stage: 'preparing' | 'downloading_model' | 'segmenting' | 'synthesizing' | 'merging' | 'saving' | 'completed' | 'error';
  currentSentence: number;
  totalSentences: number;
  percent: number;
  message: string;
}
