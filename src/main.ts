/**
 * CleanVoice AI Studio - Master Application Controller
 */
import './style.css';
import { detectDeviceCapabilities, getAudioContext48k, decodeAudioFile, ensureAudioContextResumed } from './audio/audio-context';
import type { ModelBenchmarkResult, PipelineFlowConfig } from './audio/types';
import { processAudioWithRNNoise, RNNOISE_META } from './audio/rnnoise-engine';
import { processAudioWithDeepFilterNet, DEEPFILTERNET3_META } from './audio/deepfilter-engine';
import { processAudioWithDTLN, DTLN_META } from './audio/dtln-engine';
import { processAudioWithGTCRN, GTCRN_META } from './audio/gtcrn-engine';
import { processAudioWithSpeex, SPEEX_META } from './audio/speex-engine';
import { processAudioWithNativeWebRTC, WEBRTC_NATIVE_META } from './audio/webrtc-dsp-engine';
import { processAudioWithPipeline } from './audio/pipeline-engine';
import { createBenchmarkCard } from './ui/benchmark-card';
import { RealtimeMicSimulator } from './ui/realtime-mic';
import { PipelineFlowBuilder } from './ui/flow-builder';
import { SynchronizedComparisonDeck } from './ui/comparison-deck';
import { CandidateSpeechEnhancerView } from './ui/speech-enhancer-view';

// Application State
let originalAudioBuffer: AudioBuffer | null = null;
let currentResults: Map<string, ModelBenchmarkResult> = new Map();
let activeTab: 'benchmark' | 'live_mic' | 'enhancer' | 'flow' | 'guide' = 'benchmark';
let activePlayingModelId: string | null = null;
let comparisonDeck: SynchronizedComparisonDeck | null = null;
let realtimeMicSim: RealtimeMicSimulator | null = null;
let flowBuilder: PipelineFlowBuilder | null = null;
let speechEnhancerView: CandidateSpeechEnhancerView | null = null;
let isRecordingMicSnippet = false;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

const appContainer = document.querySelector<HTMLDivElement>('#app')!;

