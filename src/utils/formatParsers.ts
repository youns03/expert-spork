import { AudioProject, SentenceItem, WordTiming } from '../types';

export function parseWhisperXOrGenericJson(jsonStr: string, projectTitle: string = 'مشروع مستورد'): {
  sentences: SentenceItem[];
  duration: number;
  detectedLang?: 'ar' | 'fr' | 'en' | 'other';
} | null {
  try {
    const data = JSON.parse(jsonStr);

    // 1. WhisperX format: { segments: [ { start, end, text, words: [ { word, start, end } ] } ], language?: 'ar'|'en'|'fr' }
    if (data.segments && Array.isArray(data.segments)) {
      let maxEnd = 0;
      const sentences: SentenceItem[] = data.segments.map((seg: any, sIdx: number) => {
        const sStart = typeof seg.start === 'number' ? seg.start : 0;
        const sEnd = typeof seg.end === 'number' ? seg.end : sStart + 3;
        if (sEnd > maxEnd) maxEnd = sEnd;

        const words: WordTiming[] = (seg.words && Array.isArray(seg.words))
          ? seg.words.map((w: any, wIdx: number) => ({
              id: `wx-s${sIdx}-w${wIdx}`,
              text: (w.word || w.text || '').trim(),
              start: typeof w.start === 'number' ? Math.round(w.start * 100) / 100 : sStart,
              end: typeof w.end === 'number' ? Math.round(w.end * 100) / 100 : sEnd
            })).filter((w: WordTiming) => w.text.length > 0)
          : seg.text.trim().split(/\s+/).map((wText: string, wIdx: number, arr: string[]) => {
              const dur = (sEnd - sStart) / arr.length;
              return {
                id: `wx-s${sIdx}-w${wIdx}`,
                text: wText,
                start: Math.round((sStart + wIdx * dur) * 100) / 100,
                end: Math.round((sStart + (wIdx + 1) * dur) * 100) / 100
              };
            });

        return {
          id: `seg-${sIdx + 1}`,
          text: seg.text?.trim() || words.map(w => w.text).join(' '),
          start: sStart,
          end: sEnd,
          words
        };
      });

      const lang = data.language === 'ar' ? 'ar' : data.language === 'fr' ? 'fr' : data.language === 'en' ? 'en' : 'ar';
      return {
        sentences,
        duration: Math.ceil(maxEnd),
        detectedLang: lang
      };
    }

    // 2. AudioSync format: { words: [ ["word", start, end], ... ] }
    if (data.words && Array.isArray(data.words)) {
      let maxEnd = 0;
      const allWords: WordTiming[] = [];

      data.words.forEach((item: any, idx: number) => {
        let text = '';
        let start = 0;
        let end = 0;

        if (Array.isArray(item)) {
          text = String(item[0] || '');
          start = Number(item[1]) || 0;
          end = Number(item[2]) || start + 0.5;
        } else if (typeof item === 'object') {
          text = item.text || item.word || '';
          start = Number(item.start) || 0;
          end = Number(item.end) || start + 0.5;
        }

        if (end > maxEnd) maxEnd = end;
        if (text) {
          allWords.push({
            id: `as-w-${idx + 1}`,
            text,
            start: Math.round(start * 100) / 100,
            end: Math.round(end * 100) / 100
          });
        }
      });

      // Group words into sentences of ~7-10 words or by punctuation
      const sentences: SentenceItem[] = [];
      let curWords: WordTiming[] = [];

      allWords.forEach((w, idx) => {
        curWords.push(w);
        const isPunctuation = /[.!?؟]$/.test(w.text);
        const isLongEnough = curWords.length >= 8;
        const isLast = idx === allWords.length - 1;

        if (isPunctuation || isLongEnough || isLast) {
          const sStart = curWords[0].start;
          const sEnd = curWords[curWords.length - 1].end;
          sentences.push({
            id: `as-s-${sentences.length + 1}`,
            text: curWords.map(cw => cw.text).join(' '),
            start: sStart,
            end: sEnd,
            words: [...curWords]
          });
          curWords = [];
        }
      });

      return {
        sentences,
        duration: Math.ceil(maxEnd),
        detectedLang: 'ar'
      };
    }

    // 3. Highlight Pro native project JSON format
    if (data.sentences && Array.isArray(data.sentences)) {
      return {
        sentences: data.sentences,
        duration: data.duration || 10,
        detectedLang: data.language || 'ar'
      };
    }

    return null;
  } catch (err) {
    console.error('Error parsing JSON timings:', err);
    return null;
  }
}

// Export functions
export function exportToProjectJson(project: AudioProject): string {
  return JSON.stringify(project, null, 2);
}

export function exportToWhisperXJson(project: AudioProject): string {
  const whisperXData = {
    language: project.language,
    duration: project.duration,
    segments: project.sentences.map(s => ({
      id: s.id,
      start: s.start,
      end: s.end,
      text: s.text,
      words: s.words.map(w => ({
        word: w.text,
        start: w.start,
        end: w.end
      }))
    }))
  };
  return JSON.stringify(whisperXData, null, 2);
}

export function exportToSmilXml(project: AudioProject): string {
  const audioSrc = project.audioFileName || 'audio.mp3';
  
  let smil = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  smil += `<smil xmlns="http://www.w3.org/ns/SMIL" xmlns:epub="http://www.idpf.org/2007/ops" version="3.0">\n`;
  smil += `  <body>\n`;
  smil += `    <seq id="seq1" epub:textref="chapter.xhtml">\n`;

  project.sentences.forEach(s => {
    smil += `      <par id="par-${s.id}">\n`;
    smil += `        <text src="chapter.xhtml#${s.id}"/>\n`;
    smil += `        <audio src="${audioSrc}" clipBegin="${s.start}s" clipEnd="${s.end}s"/>\n`;
    smil += `      </par>\n`;
  });

  smil += `    </seq>\n`;
  smil += `  </body>\n`;
  smil += `</smil>`;
  return smil;
}

export function exportToWebVtt(project: AudioProject): string {
  const formatVttTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  let vtt = `WEBVTT - ${project.title}\n\n`;
  project.sentences.forEach((s, idx) => {
    vtt += `${idx + 1}\n`;
    vtt += `${formatVttTime(s.start)} --> ${formatVttTime(s.end)}\n`;
    
    // Add word timestamps markup <00:00:01.200><c>word</c>
    const wordCue = s.words.map(w => `<${formatVttTime(w.start)}>${w.text}`).join(' ');
    vtt += `${wordCue}\n\n`;
  });

  return vtt;
}

export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
