/**
 * CleanVoice AI Studio - Candidate Speech Enhancer UI Component
 * 
 * Interactive studio for enhancing candidate speech in real-time interviews:
 * Consonant Formant EQ, Automatic Voice Leveler, Dynamic De-Esser, Room De-Echo, and Harmonic Warmth.
 */

import type { ModelBenchmarkResult, SpeechEnhancementConfig, SpeechEnhancerPreset } from '../audio/types';
import { SPEECH_ENHANCER_PRESETS, processAudioWithSpeechEnhancer } from '../audio/speech-enhancer-engine';
import { drawWaveform, drawSpectrogram } from '../audio/visualizer';
import { audioBufferToWavBlob } from '../audio/wav-helper';

export class CandidateSpeechEnhancerView {
  private container: HTMLElement;
  private currentConfig: SpeechEnhancementConfig;
  private currentAudioBuffer: AudioBuffer | null = null;
  private lastEnhancedResult: ModelBenchmarkResult | null = null;
  private isProcessing = false;
  private onResultGenerated: (result: ModelBenchmarkResult) => void;

  constructor(
    container: HTMLElement,
    onResultGenerated: (result: ModelBenchmarkResult) => void
  ) {
    this.container = container;
    this.onResultGenerated = onResultGenerated;
    // Default preset
    this.currentConfig = { ...SPEECH_ENHANCER_PRESETS.studio_crisp };
    this.render();
  }

  public setAudioBuffer(buffer: AudioBuffer | null) {
    this.currentAudioBuffer = buffer;
    this.updateBufferStatus();
  }

  public getResult(): ModelBenchmarkResult | null {
    return this.lastEnhancedResult;
  }