async function initApp() {
  const caps = await detectDeviceCapabilities();

  appContainer.innerHTML = `
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="brand-row">
          <div class="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
              <line x1="8" y1="22" x2="16" y2="22"></line>
            </svg>
          </div>
          <div class="brand-text">
            <h1>CleanVoice AI Studio</h1>
            <p class="brand-subtitle">Real-Time Browser Noise Cancellation Benchmark & Telephonic Interview Simulator</p>
          </div>
        </div>

        <div class="hardware-caps-badge">
          <span class="caps-tag ${caps.hasSimd ? 'active' : ''}">WASM SIMD: ${caps.hasSimd ? 'Enabled (Fast)' : 'Disabled'}</span>
          <span>·</span>
          <span class="caps-tag ${caps.hasAudioWorklet ? 'active' : ''}">AudioWorklet: Ready</span>
          <span>·</span>
          <span>Budget: <strong>${caps.quantumBudgetMs} ms</strong> @ 48kHz</span>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <nav class="nav-tabs" role="tablist">
        <button class="nav-tab active" data-tab="benchmark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Multi-Model Benchmark & Audio Lab
        </button>

        <button class="nav-tab" data-tab="live_mic">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          </svg>
          Live Interview Mic Simulator
        </button>

        <button class="nav-tab" data-tab="enhancer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="8" y1="22" x2="16" y2="22"></line>
          </svg>
          Candidate Speech Enhancer & Studio Voice
        </button>

        <button class="nav-tab" data-tab="flow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          Combination Flow Architect
        </button>


        <button class="nav-tab" data-tab="guide">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Device Latency & Phone Guide
        </button>
      </nav>

      <!-- View Containers -->
      <main id="main-content">
        <!-- Tab 1: Multi-Model Benchmark -->
        <section id="view-benchmark" class="tab-view active">
          <!-- Audio Input Card -->
          <div class="input-stage-card glass-card">
            <div class="stage-title-row">
              <div>
                <h2 class="stage-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                  Step 1: Provide Interview Audio Sample
                </h2>
                <p class="stage-subtitle">Upload your own noisy interview recording, record a live mic clip, or load realistic pre-packaged interview scenarios</p>
              </div>
              <div id="loaded-audio-status" class="badge badge-neutral">No Audio Loaded</div>
            </div>

            <div class="input-options-grid">
              <!-- Upload Dropzone -->
              <div class="dropzone-box" id="dropzone">
                <input
                  type="file"
                  id="file-input"
                  accept=".mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac,.webm,.mp4,.m4v,.mov,.avi,.mkv,.mpg,.mpeg,audio/*,video/*"
                  style="display: none;"
                />
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div class="dropzone-text">Click or Drag & Drop Audio or MP4</div>
                <div class="dropzone-hint">WAV, MP3, AAC, M4A, OGG, WEBM, MP4, MOV, AVI, etc. (audio will be used)</div>
              </div>

              <!-- Record Snippet -->
              <div class="recorder-box">
                <button class="btn-record" id="btn-snippet-record" title="Record 5-10s sample from your microphone">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8"></circle>
                  </svg>
                </button>
                <div class="dropzone-text" id="snippet-record-text">Record 5s Speech Snippet</div>
                <div class="dropzone-hint" id="snippet-record-hint">Uses active microphone</div>
              </div>

              <!-- Quick Scenarios -->
              <div class="scenarios-box">
                <div class="scenarios-title">Quick Test Realistic Interview Scenarios:</div>
                <div class="scenario-buttons">
                  <button class="btn-scenario" data-sample="/samples/interview_keyboard_fan.wav">
                    <span>⌨️</span>
                    <div>
                      <strong>Keyboard Clatter & AC Fan Hum</strong>
                      <div class="dropzone-hint">Speech with continuous fan hum + transient typing clicks</div>
                    </div>
                  </button>

                  <button class="btn-scenario" data-sample="/samples/interview_traffic_siren.wav">
                    <span>🚗</span>
                    <div>
                      <strong>Street Traffic & Siren Distraction</strong>
                      <div class="dropzone-hint">Speech with road rumble and sweeping emergency siren</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Benchmark Header & Actions -->
          <div class="benchmark-actions-bar">
            <div class="section-heading">
              <h2>Step 2: Compare Real-Time Noise Cancellation Models</h2>
              <p>Execute side-by-side benchmarks across all models with precise Real-Time Factor (RTF) and spectral clarity metrics</p>
            </div>
            <button class="btn-run-all" id="btn-run-all" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Run All Models Benchmark
            </button>
          </div>

          <!-- Models Grid -->
          <div class="models-grid" id="models-grid">
            <!-- Dynamically populated cards -->
          </div>
        </section>

        <!-- Tab 2: Live Mic Simulator -->
        <section id="view-live_mic" class="tab-view">
          <div id="realtime-mic-container"></div>
        </section>

        <!-- Tab 3: Candidate Speech Enhancer -->
        <section id="view-enhancer" class="tab-view">
          <div id="speech-enhancer-container"></div>
        </section>

        <!-- Tab 4: Combination Flow Architect -->
        <section id="view-flow" class="tab-view">
          <div id="flow-builder-container"></div>
          <div class="section-heading" style="margin-top: 24px;">
            <h3>Combination Flow Benchmark Result</h3>
            <p>Listen and evaluate the synergistic combination of hardware pre-filters, neural denoising, and noise gates</p>
          </div>
          <div class="models-grid" id="flow-result-grid" style="margin-top: 16px;"></div>
        </section>

        <!-- Tab 4: Device & Phone Guide -->
        <section id="view-guide" class="tab-view">
          <div class="guide-section glass-card">
            <div class="guide-header">
              <h3>📱 Real-Time Interview Platforms: Latency & Device Selection Guide</h3>
              <p>Key technical constraints, execution budgets, and device performance considerations for WebRTC and LiveKit</p>
            </div>

            <div class="guide-table-wrapper">
              <table class="guide-table">
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th>WASM / Model Size</th>
                    <th>Avg Quantum Time</th>
                    <th>Real-Time Budget</th>
                    <th>Low-End Androids</th>
                    <th>Firefox Performance</th>
                    <th>License</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>RNNoise</strong> (Xiph RNN)</td>
                    <td>~152 KB</td>
                    <td>0.12 ms</td>
                    <td>2.67 ms (48kHz)</td>
                    <td><span class="badge badge-emerald">Safe (Recommended)</span></td>
                    <td>Normal (Fast)</td>
                    <td>BSD-3-Clause</td>
                  </tr>
                  <tr>
                    <td><strong>DeepFilterNet3</strong> (Perceptual Deep Filter)</td>
                    <td>~24 MB</td>
                    <td>1.90 - 2.80 ms</td>
                    <td>2.67 ms (48kHz)</td>
                    <td><span class="badge badge-amber">Drop Risk on Budget Phones</span></td>
                    <td><span class="badge badge-rose">3x Slower (Warning)</span></td>
                    <td>LGPL-3.0 / MIT</td>
                  </tr>
                  <tr>
                    <td><strong>DTLN</strong> (LiteRT.js Dual LSTM)</td>
                    <td>~3.8 MB</td>
                    <td>3.80 ms</td>
                    <td>32.0 ms (16kHz)</td>
                    <td><span class="badge badge-emerald">Safe</span></td>
                    <td>Normal</td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td><strong>GTCRN</strong> (Gated Conv Recurrent)</td>
                    <td>~200 KB</td>
                    <td>0.45 ms</td>
                    <td>2.67 ms (48kHz)</td>
                    <td><span class="badge badge-emerald">Safe</span></td>
                    <td>Normal</td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td><strong>SpeexDSP</strong> (Acoustic DSP)</td>
                    <td>~56 KB</td>
                    <td>0.08 ms</td>
                    <td>2.67 ms (48kHz)</td>
                    <td><span class="badge badge-emerald">Safe (Ultra-Light)</span></td>
                    <td>Normal (Fast)</td>
                    <td>BSD-3-Clause</td>
                  </tr>
                  <tr>
                    <td><strong>Browser Native WebRTC</strong></td>
                    <td>0 KB</td>
                    <td>0.05 ms</td>
                    <td>Hardware DSP</td>
                    <td><span class="badge badge-emerald">Safe</span></td>
                    <td>Built-in</td>
                    <td>Standard</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <!-- Fixed Bottom Master Transport Bar -->
      <footer id="master-transport-container"></footer>
    </div>
  `;

  // Initialize subcomponents
  setupNavTabs();
  setupAudioInput();
  setupMasterTransport();

  const realtimeContainer = document.querySelector<HTMLElement>('#realtime-mic-container')!;
  realtimeMicSim = new RealtimeMicSimulator(realtimeContainer);

  const enhancerContainer = document.querySelector<HTMLElement>('#speech-enhancer-container')!;
  speechEnhancerView = new CandidateSpeechEnhancerView(enhancerContainer, (result) => {
    currentResults.set(result.modelId, result);
    if (comparisonDeck && originalAudioBuffer) {
      comparisonDeck.setAudioData(originalAudioBuffer, Array.from(currentResults.values()));
      comparisonDeck.switchToModel(result.modelId);
    }
  });

  const flowContainer = document.querySelector<HTMLElement>('#flow-builder-container')!;
  flowBuilder = new PipelineFlowBuilder(flowContainer, (config) => handleRunCustomPipeline(config));

  // Automatically load the prepackaged scenario 1 so the user immediately has data ready to test!
  loadScenario('/samples/interview_keyboard_fan.wav', 'Keyboard Clatter & AC Fan Hum');
}

