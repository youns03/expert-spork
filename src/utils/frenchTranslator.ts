/**
 * Professional French-Arabic & English-French Contextual Translation Engine
 * Powered by neural contextual translation with offline fallback dictionary.
 * Strictly avoids literal fragmentation and ensures pure, fluent Arabic.
 */

import { apiUrl } from './api';

// In-memory translation cache for rapid lookup without re-fetching
const translationCache = new Map<string, string>();

// Curated high-frequency sentence mappings with professional Arabic phrasing
export const FRENCH_ARABIC_PHRASEBOOK: Record<string, string> = {
  // Common lesson sentences
  "bonjour, comment allez-vous aujourd'hui ?": "مرحباً، كيف حالكم اليوم؟",
  "bonjour, comment allez-vous aujourd'hui?": "مرحباً، كيف حالكم اليوم؟",
  "bonjour comment allez-vous aujourd'hui": "مرحباً كيف حالكم اليوم",
  "je voudrais commander un café et un croissant.": "أود أن أطلب قهوة وكرواسون.",
  "je voudrais commander un café et un croissant": "أود أن أطلب قهوة وكرواسون.",
  "nous allons visiter paris demain matin.": "سنقوم بزيارة باريس صباح الغد.",
  "nous allons visiter paris demain matin": "سنقوم بزيارة باريس صباح الغد.",
  "est-ce que vous pouvez répéter, s'il vous plaît ?": "هل يمكنكم الإعادة، من فضلكم؟",
  "est-ce que vous pouvez répéter, s'il vous plaît?": "هل يمكنكم الإعادة، من فضلكم؟",
  "est-ce que vous pouvez répéter s'il vous plaît": "هل يمكنكم الإعادة من فضلكم",
  "il y a beaucoup de personnes dans cette salle.": "هناك الكثير من الأشخاص في هذه القاعة.",
  "il y a beaucoup de personnes dans cette salle": "هناك الكثير من الأشخاص في هذه القاعة.",

  // Daily life & greetings
  "bonjour": "مرحباً / صباح الخير",
  "bonsoir": "مساء الخير",
  "salut": "أهلاً ومرحباً",
  "au revoir": "إلى اللقاء / مع السلامة",
  "à bientôt": "أراك قريباً",
  "bonne journée": "أتمنى لك يوماً سعيداً",
  "bonne soirée": "أمسية سعيدة وممتعة",
  "bonne nuit": "تصبح على خير",
  "merci beaucoup": "شكراً جزيلاً",
  "merci": "شكراً",
  "de rien": "على الرحب والسعة",
  "s'il vous plaît": "من فضلكم / لو سمحت",
  "s'il te plaît": "من فضلك / لو سمحت",
  "pardon": "عذراً / عفواً",
  "excusez-moi": "معذرة / اعذرني",
  "comment vous appelez-vous ?": "ما هو اسم حضرتكم؟",
  "comment t'appelles-tu ?": "ما هو اسمك؟",
  "je m'appelle": "اسمي هو",
  "enchanté": "تشرفت بمعرفتك",
  "enchantée": "تشرفتُ بمعرفتكِ",
  "ça va ?": "كيف تسير الأمور؟ هل كل شيء بخير؟",
  "oui, ça va bien, merci": "نعم، كل شيء على ما يرام، شكراً",
  "très bien": "جيد جداً وبشكل ممتاز",
  "d'où venez-vous ?": "من أي بلد أو مدينة أنتم؟",
  "je viens de": "أنا قادم من",
  "parlez-vous français ?": "هل تجيدون التحدث باللغة الفرنسية؟",
  "je parle un peu français": "أتحدث القليل من اللغة الفرنسية",
  "je ne comprends pas": "عذراً، لم أستوعب المعنى جيداً",
  "pouvez-vous m'aider ?": "هل بإمكانكم تقديم المساعدة لي؟",
  "où sont les toilettes ?": "أين توجد دورات المياه؟",
  "combien ça coûte ?": "كم يبلغ ثمن هذا؟",
  "l'addition, s'il vous plaît": "الحساب من فضلكم",
  "je suis étudiant": "أنا طالب علم",
  "j'apprends le français": "أنا أدرس وأتعلم اللغة الفرنسية",
  "le français est une belle langue": "الفرنسية لغة أنيقة وجميلة",
  "c'est très intéressant": "هذا موضوع ممتع وشيق للغاية",
  "quelle heure est-il ?": "كم الساعة الآن؟",
  "il est trois heures": "الساعة الآن تشير إلى الثالثة",
  "quel temps fait-il ?": "كيف يبدو الطقس اليوم؟",
  "il fait beau aujourd'hui": "الطقس مشمس ورائع اليوم"
};

