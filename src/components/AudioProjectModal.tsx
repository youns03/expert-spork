import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Play, 
  Pause, 
  FileJson, 
  Wand2, 
  Loader2, 
  BookOpen, 
  Volume2,
  Languages,
  Sliders,
  ChevronDown,
  Info,
  Zap,
  ClipboardPaste,
  Trash2,
  FileCode
} from 'lucide-react';
import { AudioProject, SentenceItem, WordTiming, CEFRLevel, SynthesisProgress } from '../types';
import { AVAILABLE_FRENCH_VOICES, createFrenchLessonFromText } from '../utils/ttsEngine';
import { translateEnglishToFrenchAsync } from '../utils/frenchTranslator';
import { autoDistributeWordTimestamps } from '../utils/audioEngine';
import { parseWhisperXOrGenericJson } from '../utils/formatParsers';

interface AudioProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: AudioProject) => void;
}

const SAMPLE_FRENCH_TEXTS = [
  {
    title: 'العبارات الـ 5 الأساسية',
    level: 'A1' as CEFRLevel,
    text: `Bonjour, comment allez-vous aujourd'hui ?\nJe voudrais commander un café et un croissant.\nNous allons visiter Paris demain matin.\nEst-ce que vous pouvez répéter, s'il vous plaît ?\nIl y a beaucoup de personnes dans cette salle.`
  },
  {
    title: 'في المقهى والمطعم',
    level: 'A1' as CEFRLevel,
    text: `Bonjour monsieur. Une table pour deux personnes, s'il vous plaît.\nQue désirez-vous boire ?\nUn café noir et une bouteille d'eau minérale.\nL'addition, s'il vous plaît. Merci beaucoup et bonne journée !`
  },
  {
    title: 'السياحة والتنقل في باريس',
    level: 'A2' as CEFRLevel,
    text: `Excusez-moi, où se trouve la station de métro la plus proche ?\nPrenez la première rue à droite, puis continuez tout droit pendant cinq minutes.\nLe musée du Louvre est magnifique aujourd'hui.\nMerci pour votre aide précieuse !`
  },
  {
    title: 'قصة الأمير الصغير (نص طويل)',
    level: 'B1' as CEFRLevel,
    text: `Lorsque j'avais six ans, j'ai vu une magnifique image dans un livre sur la forêt vierge.\nÇa représentait un serpent boa qui avalait un fauve.\nJ'ai beaucoup réfléchi sur les aventures de la jungle.\nÀ mon tour, j'ai réussi avec un crayon de couleur à tracer mon premier dessin.\nMon dessin ne représentait pas un chapeau. Il représentait un serpent boa qui digérait un éléphant.\nJ'ai alors dessiné l'intérieur du serpent boa, afin que les grandes personnes puissent comprendre.\nElles ont toujours besoin d'explications détaillées.\nJ'ai dû choisir un autre métier et j'ai appris à piloter des avions.\nJ'ai volé un peu partout dans le monde entier.\nEt la géographie, c'est exact, m'a beaucoup servi dans ma vie professionnelle.`
  },
  {
    title: 'مقال شامل: تكنولوجيا المستقبل (نص مطول جداً)',
    level: 'B2' as CEFRLevel,
    text: `L'intelligence artificielle transforme profondément tous les aspects de notre société moderne.\nElle permet d'automatiser des tâches répétitives, d'analyser des volumes gigantesques de données et de faciliter la communication entre les peuples.\nDans le domaine de l'éducation, les outils numériques offrent un apprentissage personnalisé et interactif.\nChaque étudiant peut progresser à son propre rythme et explorer de nouvelles connaissances avec enthousiasme.\nCependant, il est essentiel de préserver l'esprit critique et la créativité humaine face à ces innovations rapides.\nLa technologie doit rester un instrument au service du bien commun et de l'épanouissement individuel.\nEn conclusion, l'avenir dépendra de notre capacité à allier progrès technologique et valeurs éthiques fondamentales.`
  }
];