function setupNavTabs() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.nav-tab');
  const views = document.querySelectorAll<HTMLElement>('.tab-view');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      views.forEach((v) => v.classList.remove('active'));

      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      activeTab = tabId as typeof activeTab;

      const targetView = document.querySelector<HTMLElement>(`#view-${tabId}`);
      targetView?.classList.add('active');
    });
  });
}

function setupAudioInput() {
  const dropzone = document.querySelector<HTMLDivElement>('#dropzone')!;
  const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files.length > 0) {
      await handleFile(fileInput.files[0]);
    }
  });

  // Scenario buttons
  const scenarioBtns = document.querySelectorAll<HTMLButtonElement>('.btn-scenario');
  scenarioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.sample;
      if (url) loadScenario(url, btn.querySelector('strong')?.textContent || 'Sample');
    });
  });

  // Snippet recorder button
  const recordBtn = document.querySelector<HTMLButtonElement>('#btn-snippet-record')!;
  recordBtn.addEventListener('click', () => toggleSnippetRecording());

  // Run all models button
  const btnRunAll = document.querySelector<HTMLButtonElement>('#btn-run-all')!;
  btnRunAll.addEventListener('click', () => runAllModelsBenchmark());
}

async function handleFile(file: File) {
  try {
    const status = document.querySelector<HTMLDivElement>('#loaded-audio-status')!;
    status.textContent = 'Decoding ' + file.name + '...';
    status.className = 'badge badge-amber';

    const buffer = await decodeAudioFile(file, 48000);
    setLoadedAudio(buffer, file.name);
  } catch (err) {
    console.error('File decode error:', err);
    alert('Failed to decode audio file: ' + (err instanceof Error ? err.message : String(err)));
  }
}

