/**
 * Multi-Stage Chained Pipeline Flow Engine
 * Allows chaining Pre-conditioners, Primary AI Neural Models, and Post-Filters.
 */
import type { ModelBenchmarkResult, ModelMetadata, PipelineFlowConfig } from './types';
import { processAudioWithRNNoise } from './rnnoise-engine';
import { processAudioWithDeepFilterNet } from './deepfilter-engine';
import { processAudioWithDTLN } from './dtln-engine';
import { processAudioWithGTCRN } from './gtcrn-engine';
import { processAudioWithSpeex } from './speex-engine';
import { applyNoiseGateToFloat32 } from './noise-gate-engine';
import { computeAudioMetrics } from './metrics';
import { processAudioWithSpeechEnhancer, SPEECH_ENHANCER_PRESETS } from './speech-enhancer-engine';

export const PIPELINE_COMBO_META: ModelMetadata = {
  id: 'pipeline_combo',
  name: 'Custom Pipeline Flow (Chained Stages)',
  shortName: 'Chained Pipeline',
  badge: 'Multi-Stage Synergy',
  category: 'combo',
  description: 'Custom chained processing pipeline combining hardware/browser pre-conditioning, primary neural suppression, and post-filtering noise gate.',
  frameSizeSamples: 480,
  sampleRate: 48000,
  quantumBudgetMs: 2.67,
  packageWeight: 'Varies',
  license: 'Multi-licensed',
  mobileSuitability: 'Recommended (All Phones)',
  strengths: [
    'Synergistic noise reduction: eliminates residual AI artifacts',
    'Pre-filtering rumbling low-frequencies leaves full neural capacity for speech',
    'Complete silence in conversational pauses via post-gate'
  ],
  caveats: [
    'Cumulative latency across all chained stages'
  ]
};

export async function processAudioWithPipeline(
  audioBuffer: AudioBuffer,
  ctx: BaseAudioContext,
  config: PipelineFlowConfig
): Promise<ModelBenchmarkResult> {
  const startTime = performance.now();
  let currentBuffer = audioBuffer;

  // 1. Stage 1: Pre-Conditioner
  if (config.preFilter === 'highpass_80hz' || config.preFilter === 'browser_native_aec_ns') {
    const offlineCtx = new OfflineAudioContext(1, currentBuffer.length, 48000);
    const source = offlineCtx.createBufferSource();
    source.buffer = currentBuffer;

    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = config.preFilter === 'highpass_80hz' ? 85 : 100;
    hp.Q.value = 0.707;

    source.connect(hp);

    if (config.preFilter === 'browser_native_aec_ns') {
      const comp = offlineCtx.createDynamicsCompressor();
      comp.threshold.value = -30;
      comp.ratio.value = 4;
      hp.connect(comp);
      comp.connect(offlineCtx.destination);
    } else {
      hp.connect(offlineCtx.destination);
    }

    source.start(0);
    currentBuffer = await offlineCtx.startRendering();
  }

  // 2. Stage 2: Primary AI Neural Model
  let primaryResult: ModelBenchmarkResult;
  switch (config.primaryModel) {
    case 'deepfilter':
      primaryResult = await processAudioWithDeepFilterNet(currentBuffer, ctx, config.attenuationLevel);
      break;
    case 'dtln':
      primaryResult = await processAudioWithDTLN(currentBuffer, ctx);
      break;
    case 'gtcrn':
      primaryResult = await processAudioWithGTCRN(currentBuffer, ctx);
      break;
    case 'speex':
      primaryResult = await processAudioWithSpeex(currentBuffer, ctx);
      break;
    case 'rnnoise':
    default:
      primaryResult = await processAudioWithRNNoise(currentBuffer, ctx);
      break;
  }

  if (primaryResult.audioBuffer) {
    currentBuffer = primaryResult.audioBuffer;
  }

  // 3. Stage 3: Candidate Speech Enhancement (Intelligibility EQ + AGC Leveler + De-Esser)
  if (config.speechEnhance && config.speechEnhance !== 'none') {
    const presetKey = config.speechEnhance;
    const enhanceConfig = SPEECH_ENHANCER_PRESETS[presetKey] || SPEECH_ENHANCER_PRESETS.studio_crisp;
    const enhancedResult = await processAudioWithSpeechEnhancer(currentBuffer, ctx, enhanceConfig);
    if (enhancedResult.audioBuffer) {
      currentBuffer = enhancedResult.audioBuffer;
    }
  }

  // 4. Stage 4: Post-Filter
  if (config.postFilter === 'noise_gate') {
    const inputData = currentBuffer.getChannelData(0);
    const gatedData = applyNoiseGateToFloat32(
      inputData,
      config.gateThresholdDb,
      90,
      120,
      currentBuffer.sampleRate
    );
    const finalGated = ctx.createBuffer(1, gatedData.length, currentBuffer.sampleRate);
    finalGated.copyToChannel(gatedData as unknown as Float32Array<ArrayBuffer>, 0);
    currentBuffer = finalGated;
  } else if (config.postFilter === 'speex_dsp') {
    const speexRes = await processAudioWithSpeex(currentBuffer, ctx);
    if (speexRes.audioBuffer) currentBuffer = speexRes.audioBuffer;
  }

  const endTime = performance.now();
  const processingTimeMs = endTime - startTime;
  const metrics = computeAudioMetrics(audioBuffer, currentBuffer, processingTimeMs, PIPELINE_COMBO_META.quantumBudgetMs);

  const enhanceLabel = config.speechEnhance !== 'none' ? ` ➔ [ENHANCE: ${config.speechEnhance.toUpperCase()}]` : '';

  return {
    modelId: PIPELINE_COMBO_META.id,
    modelMeta: {
      ...PIPELINE_COMBO_META,
      name: `Pipeline: [${config.preFilter}] ➔ [${config.primaryModel.toUpperCase()}]${enhanceLabel} ➔ [${config.postFilter}]`,
      shortName: `Pipeline Combo (${config.primaryModel.toUpperCase()}${config.speechEnhance !== 'none' ? ' + Voice+' : ''})`,
    },
    status: 'done',
    audioBuffer: currentBuffer,
    metrics,
  };
}

