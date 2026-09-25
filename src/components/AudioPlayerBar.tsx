import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Sparkles,
  Headphones 
} from 'lucide-react';
import { AudioProject, ReaderConfig } from '../types';

interface AudioPlayerBarProps {
  project: AudioProject;
  currentTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  config: ReaderConfig;
  onChangeConfig: (newConfig: Partial<ReaderConfig>) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  project,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  config,
  onChangeConfig
}) => {
  const duration = project.duration || 10;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  // Find active word for telemetry
  let activeWordText = '—';
  let activeWordProgressPct = 0;

  for (const s of project.sentences) {
    if (currentTime >= s.start && currentTime <= s.end + 0.1) {
      for (const w of s.words) {
        if (currentTime >= w.start && currentTime <= w.end) {
          activeWordText = w.text;
          const wDur = Math.max(w.end - w.start, 0.01);
          activeWordProgressPct = Math.round(((currentTime - w.start) / wDur) * 100);
          break;
        }
      }
      break;
    }
  }

  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  return (
    <div 
      id="audio-player-bar" 
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-rose-100 dark:border-slate-800 shadow-xl py-3 px-4 sm:px-6 animate-in slide-in-from-bottom duration-200 transition-colors"
    >
      <div className="max-w-4xl mx-auto space-y-2.5">
        
        {/* Scrubber Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-14 text-right">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center group">
            <input
              id="player-timeline-slider"
              type="range"
              min="0"
              max={duration}
              step="0.05"
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-2 bg-rose-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 transition-all group-hover:h-2.5"
            />
          </div>

          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-14">
            {formatTime(duration)}
          </span>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Telemetry Capsule (Active Word Status) */}
          <div className="hidden sm:flex items-center gap-2 bg-rose-50/80 dark:bg-slate-800/80 border border-rose-100/90 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs max-w-xs truncate">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">الكلمة الحالية:</span>
            <span className="font-bold text-rose-700 dark:text-rose-400 truncate">{activeWordText}</span>
            {activeWordText !== '—' && (
              <span className="font-mono text-[10px] text-rose-500 dark:text-rose-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-rose-100 dark:border-slate-700">
                {activeWordProgressPct}%
              </span>
            )}
          </div>

          {/* Center Playback Buttons */}
          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            
            {/* Skip back 3s */}
            <button
              id="btn-skip-backward"
              onClick={() => onSeek(Math.max(0, currentTime - 3))}
              title="رجوع 3 ثواني"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              id="btn-play-pause-main"
              onClick={isPlaying ? onPause : onPlay}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-rose-200/80 dark:shadow-none transition-all cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت (مسافة)' : 'تشغيل (مسافة)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white rtl:translate-x-[-1px] ltr:translate-x-[1px]" />
              )}
            </button>

            {/* Skip forward 3s */}
            <button
              id="btn-skip-forward"
              onClick={() => onSeek(Math.min(duration, currentTime + 3))}
              title="تقديم 3 ثواني"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

          </div>

          {/* Right Controls: Studio HD badge, Speed, and Reset */}
          <div className="flex items-center gap-2">
            
            {/* Studio HD Audio Indicator */}
            <div 
              title="معالجة استوديو فائقة النقاء (44.1 kHz Studio Mastered - منع التقطيع والنقر)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-[11px] select-none"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold">Studio HD</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">44.1k</span>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center bg-rose-50/70 dark:bg-slate-800/80 p-0.5 rounded-xl border border-rose-100 dark:border-slate-700 text-xs">
              {speedOptions.map((rate) => (
                <button
                  key={rate}
                  onClick={() => onChangeConfig({ speed: rate })}
                  className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                    config.speed === rate
                      ? 'bg-rose-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Restart from beginning */}
            <button
              id="btn-restart-audio"
              onClick={() => onSeek(0)}
              title="إعادة من البداية"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