async function loadScenario(url: string, name: string) {
  try {
    const status = document.querySelector<HTMLDivElement>('#loaded-audio-status')!;
    status.textContent = `Loading scenario: ${name}...`;
    status.className = 'badge badge-amber';

    const res = await fetch(url);
    const blob = await res.blob();
    const buffer = await decodeAudioFile(blob, 48000);
    setLoadedAudio(buffer, name);
  } catch (err) {
    console.error('Scenario load error:', err);
  }
}

function setLoadedAudio(buffer: AudioBuffer, label: string) {
  originalAudioBuffer = buffer;
  currentResults.clear();

  const status = document.querySelector<HTMLDivElement>('#loaded-audio-status')!;
  status.textContent = `Loaded: ${label} (${buffer.duration.toFixed(1)}s @ 48kHz)`;
  status.className = 'badge badge-emerald';

  const btnRunAll = document.querySelector<HTMLButtonElement>('#btn-run-all')!;
  btnRunAll.disabled = false;

  // Add baseline raw original card
  const originalMeta = {
    id: 'original',
    name: 'Raw Original Audio (No Processing)',
    shortName: 'Raw Baseline',
    badge: 'Baseline Reference',
    category: 'native' as const,
    description: 'Unprocessed raw input capturing all background acoustics, typing transients, and environmental noise.',
    frameSizeSamples: 128,
    sampleRate: 48000,
    quantumBudgetMs: 2.67,
    packageWeight: '0 KB',
    license: 'N/A',
    mobileSuitability: 'Recommended (All Phones)' as const,
    strengths: ['Zero latency, zero DSP distortion'],
    caveats: ['Unfiltered ambient noise and echo']
  };

  currentResults.set('original', {
    modelId: 'original',
    modelMeta: originalMeta,
    status: 'done',
    audioBuffer: buffer,
    metrics: {
      durationSec: buffer.duration,
      processingTimeMs: 0,
      realTimeFactor: 0,
      avgFrameLatencyMs: 0,
      cpuBudgetPercentage: 0,
      noiseFloorReductionDb: 0,
      estimatedSNRImprovementDb: 0,
      rmsLevelDb: -18,
      peakLevelDb: -2,
      speechPreservationScore: 100,
    }
  });

  // Render initial benchmark cards
  renderBenchmarkGrid();

  // Update speech enhancer buffer
  speechEnhancerView?.setAudioBuffer(buffer);

  // Update master transport
  if (comparisonDeck) {
    comparisonDeck.setAudioData(originalAudioBuffer, Array.from(currentResults.values()));
  }
}


