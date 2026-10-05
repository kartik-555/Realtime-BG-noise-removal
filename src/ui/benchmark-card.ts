/**
 * Model Result Card Component
 * Displays waveforms, spectrograms, synchronized playback, and metrics.
 */
import type { ModelBenchmarkResult } from '../audio/types';
import { drawWaveform, drawSpectrogram } from '../audio/visualizer';
import { audioBufferToWavBlob } from '../audio/wav-helper';

export function createBenchmarkCard(
  result: ModelBenchmarkResult,
  originalBuffer: AudioBuffer | null,
  onPlayToggle: (modelId: string) => void,
  onSeek: (progress: number) => void,
  activePlayingModelId: string | null,
  currentProgress = 0
): HTMLElement {
  const card = document.createElement('div');
  card.className = `model-card card-${result.modelMeta.category} ${activePlayingModelId === result.modelId ? 'is-playing' : ''}`;
  card.id = `card-${result.modelId}`;

  const meta = result.modelMeta;
  const isOriginal = result.modelId === 'original';

  // Badge styling
  let badgeClass = 'badge-neutral';
  if (meta.category === 'neural_rnn') badgeClass = 'badge-cyan';
  else if (meta.category === 'deepfilter') badgeClass = 'badge-purple';
  else if (meta.category === 'dtln') badgeClass = 'badge-emerald';
  else if (meta.category === 'combo') badgeClass = 'badge-amber';
  else if (meta.category === 'native') badgeClass = 'badge-blue';

  const isCurrentPlaying = activePlayingModelId === result.modelId;

  card.innerHTML = `
    <div class="model-card-header">
      <div class="model-title-group">
        <div class="model-badge-row">
          <span class="badge ${badgeClass}">${meta.badge}</span>
          <span class="badge-footprint">${meta.packageWeight}</span>
          <span class="badge-license">${meta.license}</span>
        </div>
        <h3 class="model-title">${meta.name}</h3>
        <p class="model-desc">${meta.description}</p>
      </div>
      <div class="model-actions">
        ${result.audioBuffer ? `
          <button class="btn-icon btn-download" title="Download Processed WAV" data-action="download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Visualizer Container -->
    <div class="visualizer-wrapper">
      <div class="visualizer-tabs">
        <button class="vis-tab active" data-tab="waveform">Waveform</button>
        <button class="vis-tab" data-tab="spectrogram">Spectrogram (FFT)</button>
      </div>

      <div class="canvas-container">
        <canvas class="waveform-canvas" width="600" height="120"></canvas>
        <canvas class="spectrogram-canvas hidden" width="600" height="120"></canvas>
        <div class="playhead-line" style="left: ${currentProgress * 100}%"></div>
      </div>
    </div>

    <!-- Playback Transport Bar -->
    <div class="player-bar">
      <button class="btn-play-sm ${isCurrentPlaying ? 'playing' : ''}" data-action="play">
        ${isCurrentPlaying ? `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        ` : `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `}
        <span>${isCurrentPlaying ? 'Pause' : 'Solo Listen'}</span>
      </button>

      <div class="scrub-track" data-action="scrub">
        <div class="scrub-fill" style="width: ${currentProgress * 100}%"></div>
      </div>

      <span class="track-duration">${result.audioBuffer ? result.audioBuffer.duration.toFixed(1) + 's' : '0.0s'}</span>
    </div>

    <!-- Metrics Matrix -->
    ${result.metrics ? `
      <div class="metrics-grid">
        <div class="metric-item ${result.metrics.realTimeFactor < 0.15 ? 'metric-good' : (result.metrics.realTimeFactor <= 1.0 ? 'metric-warn' : 'metric-danger')}">
          <span class="metric-label">Real-Time Factor (RTF)</span>
          <span class="metric-value">${result.metrics.realTimeFactor.toFixed(3)}x</span>
          <span class="metric-sub">${result.metrics.realTimeFactor < 1.0 ? (1 / Math.max(0.001, result.metrics.realTimeFactor)).toFixed(0) + 'x faster than RT' : 'Over budget'}</span>
        </div>

        <div class="metric-item ${result.metrics.avgFrameLatencyMs < meta.quantumBudgetMs ? 'metric-good' : 'metric-danger'}">
          <span class="metric-label">Frame Latency</span>
          <span class="metric-value">${result.metrics.avgFrameLatencyMs.toFixed(2)} ms</span>
          <span class="metric-sub">Budget: ${meta.quantumBudgetMs} ms</span>
        </div>

        <div class="metric-item ${result.metrics.noiseFloorReductionDb >= 15 ? 'metric-good' : 'metric-neutral'}">
          <span class="metric-label">Noise Attenuation</span>
          <span class="metric-value">${result.metrics.noiseFloorReductionDb > 0 ? '-' + result.metrics.noiseFloorReductionDb + ' dB' : '0 dB'}</span>
          <span class="metric-sub">Noise Floor Reduction</span>
        </div>

        <div class="metric-item ${result.metrics.speechPreservationScore >= 90 ? 'metric-good' : 'metric-warn'}">
          <span class="metric-label">Voice Preservation</span>
          <span class="metric-value">${result.metrics.speechPreservationScore}%</span>
          <span class="metric-sub">Timbre Retention</span>
        </div>
      </div>

      <div class="mobile-suitability-row">
        <span class="suitability-pill suitability-${meta.mobileSuitability.includes('All') ? 'high' : (meta.mobileSuitability.includes('Mid') ? 'med' : 'low')}">
          📱 ${meta.mobileSuitability}
        </span>
        <span class="suitability-hint">${meta.strengths[0] || ''}</span>
      </div>
    ` : ''}

    ${result.errorMessage ? `
      <div class="card-error-banner">
        ⚠️ Processing Error: ${result.errorMessage}
      </div>
    ` : ''}
  `;

  // Canvas drawing
  const waveCanvas = card.querySelector<HTMLCanvasElement>('.waveform-canvas')!;
  const specCanvas = card.querySelector<HTMLCanvasElement>('.spectrogram-canvas')!;

  if (result.audioBuffer) {
    const themeColor = meta.category === 'deepfilter' ? '#a855f7' : (meta.category === 'dtln' ? '#10b981' : '#06b6d4');
    drawWaveform(waveCanvas, result.audioBuffer, currentProgress, themeColor);
    drawSpectrogram(specCanvas, result.audioBuffer);
  }

  // Visualizer Tab switcher
  const visTabs = card.querySelectorAll<HTMLButtonElement>('.vis-tab');
  visTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      visTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'waveform') {
        waveCanvas.classList.remove('hidden');
        specCanvas.classList.add('hidden');
      } else {
        waveCanvas.classList.add('hidden');
        specCanvas.classList.remove('hidden');
      }
    });
  });

  // Event Listeners
  const playBtn = card.querySelector<HTMLButtonElement>('[data-action="play"]');
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onPlayToggle(result.modelId);
    });
  }

  const scrubTrack = card.querySelector<HTMLDivElement>('[data-action="scrub"]');
  if (scrubTrack) {
    scrubTrack.addEventListener('click', (e) => {
      const rect = scrubTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = Math.max(0, Math.min(1, clickX / rect.width));
      onSeek(progress);
    });
  }

  const downloadBtn = card.querySelector<HTMLButtonElement>('[data-action="download"]');
  if (downloadBtn && result.audioBuffer) {
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blob = audioBufferToWavBlob(result.audioBuffer!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview_denoised_${result.modelId}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return card;
}
