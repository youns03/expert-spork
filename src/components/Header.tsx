import React from 'react';
import { 
  ArrowRight, 
  Settings, 
  Sun, 
  Moon,
  Plus
} from 'lucide-react';
import { AudioProject, ReaderConfig } from '../types';

interface HeaderProps {
  currentProject: AudioProject | null;
  activeView: 'library' | 'reader';
  onNavigate: (view: 'library' | 'reader') => void;
  onOpenNewProjectModal: () => void;
  onOpenModelManagerModal: () => void;
  onOpenSettingsModal: () => void;
  config: ReaderConfig;
  onChangeConfig: (newConfig: Partial<ReaderConfig>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  activeView,
  onNavigate,
  onOpenNewProjectModal,
  onOpenSettingsModal,
  config,
  onChangeConfig
}) => {
  const isDark = config.theme === 'dark' || (config.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const toggleThemeQuick = () => {
    onChangeConfig({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/95 dark:bg-[#091122]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#182a47] shadow-xs dark:shadow-lg transition-colors font-[Cairo]">
      <div className="max-w-2xl mx-auto px-4 h-15 flex items-center justify-between">
        
        {/* Left Side: Amber/Gold Audio Equalizer Soundwave Icon (as in screenshot) */}
        <div className="flex items-center gap-2">
          {activeView === 'reader' && currentProject ? (
            <button
              id="btn-back-to-library"
              onClick={() => onNavigate('library')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-[#14233f] border border-teal-200 dark:border-[#1e3458] transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              <span>الدروس</span>
            </button>
          ) : (
            <div 
              onClick={() => onNavigate('library')}
              className="flex items-center gap-1 px-1.5 py-1 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
              title="مؤشر الصوت الفرنسي"
            >
              {/* Golden Soundwave Bars */}
              <div className="flex items-center gap-[3px] h-6">
                {[14, 22, 10, 26, 16, 20, 8].map((height, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-amber-500 dark:bg-amber-400"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick theme & settings icons */}
          <div className="flex items-center gap-1">
            <button
              id="btn-quick-theme-toggle"
              type="button"
              onClick={toggleThemeQuick}
              title={isDark ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع الداكن'}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#14233f] transition-all cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              id="btn-open-settings"
              type="button"
              onClick={onOpenSettingsModal}
              title="الإعدادات"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-[#14233f] transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Cyan / Teal Title "تعلّم الفرنسية" */}
        <div 
          onClick={() => onNavigate('library')}
          className="cursor-pointer text-right group"
        >
          <h1 className="text-xl sm:text-2xl font-black text-teal-600 dark:text-[#5eead4] tracking-tight group-hover:text-teal-700 dark:group-hover:text-teal-200 transition-colors drop-shadow-none dark:drop-shadow-[0_0_12px_rgba(94,234,212,0.35)]">
            تعلّم الفرنسية
          </h1>
        </div>

      </div>
    </header>
  );
};