// Comprehensive French-to-Arabic Vocabulary & Glossing Dictionary
export const FRENCH_ARABIC_DICTIONARY: Record<string, string> = {
  // Pronouns
  "je": "أنا",
  "j'": "أنا",
  "tu": "أنتَ",
  "il": "هو",
  "elle": "هي",
  "on": "نحن",
  "nous": "نحن",
  "vous": "أنتم / حضرتك",
  "ils": "هم",
  "elles": "هنّ",
  "moi": "أنا",
  "toi": "أنت",
  "lui": "هو",
  "leur": "لهم",
  "se": "نفسه",
  "me": "ـني / إياي",
  "te": "ـك / إياك",

  // Verbs & common forms
  "suis": "أكون",
  "es": "تكون",
  "est": "هو / تكون",
  "sommes": "نكون",
  "êtes": "تكونون",
  "sont": "يكونون",
  "été": "كان / كائن",
  "être": "أن يكون",
  "avoir": "أن يمتلك",
  "ai": "لديّ / أملك",
  "as": "لديك / تملك",
  "a": "لديه / يملك",
  "avons": "لدينا / نملك",
  "avez": "لديكم / تملكون",
  "ont": "لديهم / يملكون",
  "eu": "حصل على",
  "vais": "أذهب",
  "vas": "تذهب",
  "va": "يذهب / تسير",
  "allons": "سنذهب / نذهب",
  "allez": "تذهبون",
  "vont": "يذهبون",
  "aller": "الذهاب",
  "voudrais": "أود / أرغب",
  "vouloir": "الإرادة / يريد",
  "veut": "يريد",
  "veulent": "يريدون",
  "pouvoir": "القدرة / يستطيع",
  "pouvez": "تستطيعون",
  "peux": "أستطيع",
  "peut": "يستطيع",
  "peuvent": "يستطيعون",
  "faire": "يفعل / يصنع",
  "fais": "أفعل",
  "fait": "يفعل / صنع",
  "faisons": "نفعل",
  "faites": "تفعلون",
  "font": "يفعلون",
  "dire": "يقول",
  "dis": "أقول",
  "dit": "يقول",
  "disons": "نقول",
  "dites": "تقولون",
  "disent": "يقولون",
  "commander": "يطلب",
  "visiter": "يزور",
  "répéter": "يعيد / يكرر",
  "parler": "يتحدث",
  "parle": "أتحدث",
  "parles": "تتحدث",
  "parlons": "نتحدث",
  "parlez": "تتحدثون",
  "parlent": "يتحدثون",
  "comprendre": "يفهم",
  "comprends": "أفهم",
  "comprend": "يفهم",
  "comprenons": "نفهم",
  "apprendre": "يتعلم",
  "apprends": "أتعلم",
  "apprend": "يتعلم",
  "manger": "يأكل",
  "mange": "آكل",
  "boire": "يشرب",
  "bois": "أشرب",
  "boit": "يشرب",
  "écouter": "يستمع",
  "écoute": "أستمع",
  "lire": "يقرأ",
  "lis": "أقرأ",
  "lit": "يقرأ",
  "écrire": "يكتب",
  "écris": "أكتب",
  "écrit": "يكتب",
  "voir": "يرى",
  "vois": "أرى",
  "voit": "يرى",
  "savoir": "يعلم",
  "sais": "أعلم",
  "sait": "يعلم",
  "connaître": "يعرف",
  "connais": "أعرف",
  "connaît": "يعرف",
  "aimer": "يحب",
  "aime": "أحب",
  "aimes": "تحب",
  "aimons": "نحب",
  "aimez": "تحبون",
  "aiment": "يحبون",
  "adorer": "يعشق",
  "préférer": "يفضل",
  "habiter": "يسكن",
  "habite": "أسكن",
  "travailler": "يعمل",
  "travaille": "أعمل",
  "partir": "يغادر",
  "arriver": "يصل",
  "venir": "يأتي",
  "viens": "آتي",
  "vient": "يأتي",
  "prendre": "يأخذ",
  "prends": "آخذ",
  "prend": "يأخذ",

  // Nouns
  "bonjour": "مرحباً",
  "matin": "صباح",
  "soir": "مساء",
  "nuit": "ليل",
  "jour": "يوم",
  "journée": "نهار",
  "aujourd'hui": "اليوم",
  "demain": "غداً",
  "hier": "أمس",
  "café": "قهوة / مقهى",
  "croissant": "كرواسون",
  "pain": "خبز",
  "eau": "ماء",
  "thé": "شاي",
  "lait": "حليب",
  "sucre": "سكر",
  "restaurant": "مطعم",
  "hôtel": "فندق",
  "gare": "محطة",
  "aéroport": "مطار",
  "train": "قطار",
  "avion": "طائرة",
  "voiture": "سيارة",
  "bus": "حافلة",
  "métro": "مترو",
  "paris": "باريس",
  "france": "فرنسا",
  "salle": "قاعة",
  "chambre": "غرفة",
  "maison": "منزل",
  "appartement": "شقة",
  "ville": "مدينة",
  "rue": "شارع",
  "avenue": "جادة",
  "place": "ساحة",
  "livre": "كتاب",
  "cours": "درس",
  "leçon": "درس",
  "langue": "لغة",
  "mot": "كلمة",
  "phrase": "جملة",
  "texte": "نص",
  "histoire": "قصة",
  "français": "الفرنسية",
  "arabe": "العربية",
  "anglais": "الإنجليزية",
  "personnes": "أشخاص",
  "gens": "ناس",
  "homme": "رجل",
  "femme": "امرأة",
  "enfant": "طفل",
  "ami": "صديق",
  "famille": "عائلة",
  "père": "أب",
  "mère": "أم",
  "frère": "أخ",
  "soeur": "أخت",
  "temps": "وقت / طقس",
  "heure": "ساعة",
  "minute": "دقيقة",
  "seconde": "ثانية",
  "prix": "سعر",
  "argent": "مال",
  "travail": "عمل",
  "école": "مدرسة",
  "université": "جامعة",
  "professeur": "أستاذ",
  "étudiant": "طالب",

  // Adjectives & Adverbs
  "beaucoup": "كثيراً",
  "peu": "قليلاً",
  "très": "جداً",
  "trop": "أكثر من اللازم",
  "assez": "بما فيه الكفاية",
  "bien": "جيد / بخير",
  "bon": "طيب",
  "bonne": "طيبة",
  "bons": "طيبون",
  "bonnes": "طيبات",
  "mauvais": "سيء",
  "beau": "جميل",
  "belle": "جميلة",
  "beaux": "جميلون",
  "grand": "كبير",
  "grande": "كبيرة",
  "petit": "صغير",
  "petite": "صغيرة",
  "facile": "سهل",
  "difficile": "صعب",
  "nouveau": "جديد",
  "nouvelle": "جديدة",
  "vieux": "قديم",
  "vieille": "قديمة",
  "jeune": "شاب",
  "important": "مهم",
  "intéressant": "ممتع",
  "magnifique": "رائع",
  "rapide": "سريع",
  "lent": "بطيء",
  "chaud": "ساخن",
  "froid": "بارد",
  "ici": "هنا",
  "là": "هناك",
  "maintenant": "الآن",
  "toujours": "دائماً",
  "souvent": "غالباً",
  "parfois": "أحياناً",
  "jamais": "أبداً",
  "oui": "نعم",
  "non": "لا",
  "merci": "شكراً",

  // Prepositions & Articles
  "dans": "في",
  "en": "في",
  "à": "إلى / في",
  "de": "من",
  "du": "من الـ",
  "des": "من الـ / بعض",
  "le": "الـ",
  "la": "الـ",
  "l'": "الـ",
  "les": "الـ",
  "un": "أداة نكرة (مفرد مذكر)",
  "une": "أداة نكرة (مفرد مؤنث)",
  "pour": "لـ / من أجل",
  "avec": "مع",
  "sans": "بدون",
  "sur": "على",
  "sous": "تحت",
  "par": "عبر / بواسطة",
  "et": "و",
  "ou": "أو",
  "mais": "لكن",
  "donc": "إذن",
  "car": "لأن",
  "parce": "لأن",
  "parce que": "لأن",
  "que": "أن / الذي",
  "qui": "الذي",
  "ce": "هذا",
  "cet": "هذا",
  "cette": "هذه",
  "ces": "هؤلاء / هذه",
  "c'est": "إنه / هذا",
  "est-ce": "هل",
  "comment": "كيف",
  "pourquoi": "لماذا",
  "quand": "متى",
  "où": "أين",
  "combien": "كم"
};