  private render() {
    this.container.innerHTML = `
      <div class="speech-enhancer-studio">
        <!-- Overview Banner -->
        <div class="enhancer-header-card">
          <div class="enhancer-header-content">
            <div class="enhancer-badge">
              <span class="pulse-emerald"></span>
              Studio Voice Processing Suite
            </div>
            <h2>Candidate Speech & Vocal Clarity Enhancer</h2>
            <p>
              In real-world interviews, candidates often suffer from quiet whispering, boxy laptop microphones,
              harsh sibilance, or hollow room echo. This engine transforms muffled candidate audio into crisp,
              leveled, broadcast-grade speech in real-time (&lt;0.05 ms latency).
            </p>
          </div>

          <div class="enhancer-metrics-pill">
            <div class="mini-stat">
              <span class="mini-stat-val">&lt; 0.05 ms</span>
              <span class="mini-stat-lbl">DSP Latency</span>
            </div>
            <div class="mini-stat-divider"></div>
            <div class="mini-stat">
              <span class="mini-stat-val">+100%</span>
              <span class="mini-stat-lbl">Android Safe</span>
            </div>
            <div class="mini-stat-divider"></div>
            <div class="mini-stat">
              <span class="mini-stat-val">3.2 kHz</span>
              <span class="mini-stat-lbl">Formant Band</span>
            </div>
          </div>
        </div>

        <!-- Preset Selector Deck -->
        <div class="enhancer-card">
          <div class="section-title-row">
            <div>
              <h3>Interview Candidate Presets</h3>
              <p class="section-desc">One-click acoustic profiles tuned for common interview equipment issues</p>
            </div>
          </div>

          <div class="preset-pill-grid">
            <button class="preset-pill active" data-preset="studio_crisp">
              <div class="preset-pill-icon">🎙️</div>
              <div class="preset-pill-text">
                <strong>Studio Crisp Interview</strong>
                <span>General broadcast tone, smooth leveling & rumble cut</span>
              </div>
            </button>

            <button class="preset-pill" data-preset="laptop_mic_fix">
              <div class="preset-pill-icon">💻</div>
              <div class="preset-pill-text">
                <strong>Fix Cheap Laptop Mic</strong>
                <span>Cuts 320Hz boxiness + 6.5dB consonant presence</span>
              </div>
            </button>

            <button class="preset-pill" data-preset="quiet_candidate">
              <div class="preset-pill-icon">🗣️</div>
              <div class="preset-pill-text">
                <strong>Quiet / Shy Candidate</strong>
                <span>Automatic +8dB RMS makeup leveling & dynamic AGC</span>
              </div>
            </button>

            <button class="preset-pill" data-preset="echoey_room">
              <div class="preset-pill-icon">🏢</div>
              <div class="preset-pill-text">
                <strong>Hollow Room De-Echo</strong>
                <span>Suppresses room reflections & diffuse reverb tails</span>
              </div>
            </button>

            <button class="preset-pill" data-preset="asr_stt_optimizer">
              <div class="preset-pill-icon">🤖</div>
              <div class="preset-pill-text">
                <strong>AI Speech-to-Text (ASR) Optimizer</strong>
                <span>Tuned for Whisper & Deepgram phoneme boundary accuracy</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Interactive DSP Controls -->
        <div class="enhancer-grid">
          <!-- Left Column: Equalization & Intelligibility -->
          <div class="enhancer-card">
            <h4>1. Vocal Intelligibility & Acoustic Shaping</h4>
            <p class="section-desc">Parametric IIR shaping targeting candidate speech formant frequencies</p>

            <div class="slider-control-group">
              <div class="slider-label-row">
                <span class="slider-title">Consonant Formant Presence (3.2 kHz)</span>
                <span class="slider-val-badge" id="val-clarity-boost">+${this.currentConfig.clarityBoostDb} dB</span>
              </div>
              <input type="range" id="slider-clarity-boost" min="0" max="9" step="0.5" value="${this.currentConfig.clarityBoostDb}" class="studio-slider" />
              <div class="slider-subtext">Boosts consonants ('t', 'k', 'p', 's') critical for human comprehension and AI transcription.</div>
            </div>

            <div class="slider-control-group">
              <div class="slider-label-row">
                <span class="slider-title">Studio Air & Sheen (8.5 kHz)</span>
                <span class="slider-val-badge" id="val-air-boost">+${this.currentConfig.airBoostDb} dB</span>
              </div>
              <input type="range" id="slider-air-boost" min="0" max="6" step="0.5" value="${this.currentConfig.airBoostDb}" class="studio-slider" />
              <div class="slider-subtext">Removes dull, muffled telephone audio feel and adds high-frequency openness.</div>
            </div>

            <div class="toggle-control-row">
              <div>
                <strong>Laptop De-Mud Filter (320 Hz Notch)</strong>
                <div class="slider-subtext">Removes hollow, boomy chest resonance caused by laptop plastic enclosures.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-demud" ${this.currentConfig.enableDeMud ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </div>

            <div class="toggle-control-row">
              <div>
                <strong>High-Pass Rumble Filter (85 Hz Cut)</strong>
                <div class="slider-subtext">Eliminates desk thuds, breathing pops, and low-frequency room drone.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-rumble" checked disabled>
                <span class="slider round"></span>
              </label>
            </div>
          </div>

          <!-- Right Column: Dynamics, Sibilance & Harmonics -->
          <div class="enhancer-card">
            <h4>2. Dynamic Leveler, De-Esser & Room Control</h4>
            <p class="section-desc">Adaptive dynamics for consistent conversational loudness and clean articulation</p>

            <div class="toggle-control-row">
              <div>
                <strong>Automatic Voice Leveler (AGC)</strong>
                <div class="slider-subtext">Soft-knee dynamic compression: pulls up quiet whispers, prevents loud shouting from clipping.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-leveler" ${this.currentConfig.enableLeveler ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </div>

            <div class="segmented-control-row" id="group-leveler-target">
              <button class="seg-btn ${this.currentConfig.levelerTarget === 'gentle' ? 'active' : ''}" data-target="gentle">Gentle</button>
              <button class="seg-btn ${this.currentConfig.levelerTarget === 'normal' ? 'active' : ''}" data-target="normal">Normal</button>
              <button class="seg-btn ${this.currentConfig.levelerTarget === 'aggressive' ? 'active' : ''}" data-target="aggressive">Aggressive (+8dB)</button>
            </div>

            <div class="toggle-control-row">
              <div>
                <strong>Dynamic De-Esser (6.5 kHz Sibilance Tamer)</strong>
                <div class="slider-subtext">Ducks piercing high frequencies only when harsh "S" and "Sh" sounds occur.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-deesser" ${this.currentConfig.enableDeEsser ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </div>

            <div class="toggle-control-row">
              <div>
                <strong>Room Dereverberation (De-Echo)</strong>
                <div class="slider-subtext">Tightens hollow room reflections and diffuse acoustic decay in bare rooms.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-deecho" ${this.currentConfig.enableRoomDeEcho ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </div>

            <div class="toggle-control-row">
              <div>
                <strong>Harmonic Vocal Warmth (Even Harmonics)</strong>
                <div class="slider-subtext">Generates 2nd-order psychoacoustic warmth to give thin earphone mics body and fullness.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-warmth" ${this.currentConfig.enableHarmonicWarmth ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Action & Processing Bar -->
        <div class="enhancer-action-bar">
          <div class="audio-status-box" id="enhancer-buffer-indicator">
            <span class="status-indicator"></span>
            <span id="enhancer-buffer-label">Audio Sample Loaded & Ready</span>
          </div>

          <button id="btn-process-enhancement" class="btn btn-primary btn-large">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            Enhance Candidate Speech Now
          </button>
        </div>

        <!-- Enhanced Result Display Area -->
        <div id="enhanced-result-container" class="enhanced-result-area" style="display: none;">
          <!-- Dynamically populated upon processing -->
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateBufferStatus();
  }

  private bindEvents() {
    // Preset pill clicks
    const presetPills = this.container.querySelectorAll<HTMLButtonElement>('.preset-pill');
    presetPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        presetPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        const presetKey = pill.dataset.preset as SpeechEnhancerPreset;
        if (SPEECH_ENHANCER_PRESETS[presetKey]) {
          this.applyPreset(presetKey);
        }
      });
    });

    // Sliders
    const sliderClarity = this.container.querySelector<HTMLInputElement>('#slider-clarity-boost')!;
    const valClarity = this.container.querySelector<HTMLElement>('#val-clarity-boost')!;
    sliderClarity.addEventListener('input', () => {
      this.currentConfig.clarityBoostDb = parseFloat(sliderClarity.value);
      valClarity.textContent = `+${this.currentConfig.clarityBoostDb.toFixed(1)} dB`;
    });

    const sliderAir = this.container.querySelector<HTMLInputElement>('#slider-air-boost')!;
    const valAir = this.container.querySelector<HTMLElement>('#val-air-boost')!;
    sliderAir.addEventListener('input', () => {
      this.currentConfig.airBoostDb = parseFloat(sliderAir.value);
      valAir.textContent = `+${this.currentConfig.airBoostDb.toFixed(1)} dB`;
    });

    // Toggles
    const toggleDeMud = this.container.querySelector<HTMLInputElement>('#toggle-demud')!;
    toggleDeMud.addEventListener('change', () => {
      this.currentConfig.enableDeMud = toggleDeMud.checked;
    });

    const toggleLeveler = this.container.querySelector<HTMLInputElement>('#toggle-leveler')!;
    toggleLeveler.addEventListener('change', () => {
      this.currentConfig.enableLeveler = toggleLeveler.checked;
    });

    // Leveler targets
    const segBtns = this.container.querySelectorAll<HTMLButtonElement>('#group-leveler-target .seg-btn');
    segBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        segBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentConfig.levelerTarget = btn.dataset.target as 'gentle' | 'normal' | 'aggressive';
      });
    });

    const toggleDeEsser = this.container.querySelector<HTMLInputElement>('#toggle-deesser')!;
    toggleDeEsser.addEventListener('change', () => {
      this.currentConfig.enableDeEsser = toggleDeEsser.checked;
    });

    const toggleDeEcho = this.container.querySelector<HTMLInputElement>('#toggle-deecho')!;
    toggleDeEcho.addEventListener('change', () => {
      this.currentConfig.enableRoomDeEcho = toggleDeEcho.checked;
    });

    const toggleWarmth = this.container.querySelector<HTMLInputElement>('#toggle-warmth')!;
    toggleWarmth.addEventListener('change', () => {
      this.currentConfig.enableHarmonicWarmth = toggleWarmth.checked;
    });

    // Process button
    const btnProcess = this.container.querySelector<HTMLButtonElement>('#btn-process-enhancement')!;
    btnProcess.addEventListener('click', () => this.handleProcess());
  }

  private applyPreset(presetKey: SpeechEnhancerPreset) {
    const preset = SPEECH_ENHANCER_PRESETS[presetKey];
    this.currentConfig = { ...preset };

    // Update UI elements
    const sliderClarity = this.container.querySelector<HTMLInputElement>('#slider-clarity-boost')!;
    const valClarity = this.container.querySelector<HTMLElement>('#val-clarity-boost')!;
    sliderClarity.value = String(this.currentConfig.clarityBoostDb);
    valClarity.textContent = `+${this.currentConfig.clarityBoostDb.toFixed(1)} dB`;

    const sliderAir = this.container.querySelector<HTMLInputElement>('#slider-air-boost')!;
    const valAir = this.container.querySelector<HTMLElement>('#val-air-boost')!;
    sliderAir.value = String(this.currentConfig.airBoostDb);
    valAir.textContent = `+${this.currentConfig.airBoostDb.toFixed(1)} dB`;

    const toggleDeMud = this.container.querySelector<HTMLInputElement>('#toggle-demud')!;
    toggleDeMud.checked = this.currentConfig.enableDeMud;

    const toggleLeveler = this.container.querySelector<HTMLInputElement>('#toggle-leveler')!;
    toggleLeveler.checked = this.currentConfig.enableLeveler;

    const segBtns = this.container.querySelectorAll<HTMLButtonElement>('#group-leveler-target .seg-btn');
    segBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.target === this.currentConfig.levelerTarget);
    });

    const toggleDeEsser = this.container.querySelector<HTMLInputElement>('#toggle-deesser')!;
    toggleDeEsser.checked = this.currentConfig.enableDeEsser;

    const toggleDeEcho = this.container.querySelector<HTMLInputElement>('#toggle-deecho')!;
    toggleDeEcho.checked = this.currentConfig.enableRoomDeEcho;

    const toggleWarmth = this.container.querySelector<HTMLInputElement>('#toggle-warmth')!;
    toggleWarmth.checked = this.currentConfig.enableHarmonicWarmth;
  }

  private updateBufferStatus() {
    const indicator = this.container.querySelector<HTMLElement>('#enhancer-buffer-indicator');
    const label = this.container.querySelector<HTMLElement>('#enhancer-buffer-label');
    if (!indicator || !label) return;

    if (this.currentAudioBuffer) {
      indicator.className = 'audio-status-box active';
      label.textContent = `Active Sample: ${this.currentAudioBuffer.duration.toFixed(1)}s @ ${this.currentAudioBuffer.sampleRate}Hz`;
    } else {
      indicator.className = 'audio-status-box';
      label.textContent = 'No Audio Loaded (Upload or record in Step 1)';
    }
  }

  private async handleProcess() {
    if (!this.currentAudioBuffer) {
      alert('Please upload an audio file or select a scenario in Step 1 first!');
      return;
    }

    if (this.isProcessing) return;
    this.isProcessing = true;

    const btn = this.container.querySelector<HTMLButtonElement>('#btn-process-enhancement')!;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-small"></span> Enhancing Candidate Speech...`;

    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const result = await processAudioWithSpeechEnhancer(this.currentAudioBuffer, audioCtx, this.currentConfig);
      await audioCtx.close();

      this.lastEnhancedResult = result;
      this.renderResultCard(result);
      this.onResultGenerated(result);
    } catch (err) {
      console.error('Speech enhancement error:', err);
      alert('Speech enhancement failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      this.isProcessing = false;
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        Enhance Candidate Speech Now
      `;
    }
  }

  private renderResultCard(result: ModelBenchmarkResult) {
    const resultContainer = this.container.querySelector<HTMLElement>('#enhanced-result-container')!;
    resultContainer.style.display = 'block';

    const metrics = result.metrics!;
    const wavBlob = audioBufferToWavBlob(result.audioBuffer!);
    const wavUrl = URL.createObjectURL(wavBlob);

    resultContainer.innerHTML = `
      <div class="benchmark-card card-enhanced-voice">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-badge badge-emerald">Studio Quality Speech</div>
            <h3 class="card-name">Enhanced Candidate Speech (Formant Clarity + AGC Leveler)</h3>
            <p class="card-desc">
              Equalized with +${this.currentConfig.clarityBoostDb}dB 3.2kHz formant clarity boost, 
              ${this.currentConfig.enableLeveler ? 'dynamic soft-knee voice leveler,' : ''}
              ${this.currentConfig.enableDeEsser ? 'sibilance de-esser,' : ''}
              ${this.currentConfig.enableRoomDeEcho ? 'room de-echo,' : ''}
              and sub-bass rumble cutoff.
            </p>
          </div>

          <div class="card-actions">
            <a href="${wavUrl}" download="enhanced_candidate_voice.wav" class="btn-download" title="Download Enhanced WAV">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>

        <!-- Visualizer tabs & canvas -->
        <div class="vis-container">
          <div class="vis-tabs">
            <button class="vis-tab active" data-tab="waveform">Waveform</button>
            <button class="vis-tab" data-tab="spectrogram">Spectrogram (FFT)</button>
          </div>
          <div class="canvas-wrap">
            <canvas class="vis-canvas" width="700" height="120"></canvas>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="card-metrics-grid">
          <div class="metric-item">
            <div class="metric-value metric-good">${metrics.realTimeFactor.toFixed(3)}x</div>
            <div class="metric-label">Real-Time Factor</div>
            <div class="metric-sub">${(1 / Math.max(0.0001, metrics.realTimeFactor)).toFixed(0)}x faster than RT</div>
          </div>

          <div class="metric-item">
            <div class="metric-value metric-good">${metrics.avgFrameLatencyMs.toFixed(2)} ms</div>
            <div class="metric-label">Frame Latency</div>
            <div class="metric-sub">Budget: 2.67 ms (0% CPU)</div>
          </div>

          <div class="metric-item">
            <div class="metric-value metric-good">+${this.currentConfig.clarityBoostDb} dB</div>
            <div class="metric-label">Formant Presence</div>
            <div class="metric-sub">3.2 kHz Consonant Articulation</div>
          </div>

          <div class="metric-item">
            <div class="metric-value metric-good">${metrics.speechPreservationScore}%</div>
            <div class="metric-label">Speech Preservation</div>
            <div class="metric-sub">Zero Muffling / Artifacts</div>
          </div>
        </div>

        <div class="enhancement-tip-callout">
          <div class="tip-icon">✨</div>
          <div class="tip-text">
            <strong>Ready for Comparison:</strong> This enhanced candidate voice is now synced in the bottom Master Transport Bar.
            Click <strong>Play</strong> below and use the <strong>Instant A/B Switch</strong> to toggle between the raw noisy candidate audio and this enhanced studio voice in real time!
          </div>
        </div>
      </div>
    `;

    // Render Canvas
    const canvas = resultContainer.querySelector<HTMLCanvasElement>('.vis-canvas')!;
    drawWaveform(canvas, result.audioBuffer!, 0, '#10b981');

    // Visualizer tabs
    const tabs = resultContainer.querySelectorAll<HTMLButtonElement>('.vis-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        if (tab.dataset.tab === 'spectrogram') {
          drawSpectrogram(canvas, result.audioBuffer!);
        } else {
          drawWaveform(canvas, result.audioBuffer!, 0, '#10b981');
        }
      });
    });

    // Scroll into view
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