export const AudioProjectModal: React.FC<AudioProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject
}) => {
  // Primary tab: 'text_to_speech' (new primary path)
  const [tab, setTab] = useState<'text_to_speech' | 'import_audio' | 'import_json'>('text_to_speech');
  
  // Text to speech parameters
  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState(SAMPLE_FRENCH_TEXTS[0].text);
  const [inputLang, setInputLang] = useState<'fr' | 'en'>('fr');
  const [englishAction, setEnglishAction] = useState<'translate_to_french' | 'keep_english'>('translate_to_french');
  const [level, setLevel] = useState<CEFRLevel>('A1');
  const [voiceId, setVoiceId] = useState<string>('fr_male_remy');
  const [speed, setSpeed] = useState<number>(1.0);

  // Audio Upload parameters (secondary path)
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(10);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [rawUploadText, setRawUploadText] = useState('');
  const [jsonText, setJsonText] = useState('');

  // Processing state & progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<SynthesisProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textFileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: typeof SAMPLE_FRENCH_TEXTS[0]) => {
    setInputText(tpl.text);
    setLevel(tpl.level);
    if (!title) setTitle(tpl.title);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setInputText(text.trim());
        setErrorMsg(null);
      }
    } catch (e) {
      // Fallback
    }
  };

  const handleImportTextFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && content.trim()) {
        setInputText(content.trim());
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
        }
        setErrorMsg(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Text statistics calculation
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;
  const estimatedSentences = inputText.trim() 
    ? Math.max(1, inputText.split(/[.!?؟\n]+/).filter(s => s.trim().length > 0).length) 
    : 0;
  const estimatedSeconds = Math.max(2, Math.ceil(estimatedSentences / 6) * 1.8);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i)) {
      setErrorMsg('يرجى اختيار ملف صوتي صالح (MP3, WAV, M4A, OGG...)');
      return;
    }

    setErrorMsg(null);
    setAudioFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAudioDataUrl(dataUrl);

      const tempAudio = new Audio(dataUrl);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          setAudioDuration(Math.round(tempAudio.duration * 10) / 10);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current && audioDataUrl) {
      previewAudioRef.current = new Audio(audioDataUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play().then(() => setIsPlayingPreview(true)).catch(() => {});
      }
    }
  };

  const handleGenerateLessonFromText = async () => {
    if (!inputText.trim()) {
      setErrorMsg('يرجى إدخال النص الفرنسي لإنشاء الدرس وتوليد الصوت.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let finalFrenchText = inputText.trim();

      // If English text entered and user wants translation to French
      if (inputLang === 'en' && englishAction === 'translate_to_french') {
        setProgressState({
          stage: 'preparing',
          currentSentence: 0,
          totalSentences: 0,
          percent: 5,
          message: 'جارٍ تحويل وترجمة النص الإنجليزي إلى الفرنسية بدقة سياقية...'
        });
        finalFrenchText = await translateEnglishToFrenchAsync(finalFrenchText);
      }

      const lesson = await createFrenchLessonFromText({
        title: title.trim() || undefined,
        frenchText: finalFrenchText,
        language: inputLang === 'en' && englishAction === 'keep_english' ? 'en' : 'fr',
        level,
        voiceId,
        speed,
        pauseBetweenSentences: 0.35,
        onProgress: (p) => setProgressState(p)
      });

      onCreateProject(lesson);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'تعذر توليد الدرس الصوتي. يرجى المحاولة مجدداً.');
    } finally {
      setIsProcessing(false);
      setProgressState(null);
    }
  };

  const handleImportAudioSubmit = () => {
    if (!audioFile || !audioDataUrl) {
      setErrorMsg('يرجى اختيار الملف الصوتي أولاً.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const cleanRaw = rawUploadText.trim() || 'Leçon audio française';
      const rawSentenceStrings = cleanRaw
        .split(/(?<=[.!?؟\n])\s+/)
        .map(s => s.trim())
        .filter(Boolean);

      const sentenceTexts = rawSentenceStrings.length > 0 ? rawSentenceStrings : [cleanRaw];
      const totalDuration = audioDuration > 0 ? audioDuration : 15;

      const totalSentenceChars = sentenceTexts.reduce((acc, s) => acc + Math.max(s.length, 5), 0);
      let currentSentenceStart = 0.2;

      const sentences: SentenceItem[] = sentenceTexts.map((sText, sIdx) => {
        const sShare = (Math.max(sText.length, 5) / totalSentenceChars) * (totalDuration * 0.95);
        const sStart = Math.round(currentSentenceStart * 100) / 100;
        const sEnd = Math.round(Math.min(totalDuration, sStart + sShare) * 100) / 100;
        currentSentenceStart = sEnd + 0.25;

        const sId = `s-${Date.now()}-${sIdx + 1}`;
        const words = autoDistributeWordTimestamps(sText, sStart, sEnd, sId);

        return {
          id: sId,
          text: sText,
          french: sText,
          start: sStart,
          end: sEnd,
          words
        };
      });

      const newProject: AudioProject = {
        id: `proj-${Date.now()}`,
        title: title.trim() || audioFile.name.replace(/\.[^/.]+$/, ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'fr',
        direction: 'ltr',
        level,
        audioFileName: audioFile.name,
        audioDataUrl,
        duration: totalDuration,
        sentences,
        sourceType: 'audio_uploaded'
      };

      if (previewAudioRef.current) previewAudioRef.current.pause();
      onCreateProject(newProject);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء استيراد الملف الصوتي.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJsonSubmit = () => {
    if (!jsonText.trim()) {
      setErrorMsg('يرجى إدخال كود JSON أو رفع ملف توقيتات WhisperX.');
      return;
    }

    try {
      const parsed = parseWhisperXOrGenericJson(jsonText, title);
      if (!parsed || parsed.sentences.length === 0) {
        setErrorMsg('فشل تحليل ملف JSON. تأكد من أنه بصيغة WhisperX أو Highlight Pro.');
        return;
      }

      const finalDuration = audioDuration > 1 ? audioDuration : parsed.duration;
      const newProject: AudioProject = {
        id: `proj-${Date.now()}`,
        title: title.trim() || 'درس فرنسي مستورد (WhisperX)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'fr',
        direction: 'ltr',
        level,
        audioFileName: audioFile?.name,
        audioDataUrl: audioDataUrl || undefined,
        duration: finalDuration,
        sentences: parsed.sentences,
        sourceType: 'whisperx_imported'
      };

      if (previewAudioRef.current) previewAudioRef.current.pause();
      onCreateProject(newProject);
      onClose();
    } catch (err: any) {
      setErrorMsg('فشل استيراد التوقيتات.');
    }
  };

  return (
    <div id="modal-new-lesson-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-[Cairo]">
      <div 
        id="modal-new-lesson-content"
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-xl rounded-3xl shadow-2xl border border-rose-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-50/80 to-white dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">إنشاء مادة تعليمية صوتية</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">تحويل النص الفرنسي إلى صوت طبيعي متزامن مع الترجمة والتظليل</p>
            </div>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="px-6 pt-3 pb-1 border-b border-rose-100 dark:border-slate-800 flex items-center gap-2 bg-rose-50/30 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setTab('text_to_speech')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'text_to_speech' 
                ? 'bg-rose-500 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>إنشاء درس من نص (الرئيسي)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('import_audio')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'import_audio' 
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-200 dark:border-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد تسجيل موجود</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('import_json')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'import_json' 
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-200 dark:border-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>WhisperX JSON</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: CREATE LESSON FROM TEXT (PRIMARY) */}
          {tab === 'text_to_speech' && (
            <div className="space-y-4">
              
              {/* Project Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الدرس أو الموضوع
                </label>
                <input
                  id="input-tts-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: حوار في المقهى، عبارات التعارف اليومية..."
                  className="w-full px-3.5 py-2 bg-rose-50/30 dark:bg-slate-800 border border-rose-200/80 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400/40 text-slate-800 dark:text-slate-100 text-sm transition-all"
                />
              </div>

              {/* Language Selection & English Action */}
              <div className="p-3 bg-rose-50/50 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    لغة النص المُدخل:
                  </span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-rose-200 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setInputLang('fr')}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                        inputLang === 'fr' ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      الفرنسية (Français)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputLang('en')}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                        inputLang === 'en' ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      الإنجليزية (English)
                    </button>
                  </div>
                </div>

                {inputLang === 'en' && (
                  <div className="pt-2 border-t border-rose-100 dark:border-slate-700 space-y-1.5 animate-in fade-in">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                      خيار معالجة النص الإنجليزي:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        englishAction === 'translate_to_french' 
                          ? 'bg-white dark:bg-slate-800 border-rose-400 ring-1 ring-rose-300 font-bold text-rose-700 dark:text-rose-300' 
                          : 'bg-white/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="en-action"
                          checked={englishAction === 'translate_to_french'}
                          onChange={() => setEnglishAction('translate_to_french')}
                          className="accent-rose-500"
                        />
                        <span>ترجمة إلى الفرنسية أولاً ثم توليد الصوت</span>
                      </label>

                      <label className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        englishAction === 'keep_english' 
                          ? 'bg-white dark:bg-slate-800 border-rose-400 ring-1 ring-rose-300 font-bold text-rose-700 dark:text-rose-300' 
                          : 'bg-white/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="en-action"
                          checked={englishAction === 'keep_english'}
                          onChange={() => setEnglishAction('keep_english')}
                          className="accent-rose-500"
                        />
                        <span>تشغيل بالإنجليزية مباشرة</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Input Area & Sample Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span>النص الفرنسي للمادة (يدعم النصوص والمقالات الطويلة جداً):</span>
                  </label>
                  
                  {/* Long text helper tools */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <input
                      ref={textFileInputRef}
                      type="file"
                      accept=".txt,.md,.srt,.vtt"
                      onChange={handleImportTextFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => textFileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors border border-rose-200/50 dark:border-slate-700"
                      title="استيراد ملف نصي طويل أو ملف ترجمات"
                    >
                      <Upload className="w-3 h-3" />
                      <span>رفع ملف نصي</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors border border-rose-200/50 dark:border-slate-700"
                      title="لصق نص طويل من الحافظة"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span>لصق نص</span>
                    </button>
                    {inputText.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setInputText('')}
                        className="px-1.5 py-0.5 rounded-lg text-slate-400 hover:text-red-500 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="مسح النص"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="textarea-tts-input"
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    dir="ltr"
                    placeholder="الصق أو اكتب النص الفرنسي هنا (يدعم آلاف الكلمات والقصص والدروس الطويلة وسيقوم النظام بتوليد الصوت بالتوازي بسرعة فائقة)..."
                    className="w-full p-3.5 bg-rose-50/20 dark:bg-slate-800/80 border border-rose-200/90 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400/40 text-slate-800 dark:text-slate-100 text-sm font-sans leading-relaxed transition-all resize-y"
                  />
                </div>

                {/* Long Text Stats Ribbon */}
                <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-rose-50/60 dark:bg-slate-800/60 rounded-xl border border-rose-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-3">
                    <span><strong>{wordCount.toLocaleString()}</strong> كلمة</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span><strong>{charCount.toLocaleString()}</strong> حرف</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span><strong>~{estimatedSentences}</strong> جملة تعليمية</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Zap className="w-3 h-3" />
                    <span>معالجة متوازية فائقة (8 مسارات)</span>
                  </div>
                </div>

                {/* Quick Sample Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 shrink-0">نماذج سريعة ومطولة:</span>
                  {SAMPLE_FRENCH_TEXTS.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 rounded-lg whitespace-nowrap transition-colors cursor-pointer border border-rose-200/60 dark:border-slate-700"
                    >
                      {tpl.title} ({tpl.level})
                    </button>
                  ))}
                </div>
              </div>

              {/* Lesson Configurations: Level, Voice, Speed */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                
                {/* 1. Level */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المستوى التعليمي (CEFR)
                  </label>
                  <select
                    id="select-tts-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="A1">A1 (مبتدئ أساسي)</option>
                    <option value="A2">A2 (مبتدئ متقدم)</option>
                    <option value="B1">B1 (متوسط)</option>
                    <option value="B2">B2 (فوق المتوسط)</option>
                    <option value="C1">C1 (متقدم)</option>
                  </select>
                </div>

                {/* 2. French Voice */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الصوت الفرنسي (استوديو فائق النقاء)
                  </label>
                  <select
                    id="select-tts-voice"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    {AVAILABLE_FRENCH_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Speed */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سرعة النطق
                  </label>
                  <select
                    id="select-tts-speed"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 font-mono"
                  >
                    <option value="0.8">0.8x (بطيء للتعلم)</option>
                    <option value="0.9">0.9x (متأنٍ)</option>
                    <option value="1.0">1.0x (طبيعي - افتراضي)</option>
                    <option value="1.1">1.1x (سريع قليلاً)</option>
                  </select>
                </div>
              </div>

              {/* Studio Audio Quality Badge */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50/70 dark:bg-slate-800/60 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold">هندسة استوديو فائقة (Studio Mastered 44.1 kHz):</span>
                  <span className="text-[11px] text-emerald-700/90 dark:text-emerald-400 hidden sm:inline">مانع طقطقة الفواصل + تعزيز مخارج الحروف والنبرة البشرية</span>
                </div>
                <span className="font-mono text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold">
                  HD 44.1kHz
                </span>
              </div>

              {/* Real-time Progress Bar */}
              {isProcessing && progressState && (
                <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-100/60 dark:from-slate-800 dark:to-slate-800/80 border border-rose-200 dark:border-slate-700 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{progressState.message}</span>
                    </span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 text-sm font-bold">{progressState.percent}%</span>
                  </div>

                  <div className="w-full bg-rose-200/70 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressState.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      توليد متزامن فائق السرعة عبر خيوط معالجة متعددة
                    </span>
                    {progressState.totalSentences > 0 && (
                      <span className="font-mono">{progressState.currentSentence} / {progressState.totalSentences} جملة</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  id="btn-generate-tts-lesson"
                  type="button"
                  disabled={isProcessing || !inputText.trim()}
                  onClick={handleGenerateLessonFromText}
                  className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-rose-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ التوليد...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>توليد الصوت وإنشاء الدرس</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: IMPORT PRE-EXISTING AUDIO (SECONDARY) */}
          {tab === 'import_audio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الدرس
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تسجيل محادثة فرنسية..."
                  className="w-full px-3.5 py-2 bg-rose-50/30 dark:bg-slate-800 border border-rose-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الملف الصوتي (MP3, WAV, M4A, OGG)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />

                {audioFile ? (
                  <div className="p-3 bg-rose-50/70 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center cursor-pointer"
                      >
                        {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100 text-xs">{audioFile.name}</p>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">المدة: {audioDuration} ثانية</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAudioFile(null); setAudioDataUrl(null); }}
                      className="text-xs text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-rose-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-slate-500 rounded-xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5 text-rose-500" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">اضغط لرفع ملف صوتي موجود</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نص التسجيل (اختياري، أو الصقه هنا):
                </label>
                <textarea
                  rows={3}
                  value={rawUploadText}
                  onChange={(e) => setRawUploadText(e.target.value)}
                  dir="ltr"
                  placeholder="إذا كان لديك نص التسجيل الصوتي، الصقه هنا..."
                  className="w-full p-3 bg-rose-50/20 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!audioFile}
                  onClick={handleImportAudioSubmit}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  إنشاء ومزامنة الدرس
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: WHISPERX JSON IMPORT */}
          {tab === 'import_json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ملف التوقيتات بصيغة JSON (WhisperX أو MFA):
                </label>
                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>رفع ملف .json</span>
                </button>
              </div>

              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setJsonText(ev.target?.result as string);
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />

              <textarea
                rows={6}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                dir="ltr"
                placeholder='الصق مخرجات WhisperX هنا...'
                className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700 rounded-xl"
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!jsonText.trim()}
                  onClick={handleJsonSubmit}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  استيراد مصفوفة التوقيتات
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