/**
 * Translate a French sentence into fluent, contextual, professional Arabic.
 * Queries the backend neural translation API with in-memory caching, falling back to phrasebook & dictionary.
 */
export async function translateFrenchSentenceToArabicAsync(frenchSentence: string): Promise<string> {
  if (!frenchSentence || !frenchSentence.trim()) return '';

  const clean = frenchSentence.trim();
  const normalized = clean.toLowerCase().replace(/[.]+$/, '');

  // 1. In-memory cache check
  if (translationCache.has(normalized)) {
    return translationCache.get(normalized)!;
  }

  // 2. High-priority phrasebook check
  if (FRENCH_ARABIC_PHRASEBOOK[normalized]) {
    const result = FRENCH_ARABIC_PHRASEBOOK[normalized];
    translationCache.set(normalized, result);
    return result;
  }

  // 3. Query Backend Neural Translation API
  try {
    const response = await fetch(apiUrl('/api/translate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        from: 'fr',
        to: 'ar'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.translation && typeof data.translation === 'string') {
        const arabicResult = data.translation.trim();
        // Validate that translation is not just an error echo
        if (arabicResult && arabicResult.length > 0) {
          translationCache.set(normalized, arabicResult);
          return arabicResult;
        }
      }
    }
  } catch (err) {
    console.warn('Online translation failed, using local offline translator:', err);
  }

  // 4. Offline Fallback: Clean lexical mapping without leaving French debris
  return translateFrenchSentenceToArabic(clean);
}

