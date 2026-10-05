export type ModelCategory = 'neural_rnn' | 'deepfilter' | 'dtln' | 'dsp' | 'native' | 'combo';

export interface ModelMetadata {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  category: ModelCategory;
  description: string;
  frameSizeSamples: number;
  sampleRate: number; // 48000 or 16000
  quantumBudgetMs: number; // e.g. 2.67ms for 128 samples @ 48kHz, or 32ms for DTLN
  packageWeight: string; // e.g. '~152 KB'
  license: string;
  mobileSuitability: 'Recommended (All Phones)' | 'Mid to High-End Phones' | 'Desktop / High-End';
  strengths: string[];
  caveats: string[];
}

export interface ProcessingMetrics {
  durationSec: number;
  processingTimeMs: number;
  realTimeFactor: number; // RTF = processingTimeMs / (durationSec * 1000)
  avgFrameLatencyMs: number;
  cpuBudgetPercentage: number;
  noiseFloorReductionDb: number;
  estimatedSNRImprovementDb: number;
  rmsLevelDb: number;
  peakLevelDb: number;
  speechPreservationScore: number; // 0-100%
}

export interface ModelBenchmarkResult {
  modelId: string;
  modelMeta: ModelMetadata;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  metrics?: ProcessingMetrics;
  audioBuffer?: AudioBuffer;
  wavBlob?: Blob;
  wavUrl?: string;
  spectrogramData?: Float32Array[];
}

export type SpeechEnhancerPreset = 'studio_crisp' | 'laptop_mic_fix' | 'quiet_candidate' | 'echoey_room' | 'asr_stt_optimizer';

export interface SpeechEnhancementConfig {
  clarityBoostDb: number; // 0 to +9 dB (intelligibility peak @ 3.2kHz)
  airBoostDb: number; // 0 to +6 dB (studio sheen @ 8.5kHz)
  enableDeMud: boolean; // 320 Hz anti-box notch
  enableDeEsser: boolean; // 6.5 kHz sibilance tamer
  deEsserThresholdDb: number; // -30 to -10 dB
  enableLeveler: boolean; // AGC dynamic voice compressor
  levelerTarget: 'gentle' | 'normal' | 'aggressive';
  enableHarmonicWarmth: boolean; // Even-harmonic vocal exciter
  enableRoomDeEcho: boolean; // Dereverberation / decay gate
  highpassCutoffHz: number; // 85 Hz rumble cut
}

export interface PipelineFlowConfig {
  preFilter: 'none' | 'highpass_80hz' | 'browser_native_aec_ns';
  primaryModel: 'rnnoise' | 'deepfilter' | 'dtln' | 'gtcrn' | 'speex';
  speechEnhance: 'none' | 'studio_crisp' | 'laptop_mic_fix' | 'quiet_candidate' | 'asr_stt_optimizer';
  postFilter: 'none' | 'speex_dsp' | 'noise_gate';
  gateThresholdDb: number;
  attenuationLevel: number; // 0 - 100
}

export interface RealtimeMicState {
  isActive: boolean;
  activeModelId: string;
  bypass: boolean;
  gain: number;
  wetDryMix: number;
  noiseReductionLevel: number;
  currentQuantumLatencyMs: number;
  peakLatencyMs: number;
  underrunCount: number;
  isSimulatedNoisePlaying: boolean;
  simulatedNoiseType: 'keyboard' | 'ac_fan' | 'cafe';
}
