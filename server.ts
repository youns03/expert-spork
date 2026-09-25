import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Lazy init Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Convert raw 16-bit 24kHz PCM buffer to standard RIFF/WAV format
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// In-memory High-speed Cache for TTS & Translations
const ttsAudioCache = new Map<string, { audioBase64: string; subtitles: any[]; voice: string }>();
const translationCacheMap = new Map<string, string>();

interface TTSRequestParams {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

// Helper: Preprocess French text for natural speech pronunciation and cadence
function preprocessFrenchTextForSpeech(text: string): string {
  let t = text.trim();
  // Normalize quotes and dashes for natural French breathing and intonation
  t = t.replace(/[«»]/g, ', ');
  t = t.replace(/[’`]/g, "'");
  t = t.replace(/–|—/g, ' - ');
  
  // Expand common French abbreviations so neural synthesis pronounces them correctly
  t = t.replace(/\bM\.\s+/g, 'Monsieur ');
  t = t.replace(/\bMme\s+/g, 'Madame ');
  t = t.replace(/\bMlles?\s+/g, 'Mademoiselle ');
  t = t.replace(/\bDr\.\s+/g, 'Docteur ');
  t = t.replace(/\bProf\.\s+/g, 'Professeur ');
  t = t.replace(/\bn°\s*/gi, 'numéro ');
  t = t.replace(/\bc\.-à-d\.\b/gi, "c'est-à-dire");
  t = t.replace(/\betc\.\b/gi, 'et cetera');

  // Ensure terminal punctuation exists for natural falling/rising sentence intonation
  if (!/[.!?…]$/.test(t)) {
    t += '.';
  }

  return t;
}

// Internal High-Speed French Neural Synthesis function
async function synthesizeSpeechInternal(params: TTSRequestParams): Promise<{
  audioBase64: string;
  subtitles: any[];
  voice: string;
}> {
  const { text, voice = 'fr-FR-RemyMultilingualNeural', rate = 1.0, pitch = 0 } = params;
  const rawText = text.trim();
  if (!rawText) {
    throw new Error('النص فارغ');
  }

  const cleanText = preprocessFrenchTextForSpeech(rawText);

  // Studio-grade Neural Voice Mapping
  let selectedVoice = 'fr-FR-RemyMultilingualNeural';
  if (voice.includes('Vivienne') || voice.includes('vivienne')) {
    selectedVoice = 'fr-FR-VivienneMultilingualNeural';
  } else if (voice.includes('Denise') || voice.includes('denise')) {
    selectedVoice = 'fr-FR-DeniseNeural';
  } else if (voice.includes('Henri') || voice.includes('henri')) {
    selectedVoice = 'fr-FR-HenriNeural';
  } else if (voice.includes('Gerard') || voice.includes('gerard')) {
    selectedVoice = 'fr-BE-GerardNeural';
  } else if (voice.includes('Antoine') || voice.includes('antoine') || voice.includes('Jean') || voice.includes('jean')) {
    selectedVoice = 'fr-CA-AntoineNeural';
  } else if (voice.includes('Fabrice') || voice.includes('fabrice') || voice.includes('claude')) {
    selectedVoice = 'fr-CH-FabriceNeural';
  } else if (voice.startsWith('fr-')) {
    selectedVoice = voice;
  }

  const ratePercent = Math.round((Number(rate || 1.0) - 1.0) * 100);
  const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
  const pitchStr = pitch ? (pitch > 0 ? `+${pitch}Hz` : `${pitch}Hz`) : '+0Hz';

  // Cache key
  const cacheKey = `${selectedVoice}_${rateStr}_${pitchStr}_${cleanText}`;
  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey)!;
  }

  // 1. Primary Engine: Edge Neural French Voice with word boundaries
  try {
    const { EdgeTTS } = await import('edge-tts-universal');
    const tts = new EdgeTTS(cleanText, selectedVoice, {
      rate: rateStr,
      pitch: pitchStr
    });

    const result = await tts.synthesize();
    const arrayBuf = await result.audio.arrayBuffer();
    const mp3Buffer = Buffer.from(arrayBuf);

    if (mp3Buffer && mp3Buffer.length > 0) {
      const output = {
        audioBase64: `data:audio/mp3;base64,${mp3Buffer.toString('base64')}`,
        subtitles: result.subtitle || [],
        voice: selectedVoice
      };
      ttsAudioCache.set(cacheKey, output);
      return output;
    }
  } catch (edgeErr) {
    console.warn('EdgeTTS synthesis error, attempting secondary fallback:', edgeErr);
  }

  // 2. Secondary Engine: Node Edge TTS
  try {
    const nodeEdgePkg = await import('node-edge-tts');
    const NodeEdgeTTS = (nodeEdgePkg as any).EdgeTTS || (nodeEdgePkg as any).default;
    if (NodeEdgeTTS) {
      const nodeTts = new NodeEdgeTTS({
        voice: selectedVoice,
        rate: rateStr,
        pitch: pitchStr
      });
      const mp3Buffer = typeof nodeTts.getAudio === 'function' 
        ? await nodeTts.getAudio(cleanText)
        : typeof nodeTts.ttsPromise === 'function' 
          ? await nodeTts.ttsPromise(cleanText)
          : null;

      if (mp3Buffer && mp3Buffer.length > 0) {
        const output = {
          audioBase64: `data:audio/mp3;base64,${mp3Buffer.toString('base64')}`,
          subtitles: [],
          voice: selectedVoice
        };
        ttsAudioCache.set(cacheKey, output);
        return output;
      }
    }
  } catch (nodeEdgeErr) {
    console.warn('NodeEdgeTTS fallback failed:', nodeEdgeErr);
  }

  // 3. Tertiary Fallback: Google French TTS
  const https = await import('https');
  const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(cleanText.slice(0, 190))}`;

  const mp3Buffer = await new Promise<Buffer>((resolve, reject) => {
    https.get(googleTTSUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (gRes) => {
      const chunks: Buffer[] = [];
      gRes.on('data', c => chunks.push(c));
      gRes.on('end', () => resolve(Buffer.concat(chunks)));
      gRes.on('error', reject);
    }).on('error', reject);
  });

  if (mp3Buffer && mp3Buffer.length > 0) {
    const output = {
      audioBase64: `data:audio/mp3;base64,${mp3Buffer.toString('base64')}`,
      subtitles: [],
      voice: 'google-french'
    };
    ttsAudioCache.set(cacheKey, output);
    return output;
  }

  throw new Error('تعذر توليد الصوت للجملة');
}

// Endpoint: Single Sentence Natural French Neural TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice, rate, pitch } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'النص المطلوب قراءته فارغ' });
    }
    const result = await synthesizeSpeechInternal({ text, voice, rate, pitch });
    return res.json({
      success: true,
      audioBase64: result.audioBase64,
      subtitles: result.subtitles,
      voice: result.voice,
      format: 'mp3'
    });
  } catch (error: any) {
    console.error('Error generating French TTS:', error);
    return res.status(500).json({ error: error?.message || 'تعذر توليد الصوت' });
  }
});