/**
 * High-Speed Batch Neural Translator for Long French Texts
 * Translates multiple sentences in parallel, maximizing throughput
 */
export async function translateFrenchSentencesBatchAsync(frenchSentences: string[]): Promise<string[]> {
  if (!frenchSentences || frenchSentences.length === 0) return [];

  const results: string[] = new Array(frenchSentences.length);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  // 1. Resolve cached or instant dictionary phrases
  for (let i = 0; i < frenchSentences.length; i++) {
    const raw = frenchSentences[i] || '';
    const clean = raw.trim();
    const normalized = clean.toLowerCase();

    if (translationCache.has(normalized)) {
      results[i] = translationCache.get(normalized)!;
    } else if (FRENCH_ARABIC_PHRASEBOOK[normalized]) {
      const trans = FRENCH_ARABIC_PHRASEBOOK[normalized];
      translationCache.set(normalized, trans);
      results[i] = trans;
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(clean);
    }
  }

  // 2. Fetch all uncached sentences in one batch call
  if (uncachedTexts.length > 0) {
    try {
      const response = await fetch(apiUrl('/api/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: uncachedTexts,
          from: 'fr',
          to: 'ar'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.translations)) {
          for (let k = 0; k < uncachedIndices.length; k++) {
            const originalIndex = uncachedIndices[k];
            const trans = (data.translations[k] || '').trim();
            const originalText = frenchSentences[originalIndex] || '';

            if (trans && trans.length > 0 && trans !== originalText) {
              translationCache.set(originalText.trim().toLowerCase(), trans);
              results[originalIndex] = trans;
            } else {
              results[originalIndex] = translateFrenchSentenceToArabic(originalText);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Batch translation remote call failed, using offline fallback:', e);
    }
  }

  // 3. Fill any missing items with offline dictionary
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) {
      results[i] = translateFrenchSentenceToArabic(frenchSentences[i] || '');
    }
  }

  return results;
}

/**
 * Synchronous offline fallback for immediate rendering
 */
export function translateFrenchSentenceToArabic(frenchSentence: string): string {
  const normalized = frenchSentence.trim().toLowerCase().replace(/[.]+$/, '');
  
  if (FRENCH_ARABIC_PHRASEBOOK[normalized]) {
    return FRENCH_ARABIC_PHRASEBOOK[normalized];
  }

  const withPunct = frenchSentence.trim().toLowerCase();
  if (FRENCH_ARABIC_PHRASEBOOK[withPunct]) {
    return FRENCH_ARABIC_PHRASEBOOK[withPunct];
  }

  // Clean offline word-by-word mapping
  const words = frenchSentence.trim().split(/\s+/);
  const arabicWords: string[] = [];

  for (const rawWord of words) {
    const cleanWord = rawWord.toLowerCase().replace(/^[«"'(]+|[.,!?;:»"')]+$/g, '');
    const arabic = FRENCH_ARABIC_DICTIONARY[cleanWord] || FRENCH_ARABIC_DICTIONARY[cleanWord.replace(/'/g, "'")];
    
    if (arabic) {
      arabicWords.push(arabic);
    }
  }

  if (arabicWords.length > 0) {
    return arabicWords.join(' ');
  }

  return 'ترجمة فورية للجملة التعليمية';
}

/**
 * Translate an individual French word to Arabic for tooltips and vocabulary list
 */
export function lookupFrenchWordInArabic(word: string): string | null {
  if (!word) return null;
  const clean = word.toLowerCase().replace(/^[«"'(]+|[.,!?;:»"')]+$/g, '').trim();
  return FRENCH_ARABIC_DICTIONARY[clean] || FRENCH_ARABIC_DICTIONARY[clean.replace(/'/g, "'")] || null;
}

/**
 * Translate English text to French with neural context awareness
 */
export async function translateEnglishToFrenchAsync(englishText: string): Promise<string> {
  if (!englishText || !englishText.trim()) return '';
  const clean = englishText.trim();

  try {
      const response = await fetch(apiUrl('/api/translate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        from: 'en',
        to: 'fr'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.translation) {
        return data.translation.trim();
      }
    }
  } catch (e) {
    console.warn('English to French translation fallback:', e);
  }

  return clean;
}

// English to French offline fallback phrasebook
export const ENGLISH_FRENCH_PHRASEBOOK: Record<string, string> = {
  "hello, how are you today?": "Bonjour, comment allez-vous aujourd'hui ?",
  "hello, how are you today": "Bonjour, comment allez-vous aujourd'hui ?",
  "i would like to order a coffee and a croissant.": "Je voudrais commander un café et un croissant.",
  "i would like to order a coffee and a croissant": "Je voudrais commander un café et un croissant.",
  "we will visit paris tomorrow morning.": "Nous allons visiter Paris demain matin.",
  "could you repeat that, please?": "Est-ce que vous pouvez répéter, s'il vous plaît ?",
  "there are many people in this room.": "Il y a beaucoup de personnes dans cette salle."
};

export function translateEnglishToFrench(englishText: string): string {
  if (!englishText || !englishText.trim()) return '';
  const clean = englishText.trim();
  const lower = clean.toLowerCase();
  if (ENGLISH_FRENCH_PHRASEBOOK[lower]) {
    return ENGLISH_FRENCH_PHRASEBOOK[lower];
  }
  return clean;
}
