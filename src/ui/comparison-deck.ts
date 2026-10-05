/**
 * Master Synchronized A/B/C Comparative Listening Deck
 * Seamlessly crossfades between models at the exact playhead position.
 */
import { getAudioContext48k, ensureAudioContextResumed } from '../audio/audio-context';
import type { ModelBenchmarkResult } from '../audio/types';

export class SynchronizedComparisonDeck {
  private container: HTMLElement;
  private results: Map<string, ModelBenchmarkResult> = new Map();
  private originalBuffer: AudioBuffer | null = null;

  private isPlaying = false;
  private isLooping = true;
  private currentProgress = 0; // 0.0 to 1.0
  private currentPlayheadSec = 0;
  private activeModelId: string = 'original';

  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioCtx: AudioContext | null = null;
  private startCtxTime = 0;
  private startOffsetSec = 0;
  private animFrameId: number | null = null;

  private onProgressUpdate: (progress: number, activeModelId: string) => void;

  constructor(
    container: HTMLElement,
    onProgressUpdate: (progress: number, activeModelId: string) => void
  ) {
    this.container = container;
    this.onProgressUpdate = onProgressUpdate;
    this.render();
  }

  setAudioData(original: AudioBuffer, results: ModelBenchmarkResult[]) {
    this.originalBuffer = original;
    this.results.clear();
    results.forEach((r) => this.results.set(r.modelId, r));
    this.render();
  }

  updateSingleResult(result: ModelBenchmarkResult) {
    this.results.set(result.modelId, result);
    this.render();
  }

  private render() {
    const duration = this.originalBuffer ? this.originalBuffer.duration : 0;
    const minutes = Math.floor(this.currentPlayheadSec / 60);
    const seconds = (this.currentPlayheadSec % 60).toFixed(1).padStart(4, '0');
    const totalMinutes = Math.floor(duration / 60);
    const totalSeconds = (duration % 60).toFixed(1).padStart(4, '0');

    this.container.innerHTML = `
      <div class="master-transport-bar glass-card">
        <div class="transport-controls">
          <!-- Play / Pause -->
          <button class="btn-transport-play ${this.isPlaying ? 'active' : ''}" id="btn-master-play" ${!this.originalBuffer ? 'disabled' : ''}>
            ${this.isPlaying ? `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ` : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            `}
          </button>

          <!-- Loop toggle -->
          <button class="btn-transport-icon ${this.isLooping ? 'active' : ''}" id="btn-master-loop" title="Toggle Loop">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </button>

          <!-- Time Display -->
          <div class="time-display">
            <span class="time-current">${minutes}:${seconds}</span>
            <span class="time-slash">/</span>
            <span class="time-total">${totalMinutes}:${totalSeconds}</span>
          </div>
        </div>

        <!-- Master Scrubber -->
        <div class="master-scrubber" id="master-scrub-track">
          <div class="master-scrub-fill" style="width: ${this.currentProgress * 100}%"></div>
          <div class="master-scrub-handle" style="left: ${this.currentProgress * 100}%"></div>
        </div>

        <!-- Instant Model Hot-Switch Buttons -->
        <div class="quick-switcher-row">
          <span class="switcher-label">Instant A/B Switch:</span>
          <div class="switcher-buttons" id="switcher-buttons">
            <button class="btn-model-switch ${this.activeModelId === 'original' ? 'active' : ''}" data-model="original">
              Raw Baseline
            </button>
            ${Array.from(this.results.values()).map((r) => `
              <button class="btn-model-switch ${this.activeModelId === r.modelId ? 'active' : ''} ${r.status !== 'done' ? 'disabled' : ''}" data-model="${r.modelId}">
                ${r.modelMeta.shortName}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const btnPlay = this.container.querySelector<HTMLButtonElement>('#btn-master-play');
    btnPlay?.addEventListener('click', () => this.togglePlay());

    const btnLoop = this.container.querySelector<HTMLButtonElement>('#btn-master-loop');
    btnLoop?.addEventListener('click', () => {
      this.isLooping = !this.isLooping;
      btnLoop.classList.toggle('active', this.isLooping);
    });

    const scrubTrack = this.container.querySelector<HTMLDivElement>('#master-scrub-track');
    scrubTrack?.addEventListener('click', (e) => {
      const rect = scrubTrack.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.seekTo(progress);
    });

    const switchBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-model-switch');
    switchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const modelId = btn.dataset.model;
        if (modelId) this.switchToModel(modelId);
      });
    });
  }

  async togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  async play() {
    if (!this.originalBuffer) return;
    this.audioCtx = getAudioContext48k();
    await ensureAudioContextResumed(this.audioCtx);

    const buffer = this.getActiveBuffer();
    if (!buffer) return;

    this.stopSource();

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = this.isLooping;

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 1.0;

    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    const offset = this.currentPlayheadSec % buffer.duration;
    this.startCtxTime = this.audioCtx.currentTime;
    this.startOffsetSec = offset;

    this.sourceNode.start(0, offset);
    this.isPlaying = true;
    this.render();

    this.startPlayheadTracker();
  }

  pause() {
    this.stopSource();
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.render();
  }

  seekTo(progress: number) {
    const duration = this.originalBuffer ? this.originalBuffer.duration : 1;
    this.currentProgress = progress;
    this.currentPlayheadSec = progress * duration;

    if (this.isPlaying) {
      this.play(); // restarts at current offset
    } else {
      this.render();
      this.onProgressUpdate(this.currentProgress, this.activeModelId);
    }
  }

  switchToModel(modelId: string) {
    this.activeModelId = modelId;
    if (this.isPlaying) {
      // Seamless micro crossfade: restart immediately at exact position
      this.play();
    } else {
      this.render();
      this.onProgressUpdate(this.currentProgress, this.activeModelId);
    }
  }

  private getActiveBuffer(): AudioBuffer | null {
    if (this.activeModelId === 'original') return this.originalBuffer;
    const res = this.results.get(this.activeModelId);
    return res?.audioBuffer || this.originalBuffer;
  }

  private stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // already stopped
      }
      this.sourceNode = null;
    }
  }

  private startPlayheadTracker() {
    const update = () => {
      if (!this.isPlaying || !this.audioCtx || !this.originalBuffer) return;
      const elapsed = this.audioCtx.currentTime - this.startCtxTime;
      const duration = this.originalBuffer.duration;
      let cur = this.startOffsetSec + elapsed;

      if (this.isLooping) {
        cur = cur % duration;
      } else if (cur >= duration) {
        this.pause();
        this.seekTo(0);
        return;
      }

      this.currentPlayheadSec = cur;
      this.currentProgress = Math.max(0, Math.min(1, cur / duration));

      // Fast update DOM elements without re-rendering entire structure
      const scrubFill = this.container.querySelector<HTMLDivElement>('.master-scrub-fill');
      const scrubHandle = this.container.querySelector<HTMLDivElement>('.master-scrub-handle');
      const timeCur = this.container.querySelector<HTMLSpanElement>('.time-current');

      if (scrubFill) scrubFill.style.width = `${this.currentProgress * 100}%`;
      if (scrubHandle) scrubHandle.style.left = `${this.currentProgress * 100}%`;
      if (timeCur) {
        const m = Math.floor(cur / 60);
        const s = (cur % 60).toFixed(1).padStart(4, '0');
        timeCur.textContent = `${m}:${s}`;
      }

      this.onProgressUpdate(this.currentProgress, this.activeModelId);
      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }
}