// Endpoint: High-Speed Parallel Batch French Neural TTS (Turbo Multi-threading)
app.post('/api/tts/batch', async (req, res) => {
  try {
    const { items, voice = 'fr-FR-RemyMultilingualNeural', rate = 1.0, pitch = 0, concurrency = 8 } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'قائمة الجمل فارغة' });
    }

    const results: any[] = new Array(items.length);
    let index = 0;

    // Worker pool for maximum concurrent throughput
    const workerCount = Math.min(Number(concurrency) || 8, items.length, 12);
    const workers = Array.from({ length: workerCount }, async () => {
      while (index < items.length) {
        const i = index++;
        const item = items[i];
        const sentenceText = typeof item === 'string' ? item : item.text;
        const sVoice = (typeof item === 'object' && item.voice) || voice;
        const sRate = (typeof item === 'object' && item.rate) || rate;
        const sPitch = (typeof item === 'object' && item.pitch) || pitch;

        try {
          const synthesis = await synthesizeSpeechInternal({
            text: sentenceText,
            voice: sVoice,
            rate: sRate,
            pitch: sPitch
          });
          results[i] = {
            index: i,
            text: sentenceText,
            success: true,
            audioBase64: synthesis.audioBase64,
            subtitles: synthesis.subtitles,
            voice: synthesis.voice
          };
        } catch (err: any) {
          console.warn(`Batch TTS item ${i} failed:`, err);
          results[i] = {
            index: i,
            text: sentenceText,
            success: false,
            error: err.message
          };
        }
      }
    });

    await Promise.all(workers);

    return res.json({
      success: true,
      total: items.length,
      results
    });
  } catch (error: any) {
    console.error('Error in batch French TTS:', error);
    return res.status(500).json({ error: error?.message || 'خطأ أثناء التوليد الصوتي المجمّع' });
  }
});

// Helper: Decode HTML entities from translation APIs
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/\s+/g, ' ')
    .trim();
}

