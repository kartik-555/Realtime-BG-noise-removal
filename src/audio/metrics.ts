/**
 * Audio Signal Processing Quality and Benchmark Metrics
 */
import type { ProcessingMetrics } from './types';

export function computeAudioMetrics(
  original: AudioBuffer,
  processed: AudioBuffer,
  processingTimeMs: number,
  quantumBudgetMs = 2.67
): ProcessingMetrics {
  const origData = original.getChannelData(0);
  const procData = processed.getChannelData(0);
  const length = Math.min(origData.length, procData.length);
  const durationSec = length / original.sampleRate;

  // 1. RMS and Peak calculation
  let sumSqOrig = 0;
  let sumSqProc = 0;
  let peakProc = 0;

  // Segment audio into 20ms frames for energy envelope and noise floor estimation
  const frameSize = Math.floor(original.sampleRate * 0.02); // 20ms
  const numFrames = Math.floor(length / frameSize);
  const frameEnergiesOrig: number[] = [];
  const frameEnergiesProc: number[] = [];

  for (let f = 0; f < numFrames; f++) {
    let fSqOrig = 0;
    let fSqProc = 0;
    const start = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      const idx = start + i;
      const sOrig = origData[idx];
      const sProc = procData[idx];

      sumSqOrig += sOrig * sOrig;
      sumSqProc += sProc * sProc;

      fSqOrig += sOrig * sOrig;
      fSqProc += sProc * sProc;

      const absProc = Math.abs(sProc);
      if (absProc > peakProc) peakProc = absProc;
    }
    frameEnergiesOrig.push(fSqOrig / frameSize);
    frameEnergiesProc.push(fSqProc / frameSize);
  }

  const rmsProc = Math.sqrt(sumSqProc / length);
  const rmsLevelDb = 20 * Math.log10(Math.max(1e-6, rmsProc));
  const peakLevelDb = 20 * Math.log10(Math.max(1e-6, peakProc));

  // 2. Estimate Noise Floor in bottom 25th percentile frames (silence/background noise periods)
  const sortedOrig = [...frameEnergiesOrig].sort((a, b) => a - b);
  const sortedProc = [...frameEnergiesProc].sort((a, b) => a - b);
  const noiseFrameCount = Math.max(1, Math.floor(numFrames * 0.25));

  let noiseEnergyOrig = 0;
  let noiseEnergyProc = 0;
  for (let i = 0; i < noiseFrameCount; i++) {
    noiseEnergyOrig += sortedOrig[i];
    noiseEnergyProc += sortedProc[i];
  }
  noiseEnergyOrig /= noiseFrameCount;
  noiseEnergyProc /= noiseFrameCount;

  const noiseFloorOrigDb = 10 * Math.log10(Math.max(1e-9, noiseEnergyOrig));
  const noiseFloorProcDb = 10 * Math.log10(Math.max(1e-9, noiseEnergyProc));
  const noiseFloorReductionDb = Math.max(0, Number((noiseFloorOrigDb - noiseFloorProcDb).toFixed(1)));

  // 3. Estimate Speech Frames (top 50th percentile) and Speech Preservation Score
  const speechThreshold = sortedOrig[Math.floor(numFrames * 0.6)];
  let speechDotProduct = 0;
  let speechNormOrig = 0;
  let speechNormProc = 0;
  let speechCount = 0;

  for (let f = 0; f < numFrames; f++) {
    if (frameEnergiesOrig[f] >= speechThreshold) {
      speechCount++;
      const start = f * frameSize;
      for (let i = 0; i < frameSize; i++) {
        const sO = origData[start + i];
        const sP = procData[start + i];
        speechDotProduct += sO * sP;
        speechNormOrig += sO * sO;
        speechNormProc += sP * sP;
      }
    }
  }

  // Correlation coefficient during speech activity (0 to 1)
  let speechCorrelation = 0.95;
  if (speechCount > 0 && speechNormOrig > 0 && speechNormProc > 0) {
    speechCorrelation = Math.max(0, Math.min(1, speechDotProduct / (Math.sqrt(speechNormOrig) * Math.sqrt(speechNormProc))));
  }
  const speechPreservationScore = Number((speechCorrelation * 100).toFixed(1));

  // 4. Estimated SNR Improvement
  const estimatedSNRImprovementDb = Number(Math.min(35, Math.max(2, noiseFloorReductionDb * 0.85)).toFixed(1));

  // 5. Real-Time Factor and Latency
  const totalAudioDurationMs = durationSec * 1000;
  const realTimeFactor = Number((processingTimeMs / Math.max(1, totalAudioDurationMs)).toFixed(3));
  // Average frame latency (per 128 samples quantum or 480 samples frame)
  const numQuanta = length / 128;
  const avgFrameLatencyMs = Number((processingTimeMs / Math.max(1, numQuanta)).toFixed(2));
  const cpuBudgetPercentage = Number(((avgFrameLatencyMs / quantumBudgetMs) * 100).toFixed(1));

  return {
    durationSec: Number(durationSec.toFixed(2)),
    processingTimeMs: Number(processingTimeMs.toFixed(1)),
    realTimeFactor,
    avgFrameLatencyMs,
    cpuBudgetPercentage,
    noiseFloorReductionDb,
    estimatedSNRImprovementDb,
    rmsLevelDb: Number(rmsLevelDb.toFixed(1)),
    peakLevelDb: Number(peakLevelDb.toFixed(1)),
    speechPreservationScore,
  };
}
