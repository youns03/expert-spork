import React, { useEffect, useRef, useState } from 'react';
import { 
  AudioProject, 
  ReaderConfig, 
  SentenceItem, 
  WordTiming,
  HighlightStyle 
} from '../types';
import { calculateWordProgress } from '../utils/audioEngine';
import { 
  exportToProjectJson,
  exportToWhisperXJson,
  exportToSmilXml,
  exportToWebVtt,
  downloadFile
} from '../utils/formatParsers';
import { 
  Eye, 
  Edit3, 
  Check, 
  Volume2, 
  Download, 
  FileJson, 
  FileCode, 
  FileText, 
  Languages, 
  Sparkles 
} from 'lucide-react';

interface FileReadingViewProps {
  project: AudioProject;
  currentTime: number;
  isPlaying: boolean;
  config: ReaderConfig;
  onChangeConfig: (newConfig: Partial<ReaderConfig>) => void;
  onSeek: (seconds: number) => void;
  onUpdateProject: (updatedProject: AudioProject) => void;
  onSpeakSentence?: (text: string) => void;
}

export const FileReadingView: React.FC<FileReadingViewProps> = ({
  project,
  currentTime,
  isPlaying,
  config,
  onChangeConfig,
  onSeek,
  onUpdateProject,
  onSpeakSentence
}) => {
  const [viewMode, setViewMode] = useState<'full_text' | 'tune'>('full_text');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTranslation, setShowTranslation] = useState(config.showTranslation ?? true);
  
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState<number>(0);
  const [tempEnd, setTempEnd] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement | null>(null);

  // Sync translation state with config
  useEffect(() => {
    setShowTranslation(config.showTranslation ?? true);
  }, [config.showTranslation]);

  // Determine current active sentence and active word based on currentTime
  let activeSentenceId: string | null = null;
  let activeWordId: string | null = null;

  for (let sIdx = 0; sIdx < project.sentences.length; sIdx++) {
    const s = project.sentences[sIdx];
    if (currentTime >= s.start && currentTime <= s.end + 0.1) {
      activeSentenceId = s.id;
      for (const w of s.words) {
        if (currentTime >= w.start && currentTime <= w.end + 0.05) {
          activeWordId = w.id;
          break;
        }
      }
      break;
    }
  }

  // Auto-scroll to active sentence if enabled
  useEffect(() => {
    if (config.autoScroll && activeSentenceRef.current && isPlaying) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeSentenceId, config.autoScroll, isPlaying]);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small': return 'text-lg sm:text-xl leading-loose';
      case 'large': return 'text-2xl sm:text-3xl leading-relaxed sm:leading-[2.2]';
      case 'xlarge': return 'text-3xl sm:text-4xl leading-relaxed sm:leading-[2.3]';
      case 'medium':
      default: return 'text-xl sm:text-2xl leading-loose sm:leading-[2]';
    }
  };

  const getFontFamilyClass = () => {
    switch (config.fontFamily) {
      case 'tajawal': return 'font-[Tajawal]';
      case 'amiri': return 'font-[Amiri]';
      case 'system': return 'font-sans';
      case 'cairo':
      default: return 'font-[Cairo]';
    }
  };

  const handleSaveWordTiming = (sentenceId: string, wordId: string) => {
    const updatedSentences = project.sentences.map(s => {
      if (s.id !== sentenceId) return s;
      const updatedWords = s.words.map(w => {
        if (w.id !== wordId) return w;
        return {
          ...w,
          start: Math.round(tempStart * 100) / 100,
          end: Math.round(tempEnd * 100) / 100
        };
      });
      return { ...s, words: updatedWords };
    });

    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      sentences: updatedSentences
    });
    setEditingWordId(null);
  };

  const handleExport = (format: 'whisperx' | 'project' | 'smil' | 'vtt') => {
    const safeTitle = project.title.replace(/[/\\?%*:|"<>]/g, '-');
    setShowExportMenu(false);

    if (format === 'whisperx') {
      const content = exportToWhisperXJson(project);
      downloadFile(content, `${safeTitle}-whisperx.json`, 'application/json');
    } else if (format === 'project') {
      const content = exportToProjectJson(project);
      downloadFile(content, `${safeTitle}-highlightpro.json`, 'application/json');
    } else if (format === 'smil') {
      const content = exportToSmilXml(project);
      downloadFile(content, `${safeTitle}-overlay.smil`, 'application/xml');
    } else if (format === 'vtt') {
      const content = exportToWebVtt(project);
      downloadFile(content, `${safeTitle}.vtt`, 'text/vtt');
    }
  };

  return (
    <div id="file-reading-container" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-in fade-in duration-200 pb-36 font-[Cairo]">
      
      {/* Top Reading Environment Controls */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-rose-100 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors">
        
        {/* Left: View Modes */}
        <div className="flex items-center gap-1.5 bg-rose-50/60 dark:bg-slate-800/80 p-1 rounded-xl border border-rose-100/80 dark:border-slate-700 text-xs">
          <button
            id="mode-full-text"
            onClick={() => setViewMode('full_text')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'full_text' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>نص الدرس والتظليل</span>
          </button>

          <button
            id="mode-tune"
            onClick={() => setViewMode('tune')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'tune' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ضبط التوقيت</span>
          </button>
        </div>

        {/* Center/Right: Learning Controls & Aesthetics */}
        <div className="flex items-center gap-2">
          
          {/* Translation Toggle Button */}
          <button
            id="btn-toggle-translation"
            type="button"
            onClick={() => {
              const nextVal = !showTranslation;
              setShowTranslation(nextVal);
              onChangeConfig({ showTranslation: nextVal });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showTranslation
                ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-rose-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{showTranslation ? 'الترجمة مفعلة' : 'إظهار الترجمة'}</span>
          </button>

          {/* Highlight Style */}
          <select
            id="select-highlight-style"
            value={config.style}
            onChange={(e) => onChangeConfig({ style: e.target.value as HighlightStyle })}
            className="text-xs bg-rose-50/50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="gradient">تظليل تدريجي ناعم</option>
            <option value="box">تظليل صندوقي</option>
            <option value="underline">خط سفلي متحرك</option>
          </select>

          {/* Export Dropdown */}
          <div ref={exportDropdownRef} className="relative">
            <button
              id="btn-export-dropdown"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-400 font-semibold text-xs border border-rose-200/80 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير</span>
            </button>

            {showExportMenu && (
              <div className="absolute left-0 rtl:left-0 rtl:right-auto ltr:right-0 ltr:left-auto mt-1 w-56 bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 border-b border-rose-50 dark:border-slate-800">
                  تصدير التوقيتات والمحاذاة
                </div>

                <button
                  onClick={() => handleExport('whisperx')}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-right cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-right">
                    <p className="font-semibold">صيغة WhisperX JSON</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Word-level timestamps</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('smil')}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-right cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="text-right">
                    <p className="font-semibold">EPUB3 Media Overlay (SMIL)</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">للقارئات القياسية مثل Thorium</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('vtt')}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-right cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="text-right">
                    <p className="font-semibold">WebVTT Cues (.vtt)</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">توقيتات الفيديو والويب</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('project')}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-right cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="text-right">
                    <p className="font-semibold">نسخة احتياطية (Highlight Pro)</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">JSON كامل للمشروع</p>
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Main Reading Canvas (بيئة القراءة والتعلم الفرنسية) */}
      <div 
        ref={containerRef}
        id="reading-canvas"
        dir="ltr"
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-rose-100/90 dark:border-slate-800 shadow-sm p-6 sm:p-10 md:p-12 min-h-[380px] transition-all relative ${getFontFamilyClass()}`}
      >
        
        {/* Decorative Header */}
        <div className="flex items-center justify-between border-b border-rose-50 dark:border-slate-800 pb-4 mb-6 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-slate-700 dark:text-slate-200">{project.title}</span>
            {project.level && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                {project.level}
              </span>
            )}
            {project.isOfflineReady && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 font-medium text-[10px]">
                متاح دون إنترنت
              </span>
            )}
          </div>

          <span className="flex items-center gap-1 font-mono text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Volume2 className="w-3.5 h-3.5" />
            {currentTime.toFixed(2)}s / {project.duration.toFixed(1)}s
          </span>
        </div>

        {/* FULL TEXT & SENTENCE LEARNING MODE */}
        {viewMode === 'full_text' && (
          <div className="space-y-6">
            {project.sentences.map((sentence) => {
              const isSentenceActive = activeSentenceId === sentence.id;
              const isSentencePast = currentTime > sentence.end;
              const arabicText = sentence.arabic || sentence.translation;

              return (
                <div
                  key={sentence.id}
                  id={`sentence-${sentence.id}`}
                  ref={isSentenceActive ? activeSentenceRef : null}
                  className={`p-5 rounded-2xl transition-all duration-300 relative group cursor-pointer border ${
                    isSentenceActive
                      ? 'bg-rose-50/80 dark:bg-slate-800/80 border-rose-300/90 dark:border-rose-500/50 shadow-xs ring-1 ring-rose-200 dark:ring-rose-900/50'
                      : isSentencePast
                      ? 'bg-white/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 hover:bg-rose-50/30 dark:hover:bg-slate-800/30'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:bg-rose-50/30 dark:hover:bg-slate-800/30'
                  }`}
                  onClick={() => onSeek(sentence.start)}
                >
                  {/* French Sentence Line with Continuous Seamless Walking Highlighting */}
                  <div className={`leading-relaxed select-none ${getFontSizeClass()} text-left font-sans block`}>
                    {sentence.words.map((word, wIdx) => {
                      const progress = calculateWordProgress(currentTime, word.start, word.end);
                      const isWordActive = activeWordId === word.id;
                      const isWordPast = currentTime >= word.end;
                      const hasTrailingSpace = wIdx < sentence.words.length - 1;

                      const wordStyle: React.CSSProperties & { [key: string]: string | number } = {
                        '--progress': `${(progress * 100).toFixed(1)}%`,
                        '--hl-color': config.color || '#fda4af'
                      };

                      return (
                        <span
                          key={word.id}
                          id={`word-${word.id}`}
                          style={wordStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSeek(word.start);
                          }}
                          className={`
                            hl-word-ltr
                            hl-style-${config.style}
                            cursor-pointer transition-colors duration-75 inline whitespace-pre-wrap
                            ${isWordActive ? 'font-bold text-slate-950 dark:text-white' : isWordPast ? 'text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}
                          `}
                          title={word.translation ? `${word.text} (${word.translation})` : word.text}
                        >
                          {word.text}{hasTrailingSpace ? ' ' : ''}
                        </span>
                      );
                    })}
                  </div>

                  {/* Real-time walking progress bar for active sentence */}
                  {isSentenceActive && (
                    <div className="w-full bg-rose-100/70 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="bg-rose-500 dark:bg-rose-400 h-full rounded-full transition-all duration-75 ease-linear"
                        style={{
                          width: `${Math.max(0, Math.min(100, ((currentTime - sentence.start) / Math.max(0.1, sentence.end - sentence.start)) * 100))}%`
                        }}
                      />
                    </div>
                  )}

                  {/* Arabic Translation Line (RTL) */}
                  {showTranslation && arabicText && (
                    <div 
                      dir="rtl"
                      className="mt-2.5 pt-2.5 border-t border-rose-100/60 dark:border-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-300 font-sans text-sm sm:text-base leading-relaxed"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {arabicText}
                      </span>

                      {/* Repeat Sentence Button for Shadowing */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSpeakSentence) {
                            onSpeakSentence(sentence.french || sentence.text);
                          }
                          onSeek(sentence.start);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 mr-2 cursor-pointer"
                        title="إعادة نطق الجملة بصوت فرنسي واضح (Shadowing)"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>استمع</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TUNE MODE */}
        {viewMode === 'tune' && (
          <div className="space-y-6 text-sm" dir="rtl">
            <div className="p-3.5 bg-rose-50/70 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>انقر على أي كلمة لتعديل توقيت بدايتها ونهايتها بالثواني بدقة:</span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">الزمن الحالي: {currentTime.toFixed(2)}s</span>
            </div>

            {project.sentences.map((sentence) => (
              <div key={sentence.id} className="p-4 border border-rose-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-rose-50 dark:border-slate-800">
                  <span className="font-medium font-sans" dir="ltr">{sentence.text}</span>
                  <span className="font-mono text-[11px] text-rose-500 dark:text-rose-400">{sentence.start}s - {sentence.end}s</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1" dir="ltr">
                  {sentence.words.map((word) => {
                    const isEditing = editingWordId === word.id;
                    const isCurrent = activeWordId === word.id;

                    if (isEditing) {
                      return (
                        <div key={word.id} className="p-2.5 bg-rose-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-500 rounded-xl flex items-center gap-2 shadow-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{word.text}</span>
                          <div className="flex items-center gap-1 text-xs">
                            <input
                              type="number"
                              step="0.05"
                              value={tempStart}
                              onChange={(e) => setTempStart(parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded text-center font-mono"
                              title="البداية"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              step="0.05"
                              value={tempEnd}
                              onChange={(e) => setTempEnd(parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded text-center font-mono"
                              title="النهاية"
                            />
                          </div>
                          <button
                            onClick={() => handleSaveWordTiming(sentence.id, word.id)}
                            className="p-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={word.id}
                        onClick={() => {
                          setEditingWordId(word.id);
                          setTempStart(word.start);
                          setTempEnd(word.end);
                          onSeek(word.start);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 border-rose-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{word.text}</span>
                        <span className="text-[10px] font-mono opacity-80">({word.start}s)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
