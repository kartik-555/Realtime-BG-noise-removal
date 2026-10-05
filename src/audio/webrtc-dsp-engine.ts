/**
 * Browser Native WebRTC Audio Processing Module (AEC / NS / AGC)
 * Represents Chrome / Firefox / Safari's native built-in WebRTC noise cancellation.
 */
import { computeAudioMetrics } from './metrics';
import type { ModelBenchmarkResult, ModelMetadata } from './types';

export const WEBRTC_NATIVE_META: ModelMetadata = {
  id: 'webrtc_native',
  name: 'Browser Native WebRTC Suppressor',
  shortName: 'Browser WebRTC',
  badge: 'Zero-Download Built-in',
  category: 'native',
  description: 'Browser native Audio Processing Module (WebRTC APM). Built directly into Chrome, Safari, Edge, and Firefox. Leverages hardware DSP acceleration and OS audio processing.',
  frameSizeSamples: 128,
  sampleRate: 48000,
  quantumBudgetMs: 2.67,
  packageWeight: '0 KB (Built-in)',
  license: 'W3C / WebRTC Open Standard',
  mobileSuitability: 'Recommended (All Phones)',
  strengths: [
    'Zero bundle download footprint (0 KB)',
    'Lowest CPU overhead on smartphones due to hardware-assisted DSP',
    'Integrated Acoustic Echo Cancellation (AEC) and Auto Gain Control (AGC)',
    'Zero integration setup in WebRTC peer connections'
  ],
  caveats: [
    'Inconsistent behavior across different browser engines (Chromium vs WebKit vs Gecko)',
    'Aggressive suppression can clip soft consonants ("th", "s", "f") and quiet voices',
    'Cannot handle complex sudden noises (mechanical keyboard clatter, barking)'
  ]
};

/**
 * Process audio with WebRTC APM emulation (OfflineAudioContext: Highpass 85Hz + Multi-band dynamics + Adaptive spectral subtractor)
 */
export async function processAudioWithNativeWebRTC(
  audioBuffer: AudioBuffer,
  ctx: BaseAudioContext
): Promise<ModelBenchmarkResult> {
  const startTime = performance.now();

  const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, 48000);

  // 1. Highpass filter at 85Hz (cuts low rumbling AC fan and mechanical desk vibrations)
  const highpass = offlineCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 85;
  highpass.Q.value = 0.707;

  // 2. High-shelf gentle dampening above 7000Hz (cuts high-frequency keyboard click sharpness)
  const highshelf = offlineCtx.createBiquadFilter();
  highshelf.type = 'highshelf';
  highshelf.frequency.value = 7500;
  highshelf.gain.value = -4.0;

  // 3. WebRTC Dynamic Range Compressor (acts as AGC + noise floor squash)
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -32;
  compressor.knee.value = 12;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  source.connect(highpass);
  highpass.connect(highshelf);
  highshelf.connect(compressor);
  compressor.connect(offlineCtx.destination);

  source.start(0);

  const filtered = await offlineCtx.startRendering();

  // 4. Adaptive spectral attenuation on non-speech frames
  const origData = audioBuffer.getChannelData(0);
  const filtData = filtered.getChannelData(0);
  const outData = new Float32Array(origData.length);

  const frameSize = 240; // 5ms
  const numFrames = Math.floor(origData.length / frameSize);

  // Measure baseline noise floor
  let minEnergy = 1.0;
  for (let f = 0; f < numFrames; f++) {
    let energy = 0;
    const start = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      const s = filtData[start + i];
      energy += s * s;
    }
    energy /= frameSize;
    if (energy < minEnergy) minEnergy = energy;
  }
  const noiseThreshold = Math.max(0.0001, minEnergy * 4.0);

  for (let f = 0; f < numFrames; f++) {
    const start = f * frameSize;
    let energy = 0;
    for (let i = 0; i < frameSize; i++) {
      const s = filtData[start + i];
      energy += s * s;
    }
    energy /= frameSize;

    // Spectral subtraction attenuation curve
    const gain = energy > noiseThreshold 
      ? 1.0 
      : Math.max(0.08, Math.pow(energy / noiseThreshold, 1.2));

    for (let i = 0; i < frameSize; i++) {
      outData[start + i] = filtData[start + i] * gain;
    }
  }

  const finalBuffer = ctx.createBuffer(1, audioBuffer.length, 48000);
  finalBuffer.copyToChannel(outData, 0);

  const endTime = performance.now();
  const processingTimeMs = endTime - startTime;
  const metrics = computeAudioMetrics(audioBuffer, finalBuffer, processingTimeMs, WEBRTC_NATIVE_META.quantumBudgetMs);

  return {
    modelId: WEBRTC_NATIVE_META.id,
    modelMeta: WEBRTC_NATIVE_META,
    status: 'done',
    audioBuffer: finalBuffer,
    metrics,
  };
}
