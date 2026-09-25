import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  Trash2, 
  CheckCircle2, 
  Play, 
  Pause, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';
import { getModelCacheInfo, clearModelCache } from '../utils/offlineDb';
import { AVAILABLE_FRENCH_VOICES } from '../utils/ttsEngine';

interface VoiceModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceModelManagerModal: React.FC<VoiceModelManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [cacheInfo, setCacheInfo] = useState<{ cached: boolean; totalBytes: number; modelName: string }>({
    cached: false,
    totalBytes: 0,
    modelName: 'Kokoro-82M-v1.0-ONNX (q8)'
  });
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
    return () => {
      if (testAudio) {
        testAudio.pause();
      }
    };
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const info = await getModelCacheInfo();
      setCacheInfo(info);
    } catch {
      // ignore
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('هل تريد حذف الملفات المخزنة محلياً للنموذج؟ سيعاد تنزيلها عند الحاجة.')) {
      return;
    }
    await clearModelCache();
    await checkStatus();
    setStatusMessage('تم إفراغ الذاكرة المؤقتة للنموذج بنجاح.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleTestAudio = async () => {
    if (isPlayingTest && testAudio) {
      testAudio.pause();
      setIsPlayingTest(false);
      return;
    }

    try {
      setIsPlayingTest(true);
      const testPhrase = 'Bonjour ! La langue française est très belle et mélodieuse.';

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testPhrase,
          voice: 'fr_male_remy',
          speed: 1.0
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(data.audioBase64);
          setTestAudio(audio);
          audio.onended = () => setIsPlayingTest(false);
          audio.onerror = () => setIsPlayingTest(false);
          await audio.play();
          return;
        }
      }

      // Fallback if offline
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(testPhrase);
        u.lang = 'fr-FR';
        u.onend = () => setIsPlayingTest(false);
        u.onerror = () => setIsPlayingTest(false);
        window.speechSynthesis.speak(u);
      } else {
        setTimeout(() => setIsPlayingTest(false), 2000);
      }
    } catch (err) {
      console.error(err);
      setIsPlayingTest(false);
    }
  };

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 ميجابايت';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} ميجابايت`;
  };

  return (
    <div id="modal-model-manager-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-[Cairo]">
      <div 
        id="modal-model-manager-content"
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-lg rounded-3xl shadow-2xl border border-rose-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">إدارة محرك الصوت الفرنسي</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">حالة النموذج المحلي وتخزين الأصوات على الجهاز</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-sm">
          {statusMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Model Status Card */}
          <div className="p-4 bg-rose-50/50 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">نموذج النطق الفرنسي المحلي</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 text-rose-700 dark:text-rose-400 font-semibold">
                Kokoro-82M (q8) / ONNX
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">حالة التخزين المحلي:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {cacheInfo.cached ? 'جاهز ومخزن محلياً (Offline)' : 'جاهز للعمل المدمج'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">الحجم المستهلك:</span>
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-100">
                  {formatSize(cacheInfo.totalBytes)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-rose-100/80 dark:border-slate-700">
              <button
                type="button"
                onClick={handleTestAudio}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-slate-800 border border-rose-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPlayingTest ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>تجربة نطق عبارة فرنسية</span>
              </button>

              {cacheInfo.totalBytes > 0 && (
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الذاكرة المؤقتة</span>
                </button>
              )}
            </div>
          </div>

          {/* Available Voices List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              الأصوات الفرنسية المتاحة:
            </label>
            <div className="space-y-2">
              {AVAILABLE_FRENCH_VOICES.map((v) => (
                <div 
                  key={v.id}
                  className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold">
                      FR
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{v.name}</span>
                        {v.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-semibold">
                            افتراضي
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{v.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {v.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Engine Transparency Note */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>الخصوصية والشفافية:</span>
            </div>
            <p className="leading-relaxed">
              صوت فرنسي مولد بنموذج مفتوح، واضح وطبيعي قدر الإمكان، وتختلف النتيجة حسب الهاتف والنموذج. النصوص التي تدخلها تبقى 100% داخل جهازك وتعمل دون الحاجة إلى أي مفاتيح أو اشتراكات خارجية.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rose-100 dark:border-slate-800 flex justify-end bg-rose-50/30 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
