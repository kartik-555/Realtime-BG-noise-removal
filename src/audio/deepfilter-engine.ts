/**
 * DeepFilterNet3 Engine (State-of-the-Art Deep Perceptual Filtering)
 * Uses deepfilternet3-noise-filter AudioWorklet wrapper + ONNX/WASM runtime.
 */
import { DeepFilterNet3Core } from 'deepfilternet3-noise-filter';
import { computeAudioMetrics } from './metrics';
import type { ModelBenchmarkResult, ModelMetadata } from './types';

export const DEEPFILTERNET3_META: ModelMetadata = {
  id: 'deepfilter3',
  name: 'DeepFilterNet3 (Perceptual Deep Filter)',
  shortName: 'DeepFilterNet3',
  badge: 'Highest Audio Quality (SOTA)',
  category: 'deepfilter',
  description: 'Full-band (48 kHz) deep filtering neural network combining ERB filterbanks with complex spectrogram filtering. Delivers superior speech quality without robotic phase artifacts.',
  frameSizeSamples: 480,
  sampleRate: 48000,
  quantumBudgetMs: 2.67,
  packageWeight: '~24 MB (16MB WASM + 8MB Model)',
  license: 'LGPL-3.0 / MIT (Check dual-licensing before commercial ship)',
  mobileSuitability: 'Mid to High-End Phones',
  strengths: [
    'Industry-leading PESQ / STOI speech enhancement metrics',
    'Full 48 kHz high-definition studio clarity without low-pass dullness',
    'Suppresses complex non-stationary noises (crying, traffic, barking, cafe)',
    'Official LiveKit & WebRTC production AudioWorklet integration'
  ],
  caveats: [
    'Substantial compute footprint (~1.8ms - 2.8ms per quantum)',
    'Slow on low-end Android phones (< 2.67ms budget risk)',
    'Firefox reports ~3x slower execution compared to V8/Chromium',
    'Large asset download (~24 MB initial load)'
  ]
};

let deepFilterProcessor: DeepFilterNet3Core | null = null;
let initPromise: Promise<DeepFilterNet3Core> | null = null;

export async function getDeepFilterProcessor(): Promise<DeepFilterNet3Core> {
  if (deepFilterProcessor && deepFilterProcessor.isReady()) {
    return deepFilterProcessor;
  }

  if (!initPromise) {
    initPromise = (async () => {
      // Try local assets first, fallback to CDN if needed
      let processor = new DeepFilterNet3Core({
        sampleRate: 48000,
        noiseReductionLevel: 50,
        assetConfig: {
          cdnUrl: '/models/deepfilternet3'
        }
      });

      try {
        await processor.initialize();
      } catch (err) {
        console.warn('Local DeepFilterNet3 assets failed, falling back to official CDN:', err);
        processor = new DeepFilterNet3Core({
          sampleRate: 48000,
          noiseReductionLevel: 50,
          assetConfig: {
            cdnUrl: 'https://cdn.mezon.ai/AI/models/datas/noise_suppression/deepfilternet3'
          }
        });
        await processor.initialize();
      }

      deepFilterProcessor = processor;
      return processor;
    })();
  }

  return initPromise;
}

/**
 * Process an entire AudioBuffer through DeepFilterNet3 using OfflineAudioContext + AudioWorklet
 */
export async function processAudioWithDeepFilterNet(
  audioBuffer: AudioBuffer,
  ctx: BaseAudioContext,
  suppressionLevel = 60
): Promise<ModelBenchmarkResult> {
  const startTime = performance.now();

  try {
    const processor = await getDeepFilterProcessor();
    processor.setSuppressionLevel(suppressionLevel);

    const offlineCtx = new OfflineAudioContext(
      1,
      audioBuffer.length + 4800, // add 100ms padding for ring buffer flush
      48000
    );

    const workletNode = await processor.createAudioWorkletNode(offlineCtx as unknown as AudioContext);

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    source.connect(workletNode);
    workletNode.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    // Slice out the exact buffer length (trimming tail padding)
    const finalBuffer = ctx.createBuffer(1, audioBuffer.length, 48000);
    finalBuffer.copyToChannel(rendered.getChannelData(0).subarray(0, audioBuffer.length) as Float32Array<ArrayBuffer>, 0);

    const metrics = computeAudioMetrics(audioBuffer, finalBuffer, processingTimeMs, DEEPFILTERNET3_META.quantumBudgetMs);

    return {
      modelId: DEEPFILTERNET3_META.id,
      modelMeta: DEEPFILTERNET3_META,
      status: 'done',
      audioBuffer: finalBuffer,
      metrics,
    };
  } catch (error) {
    console.error('DeepFilterNet3 processing error:', error);
    const endTime = performance.now();
    return {
      modelId: DEEPFILTERNET3_META.id,
      modelMeta: DEEPFILTERNET3_META,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'DeepFilterNet3 initialization failed',
      metrics: {
        durationSec: audioBuffer.duration,
        processingTimeMs: endTime - startTime,
        realTimeFactor: 1.0,
        avgFrameLatencyMs: 2.8,
        cpuBudgetPercentage: 105,
        noiseFloorReductionDb: 0,
        estimatedSNRImprovementDb: 0,
        rmsLevelDb: -20,
        peakLevelDb: -3,
        speechPreservationScore: 0,
      }
    };
  }
}

/**
 * Create a live AudioWorkletNode for DeepFilterNet3 attached to an active AudioContext
 */
export async function createDeepFilterLiveNode(
  audioContext: AudioContext,
  suppressionLevel = 50
): Promise<AudioWorkletNode> {
  const processor = await getDeepFilterProcessor();
  processor.setSuppressionLevel(suppressionLevel);
  return processor.createAudioWorkletNode(audioContext);
}