// Endpoint: Context-Aware Professional Neural Translation (French <-> Arabic & English <-> French)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, texts, from = 'fr', to = 'ar' } = req.body;

    const translateSingleText = async (inputText: string): Promise<string> => {
      if (!inputText || !inputText.trim()) return '';
      const cleanInput = inputText.trim();
      const cacheKey = `${from}_${to}_${cleanInput.toLowerCase()}`;
      if (translationCacheMap.has(cacheKey)) {
        return translationCacheMap.get(cacheKey)!;
      }

      // 1. Primary Engine: MyMemory Neural Context API
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanInput)}&langpair=${from}|${to}`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(3500)
        });
        if (resp.ok) {
          const data: any = await resp.json();
          if (data?.responseData?.translatedText) {
            let candidate = decodeHtmlEntities(data.responseData.translatedText);
            if (candidate && !candidate.toUpperCase().includes('MYMEMORY WARNING') && candidate.length > 0) {
              translationCacheMap.set(cacheKey, candidate);
              return candidate;
            }
          }
        }
      } catch (err) {
        // Fallback to secondary
      }

      // 2. Secondary Engine: Lingva instance fallback
      try {
        const lingvaUrl = `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(cleanInput)}`;
        const lResp = await fetch(lingvaUrl, { signal: AbortSignal.timeout(3000) });
        if (lResp.ok) {
          const lData: any = await lResp.json();
          if (lData?.translation) {
            const resText = decodeHtmlEntities(lData.translation);
            translationCacheMap.set(cacheKey, resText);
            return resText;
          }
        }
      } catch (lErr) {
        // Fallback
      }

      return cleanInput;
    };

    if (Array.isArray(texts) && texts.length > 0) {
      // Parallel execution for texts with worker pool
      const results: string[] = new Array(texts.length);
      let idx = 0;
      const workerCount = Math.min(8, texts.length);
      const workers = Array.from({ length: workerCount }, async () => {
        while (idx < texts.length) {
          const i = idx++;
          results[i] = await translateSingleText(texts[i]);
        }
      });
      await Promise.all(workers);
      return res.json({ success: true, translations: results });
    }

    const singleResult = await translateSingleText(text || '');
    return res.json({ success: true, translation: singleResult });
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: error?.message || 'خطأ أثناء الترجمة' });
  }
});

// Endpoint: AI Audio Transcription with Word Timestamps (Aligning speech to text like a book/podcast)
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType, duration, languageHint } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'لم يتم إرسال الملف الصوتي' });
    }

    const ai = getGenAI();
    const cleanMimeType = mimeType || 'audio/mp3';
    // Remove base64 header if present
    const rawBase64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');

    const prompt = `
You are an expert audio transcriber and forced alignment engine.
Your task is to transcribe this single-speaker podcast/audio file completely into text, structured as high-precision sentences and word-by-word timestamps for interactive karaoke/media-overlay book reading.

Total Audio Duration is approximately: ${duration || 'unknown'} seconds.
Language hint: ${languageHint || 'Arabic/auto'}.

Instructions:
1. Transcribe EVERY spoken word accurately in the original language (Arabic, English, French, etc.). Do NOT omit or summarize anything.
2. Group the text into natural sentences or paragraphs (5 to 12 words per sentence item).
3. Provide realistic start and end timestamps in seconds (float with 2 decimal places) for EACH sentence and EACH word within the sentence.
4. Ensure monotonic ascending timestamps where each word's start time and end time fit within the sentence duration and correspond to when the speaker is speaking.
5. Return ONLY a valid JSON object matching the following structure:

{
  "title": "A short descriptive title extracted from the speech topic",
  "language": "ar", // or "en", "fr"
  "direction": "rtl", // "rtl" for Arabic, "ltr" for others
  "duration": 30.5, // total duration in seconds
  "sentences": [
    {
      "id": "s-1",
      "text": "مرحبا بكم في هذه الحلقة من البودكاست",
      "start": 0.50,
      "end": 3.80,
      "words": [
        { "id": "s-1-w-1", "text": "مرحبا", "start": 0.50, "end": 1.10 },
        { "id": "s-1-w-2", "text": "بكم", "start": 1.15, "end": 1.60 },
        { "id": "s-1-w-3", "text": "في", "start": 1.65, "end": 1.90 },
        { "id": "s-1-w-4", "text": "هذه", "start": 1.95, "end": 2.30 },
        { "id": "s-1-w-5", "text": "الحلقة", "start": 2.35, "end": 2.90 },
        { "id": "s-1-w-6", "text": "من", "start": 2.95, "end": 3.15 },
        { "id": "s-1-w-7", "text": "البودكاست", "start": 3.20, "end": 3.80 }
      ]
    }
  ]
}

Ensure all JSON brackets and quotes are strictly valid. Return raw JSON only with no markdown wrapping.
`;

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: rawBase64
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [audioPart, { text: prompt }]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch (parseError) {
      // Clean possible markdown code fence
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error transcribing audio with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء استخراج النص من الصوت بالذكاء الاصطناعي'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
