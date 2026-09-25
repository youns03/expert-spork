import { AudioProject, SentenceItem, ReaderConfig } from '../types';
import { loadAllOfflineLessons, saveLessonOffline } from './offlineDb';

const STORAGE_KEY = 'highlight_pro_user_projects_v3';
const CONFIG_STORAGE_KEY = 'highlight_pro_user_config_v3';

export const DEFAULT_READER_CONFIG: ReaderConfig = {
  style: 'gradient',
  color: '#2dd4bf', // Glowing cyan / turquoise matching design reference
  speed: 1.0,
  fontSize: 'medium',
  fontFamily: 'cairo',
  showTranslation: true,
  autoScroll: true,
  loopMode: 'none',
  theme: 'dark'
};

// Starter French Lessons matching the UI design reference
export const DEFAULT_FRENCH_LESSONS: AudioProject[] = [
  {
    id: 'lesson-vacances-1',
    title: 'Une journée de vacances',
    arabicTitle: 'يوم في الإجازة',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: 'fr',
    direction: 'ltr',
    level: 'A1',
    voiceId: 'fr_female_celeste',
    speed: 1.0,
    duration: 42.0,
    progressPercent: 37,
    bookmarked: true,
    isOfflineReady: true,
    sourceType: 'tts_generated',
    sentences: [
      {
        id: 's-1-1',
        text: "Pendant les vacances d'été, je me réveille tôt le matin.",
        french: "Pendant les vacances d'été, je me réveille tôt le matin.",
        arabic: "خلال العطلة الصيفية، أستيقظ مبكراً في الصباح.",
        translation: "خلال العطلة الصيفية، أستيقظ مبكراً في الصباح.",
        start: 0.1,
        end: 4.2,
        words: [
          { id: 'w-1-1', text: 'Pendant', start: 0.1, end: 0.7, translation: 'خلال' },
          { id: 'w-1-2', text: 'les', start: 0.7, end: 0.9, translation: 'الـ' },
          { id: 'w-1-3', text: 'vacances', start: 0.9, end: 1.6, translation: 'العطلة' },
          { id: 'w-1-4', text: "d'été,", start: 1.6, end: 2.2, translation: 'الصيفية' },
          { id: 'w-1-5', text: 'je', start: 2.2, end: 2.5, translation: 'أنا' },
          { id: 'w-1-6', text: 'me', start: 2.5, end: 2.7, translation: 'نفسي' },
          { id: 'w-1-7', text: 'réveille', start: 2.7, end: 3.3, translation: 'أستيقظ' },
          { id: 'w-1-8', text: 'tôt', start: 3.3, end: 3.6, translation: 'مبكراً' },
          { id: 'w-1-9', text: 'le', start: 3.6, end: 3.8, translation: 'في' },
          { id: 'w-1-10', text: 'matin.', start: 3.8, end: 4.2, translation: 'الصباح' }
        ]
      },
      {
        id: 's-1-2',
        text: "Le soleil brille et la brise marine est très agréable.",
        french: "Le soleil brille et la brise marine est très agréable.",
        arabic: "الشمس مشرقة ونسيم البحر لطيف للغاية.",
        translation: "الشمس مشرقة ونسيم البحر لطيف للغاية.",
        start: 4.5,
        end: 8.8,
        words: [
          { id: 'w-2-1', text: 'Le', start: 4.5, end: 4.8, translation: 'الـ' },
          { id: 'w-2-2', text: 'soleil', start: 4.8, end: 5.4, translation: 'شمس' },
          { id: 'w-2-3', text: 'brille', start: 5.4, end: 6.0, translation: 'تشرق' },
          { id: 'w-2-4', text: 'et', start: 6.0, end: 6.2, translation: 'و' },
          { id: 'w-2-5', text: 'la', start: 6.2, end: 6.4, translation: 'الـ' },
          { id: 'w-2-6', text: 'brise', start: 6.4, end: 6.9, translation: 'نسيم' },
          { id: 'w-2-7', text: 'marine', start: 6.9, end: 7.5, translation: 'البحر' },
          { id: 'w-2-8', text: 'est', start: 7.5, end: 7.7, translation: 'هو' },
          { id: 'w-2-9', text: 'très', start: 7.7, end: 8.1, translation: 'جداً' },
          { id: 'w-2-10', text: 'agréable.', start: 8.1, end: 8.8, translation: 'لطيف' }
        ]
      },
      {
        id: 's-1-3',
        text: "Nous préparons un délicieux petit-déjeuner sur la terrasse.",
        french: "Nous préparons un délicieux petit-déjeuner sur la terrasse.",
        arabic: "نحن نجهز وجبة إفطار لذيذة في الشرفة.",
        translation: "نحن نجهز وجبة إفطار لذيذة في الشرفة.",
        start: 9.1,
        end: 13.5,
        words: [
          { id: 'w-3-1', text: 'Nous', start: 9.1, end: 9.5, translation: 'نحن' },
          { id: 'w-3-2', text: 'préparons', start: 9.5, end: 10.3, translation: 'نحضر' },
          { id: 'w-3-3', text: 'un', start: 10.3, end: 10.5, translation: 'أداة' },
          { id: 'w-3-4', text: 'délicieux', start: 10.5, end: 11.3, translation: 'لذيذ' },
          { id: 'w-3-5', text: 'petit-déjeuner', start: 11.3, end: 12.3, translation: 'إفطار' },
          { id: 'w-3-6', text: 'sur', start: 12.3, end: 12.6, translation: 'على' },
          { id: 'w-3-7', text: 'la', start: 12.6, end: 12.8, translation: 'الـ' },
          { id: 'w-3-8', text: 'terrasse.', start: 12.8, end: 13.5, translation: 'الشرفة' }
        ]
      },
      {
        id: 's-1-4',
        text: "Ensuite, nous allons nous promener au bord de la plage.",
        french: "Ensuite, nous allons nous promener au bord de la plage.",
        arabic: "بعد ذلك، نذهب للتنزه على شاطئ البحر.",
        translation: "بعد ذلك، نذهب للتنزه على شاطئ البحر.",
        start: 13.8,
        end: 18.2,
        words: [
          { id: 'w-4-1', text: 'Ensuite,', start: 13.8, end: 14.5, translation: 'بعد ذلك' },
          { id: 'w-4-2', text: 'nous', start: 14.5, end: 14.9, translation: 'نحن' },
          { id: 'w-4-3', text: 'allons', start: 14.9, end: 15.4, translation: 'نذهب' },
          { id: 'w-4-4', text: 'nous', start: 15.4, end: 15.7, translation: 'لـ' },
          { id: 'w-4-5', text: 'promener', start: 15.7, end: 16.5, translation: 'التنزه' },
          { id: 'w-4-6', text: 'au', start: 16.5, end: 16.8, translation: 'على' },
          { id: 'w-4-7', text: 'bord', start: 16.8, end: 17.2, translation: 'حافة' },
          { id: 'w-4-8', text: 'de', start: 17.2, end: 17.4, translation: 'من' },
          { id: 'w-4-9', text: 'la', start: 17.4, end: 17.6, translation: 'الـ' },
          { id: 'w-4-10', text: 'plage.', start: 17.6, end: 18.2, translation: 'الشاطئ' }
        ]
      },
      {
        id: 's-1-5',
        text: "C'est une belle journée pour nager et se détendre.",
        french: "C'est une belle journée pour nager et se détendre.",
        arabic: "إنه يوم جميل للسباحة والاسترخاء.",
        translation: "إنه يوم جميل للسباحة والاسترخاء.",
        start: 18.5,
        end: 22.8,
        words: [
          { id: 'w-5-1', text: "C'est", start: 18.5, end: 19.0, translation: 'إنه' },
          { id: 'w-5-2', text: 'une', start: 19.0, end: 19.3, translation: 'أداة' },
          { id: 'w-5-3', text: 'belle', start: 19.3, end: 19.8, translation: 'جميل' },
          { id: 'w-5-4', text: 'journée', start: 19.8, end: 20.5, translation: 'يوم' },
          { id: 'w-5-5', text: 'pour', start: 20.5, end: 20.8, translation: 'لأجل' },
          { id: 'w-5-6', text: 'nager', start: 20.8, end: 21.5, translation: 'السباحة' },
          { id: 'w-5-7', text: 'et', start: 21.5, end: 21.7, translation: 'و' },
          { id: 'w-5-8', text: 'se', start: 21.7, end: 22.0, translation: 'أن' },
          { id: 'w-5-9', text: 'détendre.', start: 22.0, end: 22.8, translation: 'يسترخي' }
        ]
      },
      {
        id: 's-1-6',
        text: "Les enfants construisent de grands châteaux de sable.",
        french: "Les enfants construisent de grands châteaux de sable.",
        arabic: "يبني الأطفال قلاعاً رملية كبيرة.",
        translation: "يبني الأطفال قلاعاً رملية كبيرة.",
        start: 23.1,
        end: 27.2,
        words: [
          { id: 'w-6-1', text: 'Les', start: 23.1, end: 23.4, translation: 'الـ' },
          { id: 'w-6-2', text: 'enfants', start: 23.4, end: 24.1, translation: 'أطفال' },
          { id: 'w-6-3', text: 'construisent', start: 24.1, end: 25.0, translation: 'يبنون' },
          { id: 'w-6-4', text: 'de', start: 25.0, end: 25.2, translation: 'من' },
          { id: 'w-6-5', text: 'grands', start: 25.2, end: 25.7, translation: 'كبيرة' },
          { id: 'w-6-6', text: 'châteaux', start: 25.7, end: 26.5, translation: 'قلاع' },
          { id: 'w-6-7', text: 'de', start: 26.5, end: 26.7, translation: 'من' },
          { id: 'w-6-8', text: 'sable.', start: 26.7, end: 27.2, translation: 'الرمل' }
        ]
      },
      {
        id: 's-1-7',
        text: "L'après-midi, nous visitons le vieux village médiéval.",
        french: "L'après-midi, nous visitons le vieux village médiéval.",
        arabic: "في بعد الظهر، نزور القرية القديمة التي تعود للعصور الوسطى.",
        translation: "في بعد الظهر، نزور القرية القديمة التي تعود للعصور الوسطى.",
        start: 27.5,
        end: 32.0,
        words: [
          { id: 'w-7-1', text: "L'après-midi,", start: 27.5, end: 28.5, translation: 'بعد الظهر' },
          { id: 'w-7-2', text: 'nous', start: 28.5, end: 28.9, translation: 'نحن' },
          { id: 'w-7-3', text: 'visitons', start: 28.9, end: 29.6, translation: 'نزور' },
          { id: 'w-7-4', text: 'le', start: 29.6, end: 29.8, translation: 'الـ' },
          { id: 'w-7-5', text: 'vieux', start: 29.8, end: 30.3, translation: 'القديمة' },
          { id: 'w-7-6', text: 'village', start: 30.3, end: 31.0, translation: 'القرية' },
          { id: 'w-7-7', text: 'médiéval.', start: 31.0, end: 32.0, translation: 'التاريخية' }
        ]
      },
      {
        id: 's-1-8',
        text: "Nous achetons des fruits frais au marché local.",
        french: "Nous achetons des fruits frais au marché local.",
        arabic: "نشتري فواكه طازجة من السوق المحلي.",
        translation: "نشتري فواكه طازجة من السوق المحلي.",
        start: 32.3,
        end: 36.2,
        words: [
          { id: 'w-8-1', text: 'Nous', start: 32.3, end: 32.7, translation: 'نحن' },
          { id: 'w-8-2', text: 'achetons', start: 32.7, end: 33.5, translation: 'نشتري' },
          { id: 'w-8-3', text: 'des', start: 33.5, end: 33.7, translation: 'أداة' },
          { id: 'w-8-4', text: 'fruits', start: 33.7, end: 34.3, translation: 'فواكه' },
          { id: 'w-8-5', text: 'frais', start: 34.3, end: 34.8, translation: 'طازجة' },
          { id: 'w-8-6', text: 'au', start: 34.8, end: 35.1, translation: 'في' },
          { id: 'w-8-7', text: 'marché', start: 35.1, end: 35.7, translation: 'السوق' },
          { id: 'w-8-8', text: 'local.', start: 35.7, end: 36.2, translation: 'المحلي' }
        ]
      },
      {
        id: 's-1-9',
        text: "Le soir venu, nous dînons dans un petit bistrot charmant.",
        french: "Le soir venu, nous dînons dans un petit bistrot charmant.",
        arabic: "وعند حلول المساء، نتعشى في مطعم صغير ساحر.",
        translation: "وعند حلول المساء، نتعشى في مطعم صغير ساحر.",
        start: 36.5,
        end: 40.5,
        words: [
          { id: 'w-9-1', text: 'Le', start: 36.5, end: 36.7, translation: 'الـ' },
          { id: 'w-9-2', text: 'soir', start: 36.7, end: 37.1, translation: 'مساء' },
          { id: 'w-9-3', text: 'venu,', start: 37.1, end: 37.6, translation: 'حلول' },
          { id: 'w-9-4', text: 'nous', start: 37.6, end: 38.0, translation: 'نحن' },
          { id: 'w-9-5', text: 'dînons', start: 38.0, end: 38.6, translation: 'نتعشى' },
          { id: 'w-9-6', text: 'dans', start: 38.6, end: 38.9, translation: 'في' },
          { id: 'w-9-7', text: 'un', start: 38.9, end: 39.1, translation: 'أداة' },
          { id: 'w-9-8', text: 'petit', start: 39.1, end: 39.5, translation: 'صغير' },
          { id: 'w-9-9', text: 'bistrot', start: 39.5, end: 40.0, translation: 'مطعم' },
          { id: 'w-9-10', text: 'charmant.', start: 40.0, end: 40.5, translation: 'ساحر' }
        ]
      },
      {
        id: 's-1-10',
        text: "C'était vraiment une journée de vacances inoubliable.",
        french: "C'était vraiment une journée de vacances inoubliable.",
        arabic: "كان حقاً يوماً من أيام الإجازة لا يُنسى.",
        translation: "كان حقاً يوماً من أيام الإجازة لا يُنسى.",
        start: 40.8,
        end: 45.0,
        words: [
          { id: 'w-10-1', text: "C'était", start: 40.8, end: 41.4, translation: 'كان' },
          { id: 'w-10-2', text: 'vraiment', start: 41.4, end: 42.0, translation: 'حقاً' },
          { id: 'w-10-3', text: 'une', start: 42.0, end: 42.2, translation: 'أداة' },
          { id: 'w-10-4', text: 'journée', start: 42.2, end: 42.8, translation: 'يوم' },
          { id: 'w-10-5', text: 'de', start: 42.8, end: 43.0, translation: 'من' },
          { id: 'w-10-6', text: 'vacances', start: 43.0, end: 43.7, translation: 'العطلة' },
          { id: 'w-10-7', text: 'inoubliable.', start: 43.7, end: 45.0, translation: 'لا ينسى' }
        ]
      }
    ]
  },
  {
    id: 'lesson-vacances-2',
    title: 'Une journée de vacances',
    arabicTitle: 'يوم في الإجازة',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    language: 'fr',
    direction: 'ltr',
    level: 'A1',
    voiceId: 'fr_male_remy',
    speed: 1.0,
    duration: 38.0,
    progressPercent: 25,
    bookmarked: false,
    isOfflineReady: true,
    sourceType: 'tts_generated',
    sentences: [
      {
        id: 's-2-1',
        text: "Nous prenons le train express pour aller à la montagne.",
        french: "Nous prenons le train express pour aller à la montagne.",
        arabic: "نستقل القطار السريع للذهاب إلى الجبل.",
        translation: "نستقل القطار السريع للذهاب إلى الجبل.",
        start: 0.1,
        end: 4.5,
        words: [
          { id: 'w-21-1', text: 'Nous', start: 0.1, end: 0.5, translation: 'نحن' },
          { id: 'w-21-2', text: 'prenons', start: 0.5, end: 1.2, translation: 'نأخذ' },
          { id: 'w-21-3', text: 'le', start: 1.2, end: 1.4, translation: 'الـ' },
          { id: 'w-21-4', text: 'train', start: 1.4, end: 1.9, translation: 'قطار' },
          { id: 'w-21-5', text: 'express', start: 1.9, end: 2.6, translation: 'سريع' },
          { id: 'w-21-6', text: 'pour', start: 2.6, end: 2.9, translation: 'لـ' },
          { id: 'w-21-7', text: 'aller', start: 2.9, end: 3.4, translation: 'الذهاب' },
          { id: 'w-21-8', text: 'à', start: 3.4, end: 3.6, translation: 'إلى' },
          { id: 'w-21-9', text: 'la', start: 3.6, end: 3.8, translation: 'الـ' },
          { id: 'w-21-10', text: 'montagne.', start: 3.8, end: 4.5, translation: 'الجبل' }
        ]
      },
      {
        id: 's-2-2',
        text: "Les paysages verts qui défilent sont magnifiques.",
        french: "Les paysages verts qui défilent sont magnifiques.",
        arabic: "المناظر الخضراء التي تمر أمامنا رائعة الجمال.",
        translation: "المناظر الخضراء التي تمر أمامنا رائعة الجمال.",
        start: 4.8,
        end: 9.0,
        words: [
          { id: 'w-22-1', text: 'Les', start: 4.8, end: 5.1, translation: 'الـ' },
          { id: 'w-22-2', text: 'paysages', start: 5.1, end: 5.9, translation: 'مناظر' },
          { id: 'w-22-3', text: 'verts', start: 5.9, end: 6.5, translation: 'خضراء' },
          { id: 'w-22-4', text: 'qui', start: 6.5, end: 6.8, translation: 'التي' },
          { id: 'w-22-5', text: 'défilent', start: 6.8, end: 7.5, translation: 'تمر' },
          { id: 'w-22-6', text: 'sont', start: 7.5, end: 7.8, translation: 'تكون' },
          { id: 'w-22-7', text: 'magnifiques.', start: 7.8, end: 9.0, translation: 'رائعة' }
        ]
      }
    ]
  },
  {
    id: 'lesson-vacances-3',
    title: 'Une journée de vacances',
    arabicTitle: 'يوم في الإجازة',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    language: 'fr',
    direction: 'ltr',
    level: 'A2',
    voiceId: 'fr_female_celeste',
    speed: 1.0,
    duration: 35.0,
    progressPercent: 18,
    bookmarked: false,
    isOfflineReady: true,
    sourceType: 'tts_generated',
    sentences: [
      {
        id: 's-3-1',
        text: "Arrivés au chalet, nous allumons un feu de cheminée chaleureux.",
        french: "Arrivés au chalet, nous allumons un feu de cheminée chaleureux.",
        arabic: "عند وصولنا إلى الكوخ الخشبي، أشعلنا نار الموقد الدافئة.",
        translation: "عند وصولنا إلى الكوخ الخشبي، أشعلنا نار الموقد الدافئة.",
        start: 0.1,
        end: 5.2,
        words: [
          { id: 'w-31-1', text: 'Arrivés', start: 0.1, end: 0.8, translation: 'وصلنا' },
          { id: 'w-31-2', text: 'au', start: 0.8, end: 1.1, translation: 'إلى' },
          { id: 'w-31-3', text: 'chalet,', start: 1.1, end: 1.8, translation: 'الكوخ' },
          { id: 'w-31-4', text: 'nous', start: 1.8, end: 2.2, translation: 'نحن' },
          { id: 'w-31-5', text: 'allumons', start: 2.2, end: 3.0, translation: 'نشعل' },
          { id: 'w-31-6', text: 'un', start: 3.0, end: 3.2, translation: 'أداة' },
          { id: 'w-31-7', text: 'feu', start: 3.2, end: 3.7, translation: 'نار' },
          { id: 'w-31-8', text: 'de', start: 3.7, end: 3.9, translation: 'الـ' },
          { id: 'w-31-9', text: 'cheminée', start: 3.9, end: 4.6, translation: 'مدفأة' },
          { id: 'w-31-10', text: 'chaleureux.', start: 4.6, end: 5.2, translation: 'دافئ' }
        ]
      }
    ]
  },
  {
    id: 'lesson-vacances-4',
    title: 'Une journée de vacances',
    arabicTitle: 'يوم في الإجازة',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    language: 'fr',
    direction: 'ltr',
    level: 'A1',
    voiceId: 'fr_male_remy',
    speed: 1.0,
    duration: 32.0,
    progressPercent: 10,
    bookmarked: false,
    isOfflineReady: true,
    sourceType: 'tts_generated',
    sentences: [
      {
        id: 's-4-1',
        text: "Je prends mon carnet pour noter mes impressions du voyage.",
        french: "Je prends mon carnet pour noter mes impressions du voyage.",
        arabic: "آخذ دفتري لتدوين انطباعاتي عن هذه الرحلة.",
        translation: "آخذ دفتري لتدوين انطباعاتي عن هذه الرحلة.",
        start: 0.1,
        end: 4.5,
        words: [
          { id: 'w-41-1', text: 'Je', start: 0.1, end: 0.4, translation: 'أنا' },
          { id: 'w-41-2', text: 'prends', start: 0.4, end: 0.9, translation: 'آخذ' },
          { id: 'w-41-3', text: 'mon', start: 0.9, end: 1.2, translation: 'دفتري' },
          { id: 'w-41-4', text: 'carnet', start: 1.2, end: 1.8, translation: 'دفتر' },
          { id: 'w-41-5', text: 'pour', start: 1.8, end: 2.1, translation: 'لـ' },
          { id: 'w-41-6', text: 'noter', start: 2.1, end: 2.7, translation: 'تدوين' },
          { id: 'w-41-7', text: 'mes', start: 2.7, end: 3.0, translation: 'الـ' },
          { id: 'w-41-8', text: 'impressions', start: 3.0, end: 3.9, translation: 'انطباعات' },
          { id: 'w-41-9', text: 'du', start: 3.9, end: 4.1, translation: 'عن' },
          { id: 'w-41-10', text: 'voyage.', start: 4.1, end: 4.5, translation: 'الرحلة' }
        ]
      }
    ]
  },
  {
    id: 'lesson-vacances-5',
    title: 'Une journée 7 de vacances',
    arabicTitle: 'يوم 7 من الإجازة',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
    language: 'fr',
    direction: 'ltr',
    level: 'A2',
    voiceId: 'fr_female_celeste',
    speed: 1.0,
    duration: 40.0,
    progressPercent: 8,
    bookmarked: false,
    isOfflineReady: true,
    sourceType: 'tts_generated',
    sentences: [
      {
        id: 's-5-1',
        text: "C'est déjà le septième jour et nous découvrons de nouveaux sentiers.",
        french: "C'est déjà le septième jour et nous découvrons de nouveaux sentiers.",
        arabic: "إنه اليوم السابع بالفعل ونحن نكتشف مسارات جديدة.",
        translation: "إنه اليوم السابع بالفعل ونحن نكتشف مسارات جديدة.",
        start: 0.1,
        end: 4.8,
        words: [
          { id: 'w-51-1', text: "C'est", start: 0.1, end: 0.6, translation: 'إنه' },
          { id: 'w-51-2', text: 'déjà', start: 0.6, end: 1.1, translation: 'بالفعل' },
          { id: 'w-51-3', text: 'le', start: 1.1, end: 1.3, translation: 'الـ' },
          { id: 'w-51-4', text: 'septième', start: 1.3, end: 2.0, translation: 'السابع' },
          { id: 'w-51-5', text: 'jour', start: 2.0, end: 2.4, translation: 'يوم' },
          { id: 'w-51-6', text: 'et', start: 2.4, end: 2.6, translation: 'و' },
          { id: 'w-51-7', text: 'nous', start: 2.6, end: 3.0, translation: 'نحن' },
          { id: 'w-51-8', text: 'découvrons', start: 3.0, end: 3.8, translation: 'نكتشف' },
          { id: 'w-51-9', text: 'de', start: 3.8, end: 4.0, translation: 'من' },
          { id: 'w-51-10', text: 'nouveaux', start: 4.0, end: 4.5, translation: 'جديدة' },
          { id: 'w-51-11', text: 'sentiers.', start: 4.5, end: 4.8, translation: 'مسارات' }
        ]
      }
    ]
  },
  {
    id: 'lesson-vacances-6',
    title: 'Au restaurant parisien',
    arabicTitle: 'في المطعم الباريسي',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
    language: 'fr',
    direction: 'ltr',
    level: 'B1',
    voiceId: 'fr_male_remy',
    speed: 1.0,
    duration: 48.0,
    progressPercent: 54,
    bookmarked: true,
    isOfflineReady: true,
    sourceType: 'tts_generated',
    sentences: [
      {
        id: 's-6-1',
        text: "Garçon, pourriez-vous nous apporter la carte des desserts, s'il vous plaît ?",
        french: "Garçon, pourriez-vous nous apporter la carte des desserts, s'il vous plaît ?",
        arabic: "سيدي النادل، هل بإمكانك إحضار قائمة الحلويات لو سمحت؟",
        translation: "سيدي النادل، هل بإمكانك إحضار قائمة الحلويات لو سمحت؟",
        start: 0.1,
        end: 4.9,
        words: [
          { id: 'w-61-1', text: 'Garçon,', start: 0.1, end: 0.8, translation: 'نادل' },
          { id: 'w-61-2', text: 'pourriez-vous', start: 0.8, end: 1.7, translation: 'هل يمكنك' },
          { id: 'w-61-3', text: 'nous', start: 1.7, end: 2.0, translation: 'لنا' },
          { id: 'w-61-4', text: 'apporter', start: 2.0, end: 2.7, translation: 'إحضار' },
          { id: 'w-61-5', text: 'la', start: 2.7, end: 2.9, translation: 'الـ' },
          { id: 'w-61-6', text: 'carte', start: 2.9, end: 3.4, translation: 'قائمة' },
          { id: 'w-61-7', text: 'des', start: 3.4, end: 3.6, translation: 'الـ' },
          { id: 'w-61-8', text: 'desserts,', start: 3.6, end: 4.2, translation: 'حلويات' },
          { id: 'w-61-9', text: "s'il", start: 4.2, end: 4.4, translation: 'لو' },
          { id: 'w-61-10', text: 'vous', start: 4.4, end: 4.6, translation: 'سمحت' },
          { id: 'w-61-11', text: 'plaît ?', start: 4.6, end: 4.9, translation: 'من فضلك' }
        ]
      }
    ]
  },
  {
    id: 'lesson-vacances-7',
    title: "Rencontre à l'aéroport",
    arabicTitle: 'لقاء في المطار',
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    updatedAt: new Date(Date.now() - 518400000).toISOString(),
    language: 'fr',
    direction: 'ltr',
    level: 'B2',
    voiceId: 'fr_female_celeste',
    speed: 1.0,
    duration: 55.0,
    progressPercent: 72,
    bookmarked: false,
    isOfflineReady: true,
    sourceType: 'tts_generated',
    sentences: [
      {
        id: 's-7-1',
        text: "Le vol en provenance de Montréal vient d'atterrir sur la piste principale.",
        french: "Le vol en provenance de Montréal vient d'atterrir sur la piste principale.",
        arabic: "الرحلة الجوية القادمة من مونتريال هبطت للتو على المدرج الرئيسي.",
        translation: "الرحلة الجوية القادمة من مونتريال هبطت للتو على المدرج الرئيسي.",
        start: 0.1,
        end: 5.4,
        words: [
          { id: 'w-71-1', text: 'Le', start: 0.1, end: 0.3, translation: 'الـ' },
          { id: 'w-71-2', text: 'vol', start: 0.3, end: 0.7, translation: 'رحلة' },
          { id: 'w-71-3', text: 'en', start: 0.7, end: 0.9, translation: 'في' },
          { id: 'w-71-4', text: 'provenance', start: 0.9, end: 1.8, translation: 'قدوم' },
          { id: 'w-71-5', text: 'de', start: 1.8, end: 2.0, translation: 'من' },
          { id: 'w-71-6', text: 'Montréal', start: 2.0, end: 2.8, translation: 'مونتريال' },
          { id: 'w-71-7', text: 'vient', start: 2.8, end: 3.2, translation: 'جاء' },
          { id: 'w-71-8', text: "d'atterrir", start: 3.2, end: 4.1, translation: 'الهبوط' },
          { id: 'w-71-9', text: 'sur', start: 4.1, end: 4.3, translation: 'على' },
          { id: 'w-71-10', text: 'la', start: 4.3, end: 4.5, translation: 'الـ' },
          { id: 'w-71-11', text: 'piste', start: 4.5, end: 4.9, translation: 'مدرج' },
          { id: 'w-71-12', text: 'principale.', start: 4.9, end: 5.4, translation: 'رئيسي' }
        ]
      }
    ]
  }
];

export const DEFAULT_FRENCH_STARTER_LESSON = DEFAULT_FRENCH_LESSONS[0];

export async function loadProjectsFromStorage(): Promise<AudioProject[]> {
  try {
    // 1. Try loading from IndexedDB first
    const offlineLessons = await loadAllOfflineLessons();
    if (offlineLessons.length > 0) {
      return offlineLessons;
    }

    // 2. Try localStorage fallback
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // 3. Save default starter lessons to IndexedDB
    for (const lesson of DEFAULT_FRENCH_LESSONS) {
      await saveLessonOffline(lesson);
    }
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
  }
  return DEFAULT_FRENCH_LESSONS;
}

export async function saveProjectsToStorage(projects: AudioProject[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    for (const proj of projects) {
      await saveLessonOffline(proj);
    }
  } catch (err) {
    console.error('Failed to save projects to storage:', err);
  }
}

export function loadConfigFromStorage(): ReaderConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_READER_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load user config:', e);
  }
  return DEFAULT_READER_CONFIG;
}

export function saveConfigToStorage(config: ReaderConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save user config:', e);
  }
}
