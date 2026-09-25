import { describe, it, expect } from 'vitest';
import { 
  translateFrenchSentenceToArabic, 
  lookupFrenchWordInArabic, 
  translateEnglishToFrench 
} from '../frenchTranslator';

describe('French & Arabic Offline Translation Engine', () => {
  it('1. Accurately translates the 5 required French sentences to Arabic', () => {
    expect(translateFrenchSentenceToArabic("Bonjour, comment allez-vous aujourd'hui ?"))
      .toBe("مرحباً، كيف حالكم اليوم؟");

    expect(translateFrenchSentenceToArabic("Je voudrais commander un café et un croissant."))
      .toBe("أود أن أطلب قهوة وكرواسون.");

    expect(translateFrenchSentenceToArabic("Nous allons visiter Paris demain matin."))
      .toBe("سنقوم بزيارة باريس صباح الغد.");

    expect(translateFrenchSentenceToArabic("Est-ce que vous pouvez répéter, s'il vous plaît ?"))
      .toBe("هل يمكنكم الإعادة، من فضلكم؟");

    expect(translateFrenchSentenceToArabic("Il y a beaucoup de personnes dans cette salle."))
      .toBe("هناك الكثير من الأشخاص في هذه القاعة.");
  });

  it('2. Looks up individual French vocabulary words in Arabic', () => {
    expect(lookupFrenchWordInArabic("croissant")).toBe("كرواسون");
    expect(lookupFrenchWordInArabic("café")).toBe("قهوة / مقهى");
    expect(lookupFrenchWordInArabic("bonjour")).toBe("مرحباً");
    expect(lookupFrenchWordInArabic("demain")).toBe("غداً");
    expect(lookupFrenchWordInArabic("visiter")).toBe("يزور");
  });

  it('3. Converts English text to French when requested', () => {
    expect(translateEnglishToFrench("Hello, how are you today?"))
      .toBe("Bonjour, comment allez-vous aujourd'hui ?");

    expect(translateEnglishToFrench("I would like to order a coffee and a croissant."))
      .toBe("Je voudrais commander un café et un croissant.");
  });
});