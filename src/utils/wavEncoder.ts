/**
 * High-performance client-side WAV Audio Encoder & Combiner with Studio Audio Mastering
 * Converts AudioBuffers or raw PCM float arrays into playable standard 16-bit PCM WAV Blobs.
 * Features:
 * - Studio-grade anti-click / anti-pop micro-fading
 * - Vocal presence & warmth equalization
 * - True-peak loudness normalization (-1.0 dBFS)
 * - Cubic resampling to 44.1 kHz broadcast standard
 * - Seamless inter-sentence comfort tone
 */

import {
  MasteringOptions,
  applyDeClickMicroFade,
  applyStudioVocalMastering,
  normalizeAndSoftLimitAudio,
  resampleCubic,
  fillComfortSilence
} from './audioMastering';

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const numSamples = buffer.length;
  const sampleRate = buffer.sampleRate;
  const dataByteLength = numSamples * numOfChan * 2;
  const fileByteLength = 44 + dataByteLength;

  // 1. Write standard 44-byte RIFF/WAVE header
  const headerBuffer = new ArrayBuffer(44);
  const header = new DataView(headerBuffer);

  header.setUint32(0, 0x52494646, false); // "RIFF" (Big Endian)
  header.setUint32(4, fileByteLength - 8, true); // ChunkSize
  header.setUint32(8, 0x57415645, false); // "WAVE" (Big Endian)

  header.setUint32(12, 0x666d7420, false); // "fmt " (Big Endian)
  header.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  header.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  header.setUint16(22, numOfChan, true); // NumChannels
  header.setUint32(24, sampleRate, true); // SampleRate
  header.setUint32(28, sampleRate * numOfChan * 2, true); // ByteRate
  header.setUint16(32, numOfChan * 2, true); // BlockAlign
  header.setUint16(34, 16, true); // BitsPerSample (16 bits)

  header.setUint32(36, 0x64617461, false); // "data" (Big Endian)
  header.setUint32(40, dataByteLength, true); // Subchunk2Size

  // 2. High-speed direct sample conversion
  const pcmSamples = new Int16Array(numSamples * numOfChan);

  if (numOfChan === 1) {
    const channel0 = buffer.getChannelData(0);
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, channel0[i]));
      pcmSamples[i] = s < 0 ? (s * 32768) | 0 : (s * 32767) | 0;
    }
  } else {
    const channels: Float32Array[] = [];
    for (let c = 0; c < numOfChan; c++) {
      channels.push(buffer.getChannelData(c));
    }
    let p = 0;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numOfChan; c++) {
        const s = Math.max(-1, Math.min(1, channels[c][i]));
        pcmSamples[p++] = s < 0 ? (s * 32768) | 0 : (s * 32767) | 0;
      }
    }
  }

  return new Blob([headerBuffer, pcmSamples.buffer], { type: 'audio/wav' });
}

/**
 * Merge multiple AudioBuffers sequentially with studio mastering, anti-click micro-fades,
 * volume normalization, and optional 44.1 kHz resampling.
 */
export function concatenateAudioBuffers(
  buffers: AudioBuffer[],
  silenceGapSeconds: number = 0.3,
  audioContext: AudioContext,
  masteringOptions: MasteringOptions = {
    enableStudioEQ: true,
    enableDeClicking: true,
    enableNormalization: true,
    vocalWarmth: true,
    vocalClarity: true,
    targetPeakDb: -1.0,
    targetSampleRate: 44100,
    interSentenceComfortTone: true
  }
): AudioBuffer {
  if (buffers.length === 0) {
    const sr = masteringOptions.targetSampleRate || audioContext.sampleRate || 44100;
    return audioContext.createBuffer(1, sr, sr);
  }

  const origSampleRate = buffers[0].sampleRate;
  const numChannels = buffers[0].numberOfChannels;
  const silenceSamples = Math.max(0, Math.floor(silenceGapSeconds * origSampleRate));

  // 1. Pre-process and master each individual sentence buffer
  const processedChannels: Float32Array[][] = [];
  let totalLength = 0;

  for (let b = 0; b < buffers.length; b++) {
    const buf = buffers[b];
    const chanArray: Float32Array[] = [];

    for (let c = 0; c < numChannels; c++) {
      // Copy channel data so we don't mutate original buffer
      const channelData = new Float32Array(buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)));

      // A. Anti-click micro-fade (eliminates pop sounds at start/end of sentences)
      if (masteringOptions.enableDeClicking !== false) {
        applyDeClickMicroFade(channelData, origSampleRate, 5);
      }

      // B. Studio Vocal EQ (warmth + clarity presence + rumble cut)
      if (masteringOptions.enableStudioEQ !== false) {
        applyStudioVocalMastering(channelData, origSampleRate, masteringOptions);
      }

      // C. True-Peak Normalization to -1.0 dBFS
      if (masteringOptions.enableNormalization !== false) {
        normalizeAndSoftLimitAudio(channelData, masteringOptions.targetPeakDb ?? -1.0);
      }

      chanArray.push(channelData);
    }

    processedChannels.push(chanArray);
    totalLength += buf.length;
    if (b < buffers.length - 1) {
      totalLength += silenceSamples;
    }
  }

  // 2. Concatenate into a unified intermediate buffer
  const unifiedChannels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    const combinedData = new Float32Array(totalLength);
    let currentOffset = 0;

    for (let b = 0; b < buffers.length; b++) {
      const sentenceData = processedChannels[b][c];
      combinedData.set(sentenceData, currentOffset);
      currentOffset += sentenceData.length;

      // Fill silence gap with smooth room tone (no dead zero-voltage silence)
      if (b < buffers.length - 1 && silenceSamples > 0) {
        if (masteringOptions.interSentenceComfortTone !== false) {
          const pauseSlice = new Float32Array(silenceSamples);
          fillComfortSilence(pauseSlice, origSampleRate);
          combinedData.set(pauseSlice, currentOffset);
        }
        currentOffset += silenceSamples;
      }
    }
    unifiedChannels.push(combinedData);
  }

  // 3. Resample to 44.1 kHz Studio standard if target sample rate differs
  const targetSampleRate = masteringOptions.targetSampleRate || 44100;
  if (targetSampleRate !== origSampleRate) {
    const resampledChannels = unifiedChannels.map(ch =>
      resampleCubic(ch, origSampleRate, targetSampleRate)
    );
    const finalLength = resampledChannels[0].length;
    const finalBuffer = audioContext.createBuffer(numChannels, finalLength, targetSampleRate);
    for (let c = 0; c < numChannels; c++) {
      finalBuffer.copyToChannel(resampledChannels[c], c);
    }
    return finalBuffer;
  }

  // Same sample rate: copy directly
  const finalBuffer = audioContext.createBuffer(numChannels, totalLength, origSampleRate);
  for (let c = 0; c < numChannels; c++) {
    finalBuffer.copyToChannel(unifiedChannels[c], c);
  }
  return finalBuffer;
}