async function toggleSnippetRecording() {
  const btn = document.querySelector<HTMLButtonElement>('#btn-snippet-record')!;
  const txt = document.querySelector<HTMLDivElement>('#snippet-record-text')!;
  const hint = document.querySelector<HTMLDivElement>('#snippet-record-hint')!;

  if (isRecordingMicSnippet) {
    // Stop recording
    mediaRecorder?.stop();
    isRecordingMicSnippet = false;
    btn.classList.remove('recording');
    txt.textContent = 'Record 5s Speech Snippet';
    hint.textContent = 'Uses active microphone';
  } else {
    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const buffer = await decodeAudioFile(blob, 48000);
        setLoadedAudio(buffer, 'Microphone Live Recording');
      };

      mediaRecorder.start();
      isRecordingMicSnippet = true;
      btn.classList.add('recording');
      txt.textContent = 'Recording... Click to Stop';
      hint.textContent = 'Speak with background noise for test';
    } catch (err) {
      alert('Could not access microphone: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
}

function setupMasterTransport() {
  const transportContainer = document.querySelector<HTMLElement>('#master-transport-container')!;
  comparisonDeck = new SynchronizedComparisonDeck(
    transportContainer,
    (progress, activeModelId) => {
      // Sync playheads across cards
      updateCardPlayheads(progress, activeModelId);
    }
  );
}

function updateCardPlayheads(progress: number, activeModelId: string) {
  activePlayingModelId = activeModelId;
  const cards = document.querySelectorAll<HTMLElement>('.model-card');
  cards.forEach((card) => {
    const cardModelId = card.id.replace('card-', '');
    card.classList.toggle('is-playing', cardModelId === activeModelId);
    const line = card.querySelector<HTMLDivElement>('.playhead-line');
    const fill = card.querySelector<HTMLDivElement>('.scrub-fill');
    if (line) line.style.left = `${progress * 100}%`;
    if (fill) fill.style.width = `${progress * 100}%`;
  });
}

function renderBenchmarkGrid() {
  const grid = document.querySelector<HTMLDivElement>('#models-grid');
  if (!grid || !originalAudioBuffer) return;

  grid.innerHTML = '';
  currentResults.forEach((result) => {
    const card = createBenchmarkCard(
      result,
      originalAudioBuffer,
      (modelId) => {
        if (comparisonDeck) comparisonDeck.switchToModel(modelId);
      },
      (progress) => {
        if (comparisonDeck) comparisonDeck.seekTo(progress);
      },
      activePlayingModelId,
      0
    );
    grid.appendChild(card);
  });
}

/**
 * Execute 1-click batch benchmark across all models
 */
async function runAllModelsBenchmark() {
  if (!originalAudioBuffer) return;
  const ctx = getAudioContext48k();
  await ensureAudioContextResumed(ctx);

  const btnRunAll = document.querySelector<HTMLButtonElement>('#btn-run-all')!;
  btnRunAll.disabled = true;
  btnRunAll.innerHTML = `
    <svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
      <path d="M12 2a10 10 0 0 1 10 10"></path>
    </svg>
    Benchmarking Models in Browser...
  `;

  // 1. RNNoise (WASM SIMD)
  try {
    const rnnoiseRes = await processAudioWithRNNoise(originalAudioBuffer, ctx);
    currentResults.set(rnnoiseRes.modelId, rnnoiseRes);
    renderBenchmarkGrid();
  } catch (err) {
    console.error('RNNoise benchmark error:', err);
  }

  // 2. GTCRN (Gated Conv Recurrent)
  try {
    const gtcrnRes = await processAudioWithGTCRN(originalAudioBuffer, ctx);
    currentResults.set(gtcrnRes.modelId, gtcrnRes);
    renderBenchmarkGrid();
  } catch (err) {
    console.error('GTCRN benchmark error:', err);
  }

  // 3. SpeexDSP (Acoustic DSP)
  try {
    const speexRes = await processAudioWithSpeex(originalAudioBuffer, ctx);
    currentResults.set(speexRes.modelId, speexRes);
    renderBenchmarkGrid();
  } catch (err) {
    console.error('SpeexDSP benchmark error:', err);
  }

  // 4. Browser Native WebRTC APM
  try {
    const webrtcRes = await processAudioWithNativeWebRTC(originalAudioBuffer, ctx);
    currentResults.set(webrtcRes.modelId, webrtcRes);
    renderBenchmarkGrid();
  } catch (err) {
    console.error('WebRTC benchmark error:', err);
  }

  // 5. DeepFilterNet3 (SOTA Deep Filter)
  try {
    const dfRes = await processAudioWithDeepFilterNet(originalAudioBuffer, ctx, 60);
    currentResults.set(dfRes.modelId, dfRes);
    renderBenchmarkGrid();
  } catch (err) {
    console.error('DeepFilterNet benchmark error:', err);
  }

  // 6. DTLN (LiteRT Dual-LSTM)
  try {
    const dtlnRes = await processAudioWithDTLN(originalAudioBuffer, ctx);
    currentResults.set(dtlnRes.modelId, dtlnRes);
    renderBenchmarkGrid();
  } catch (err) {
    console.error('DTLN benchmark error:', err);
  }

  // 7. Pipeline Combo (Browser Pre-filter + RNNoise + Gate)
  try {
    const comboRes = await processAudioWithPipeline(originalAudioBuffer, ctx, {
      preFilter: 'browser_native_aec_ns',
      primaryModel: 'rnnoise',
      speechEnhance: 'studio_crisp',
      postFilter: 'noise_gate',
      gateThresholdDb: -42,
      attenuationLevel: 65,
    });

    currentResults.set(comboRes.modelId, comboRes);
    renderBenchmarkGrid();
  } catch (err) {
    console.error('Pipeline combo benchmark error:', err);
  }

  btnRunAll.disabled = false;
  btnRunAll.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
    Re-Run All Models Benchmark
  `;

  if (comparisonDeck) {
    comparisonDeck.setAudioData(originalAudioBuffer, Array.from(currentResults.values()));
  }
}

/**
 * Handle custom combination flow execution
 */
async function handleRunCustomPipeline(config: PipelineFlowConfig) {
  if (!originalAudioBuffer) {
    alert('Please upload or load an audio sample first!');
    return;
  }
  const ctx = getAudioContext48k();
  await ensureAudioContextResumed(ctx);

  const flowGrid = document.querySelector<HTMLDivElement>('#flow-result-grid');
  if (!flowGrid) return;

  flowGrid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--accent-amber);">
      Processing custom chained pipeline [${config.preFilter}] ➔ [${config.primaryModel.toUpperCase()}] ➔ [${config.postFilter}]...
    </div>
  `;

  try {
    const comboRes = await processAudioWithPipeline(originalAudioBuffer, ctx, config);
    currentResults.set('custom_flow', {
      ...comboRes,
      modelId: 'custom_flow',
    });

    flowGrid.innerHTML = '';
    const card = createBenchmarkCard(
      comboRes,
      originalAudioBuffer,
      (modelId) => {
        if (comparisonDeck) comparisonDeck.switchToModel(modelId);
      },
      (progress) => {
        if (comparisonDeck) comparisonDeck.seekTo(progress);
      },
      activePlayingModelId,
      0
    );
    flowGrid.appendChild(card);

    if (comparisonDeck) {
      comparisonDeck.updateSingleResult({
        ...comboRes,
        modelId: 'custom_flow',
      });
      comparisonDeck.switchToModel('custom_flow');
    }
  } catch (err) {
    console.error('Custom pipeline error:', err);
    flowGrid.innerHTML = `
      <div class="card-error-banner">
        Failed to run pipeline: ${err instanceof Error ? err.message : String(err)}
      </div>
    `;
  }
}

// Start Application on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
