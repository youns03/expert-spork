import React from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Laptop, 
  Type, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Languages, 
  Check, 
  RotateCcw,
  Palette,
  Eye,
  Headphones
} from 'lucide-react';
import { ReaderConfig, ThemeMode, HighlightStyle } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReaderConfig;
  onChangeConfig: (newConfig: Partial<ReaderConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig
}) => {
  if (!isOpen) return null;

  const colorPalette = [
    { name: 'وردي هادئ (الافتراضي)', value: '#fda4af', border: 'border-rose-300' },
    { name: 'أحمر ياقوتي', value: '#f43f5e', border: 'border-rose-400' },
    { name: 'أزرق سماوي', value: '#60a5fa', border: 'border-blue-300' },
    { name: 'زمردي نضر', value: '#34d399', border: 'border-emerald-300' },
    { name: 'بنفسجي ملكي', value: '#c084fc', border: 'border-purple-300' },
    { name: 'كهرماني دافئ', value: '#fbbf24', border: 'border-amber-300' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="settings-modal-card"
        className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100 font-[Cairo] transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-rose-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">إعدادات التطبيق</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">تخصيص المظهر، الخطوط، والتظليل الصوتي</p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 divide-y divide-rose-100/70 dark:divide-slate-800">
          
          {/* Theme Section: Light / Dark / System */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-rose-500" />
              <span>المظهر والثيم (Theme Mode)</span>
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Light Mode */}
              <button
                id="btn-theme-light"
                type="button"
                onClick={() => onChangeConfig({ theme: 'light' })}
                className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  config.theme === 'light'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-xl ${config.theme === 'light' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Sun className="w-4 h-4" />
                </div>
                <span className="text-xs">وضع فاتح</span>
              </button>

              {/* Dark Mode */}
              <button
                id="btn-theme-dark"
                type="button"
                onClick={() => onChangeConfig({ theme: 'dark' })}
                className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  config.theme === 'dark'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-xl ${config.theme === 'dark' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-xs">وضع مظلم</span>
              </button>

              {/* System Mode */}
              <button
                id="btn-theme-system"
                type="button"
                onClick={() => onChangeConfig({ theme: 'system' })}
                className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  config.theme === 'system'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-xl ${config.theme === 'system' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Laptop className="w-4 h-4" />
                </div>
                <span className="text-xs">تلقائي (النظام)</span>
              </button>
            </div>
          </div>

          {/* Typography & Font Settings */}
          <div className="pt-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-rose-500" />
              <span>نوع وحجم الخط</span>
            </label>

            {/* Font Family */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cairo', name: 'Cairo (افتراضي)' },
                { id: 'tajawal', name: 'Tajawal' },
                { id: 'amiri', name: 'Amiri' },
                { id: 'system', name: 'النظام' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChangeConfig({ fontFamily: f.id as any })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    config.fontFamily === f.id
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-slate-600 dark:text-slate-300">الحجم الافتراضي:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'small', label: 'صغير' },
                  { id: 'medium', label: 'متوسط' },
                  { id: 'large', label: 'كبير' },
                  { id: 'xlarge', label: 'كبير جداً' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChangeConfig({ fontSize: s.id as any })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      config.fontSize === s.id
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flowing Highlight Customization */}
          <div className="pt-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>تخصيص التظليل اللوني المنساب</span>
            </label>

            {/* Highlight Style */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gradient', name: 'تدرج منساب' },
                { id: 'box', name: 'إطار ممتلئ' },
                { id: 'underline', name: 'خط سفلي' }
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onChangeConfig({ style: style.id as HighlightStyle })}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    config.style === style.id
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>

            {/* Highlight Color Palette */}
            <div className="pt-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">لون التظليل:</div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {colorPalette.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onChangeConfig({ color: c.value })}
                    title={c.name}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      config.color === c.value
                        ? 'scale-110 border-slate-800 dark:border-white shadow-md'
                        : 'border-white dark:border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {config.color === c.value && (
                      <Check className="w-4 h-4 text-slate-800 drop-shadow-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Studio Audio Quality & DSP Controls */}
          <div className="pt-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-rose-500" />
              <span>هندسة وجودة الصوت (Studio Audio Quality & DSP)</span>
            </label>

            {/* Studio Mastering Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <span>معالجة استوديو فائقة النقاء (Studio HD Mastering)</span>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">44.1 kHz</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  إزالة طقطقة وتقطيع البدايات والنهايات (Anti-Click Micro-fades) مع صوت محيطي دافئ
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.studioAudioMastering !== false}
                onChange={(e) => onChangeConfig({ studioAudioMastering: e.target.checked })}
                className="w-5 h-5 rounded-md accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Vocal Articulation Boost */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">تعزيز مخارج ونطق الحروف (Articulation Boost)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  تحسين نطاق 3.2 kHz لزيادة وضوح الحروف الصامتة والربط الصوتي (Liaison) للمتعلمين
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.vocalClarityBoost !== false}
                onChange={(e) => onChangeConfig({ vocalClarityBoost: e.target.checked })}
                className="w-5 h-5 rounded-md accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Warm Vocal Tone */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">نبرة دافئة مريحة للأذن (Vocal Warmth)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  إبراز الرنين الصدري الطبيعي وحذف الترددات الخانقة المنخفضة
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.vocalWarmthBoost !== false}
                onChange={(e) => onChangeConfig({ vocalWarmthBoost: e.target.checked })}
                className="w-5 h-5 rounded-md accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Reading & Translation Options */}
          <div className="pt-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-rose-500" />
              <span>خيارات القراءة والترجمة</span>
            </label>

            {/* Translation toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">إظهار الترجمة العربية السياقية</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">عرض الترجمة العربية الفصيحة أسفل كل سطر فرنسي</div>
              </div>
              <input
                type="checkbox"
                checked={config.showTranslation}
                onChange={(e) => onChangeConfig({ showTranslation: e.target.checked })}
                className="w-5 h-5 rounded-md accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Auto scroll toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">التمرير التلقائي أثناء الاستماع</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">متابعة السطر النشط تلقائياً في وسط الشاشة</div>
              </div>
              <input
                type="checkbox"
                checked={config.autoScroll}
                onChange={(e) => onChangeConfig({ autoScroll: e.target.checked })}
                className="w-5 h-5 rounded-md accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-rose-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
