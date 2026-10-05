# CleanVoice AI Studio

CleanVoice AI Studio is a browser-based audio lab for comparing noise suppression and speech enhancement models in realistic interview and telephony scenarios. The project lets you upload noisy audio, record a live microphone sample, run multiple denoising models side by side, and inspect latency, processing efficiency, and audio quality metrics.

This workspace is built for experimentation and benchmarking rather than as a production-ready SaaS app. It focuses on understanding how different browser-friendly audio models behave under real-time constraints, especially for voice calls, remote interviews, and low-quality microphone recordings.

---

## What this project does

The app includes several workflows:

- Multi-model benchmark lab for noisy audio samples
- Live microphone simulation with noise and speech scenarios
- Candidate speech enhancer for voice cleanup and intelligibility tuning
- Combination flow builder for chaining pre-filters, denoisers, and post-filters
- Device and latency guidance for browser-based real-time audio workloads

The interface is designed to make it easy to compare models such as RNNoise, DeepFilterNet3, DTLN, GTCRN, Speex, native WebRTC DSP, and a custom chained pipeline.

---

## Core features

### 1. Audio benchmark comparison

You can load an interview or noisy recording and run multiple models against the same sample. Each model produces metrics like:

- processing duration
- real-time factor (RTF)
- frame latency
- CPU budget usage
- noise floor reduction
- estimated SNR improvement
- speech preservation score

This allows comparisons between computational cost and output quality.

### 2. Live microphone simulator

The app can use your microphone to simulate a live interview environment. It supports:

- recording short speech snippets
- testing active noise conditions
- switching models in real time
- tuning gain and wet/dry mix

This is useful for evaluating whether a model is comfortable in a browser app that runs on a real device.

### 3. Speech enhancer tuning

A dedicated expert voice enhancer stage allows you to adjust a candidate voice for better clarity. It can emphasize:

- intelligibility
- studio-like crispness
- de-essing
- level balancing
- room de-echo
- harmonic warmth

This is designed for voice polishing rather than pure denoising alone.

### 4. Pipeline flow builder

The app includes a flow architect that chains stages together:

- pre-filter
- primary model
- speech enhancement pass
- post-processing gate or DSP stage

This is useful to study whether combining a light pre-filter with a neural denoiser and a final noise gate improves the final result.

### 5. Device and platform guidance

There is a guide section focused on real-time audio constraints, including:

- latency budgets
- WASM and SIMD behavior
- low-end Android considerations
- Firefox performance expectations
- model size and license notes

This gives the project a research and product-planning feel, not just a demo UI.

---

## Supported model families

The app includes a curated set of denoising and enhancement approaches:

- RNNoise: lightweight RNN-based noise suppression
- DeepFilterNet3: perceptual deep filtering approach
- DTLN: deep time-domain learning network
- GTCRN: a gated temporal convolutional recurrent model
- Speex: DSP-oriented denoising and filtering
- WebRTC native DSP: browser-native suppression stack
- Multi-stage pipeline: custom chained processing flow

These are implemented with browser-friendly Web Audio APIs and model artifacts packaged in the project.

---

## Technical overview

### Frontend stack

- TypeScript
- Vite
- Web Audio API
- HTML/CSS interface

### Audio processing model

The app works by:

1. Loading or recording audio into an AudioBuffer
2. Passing it through a model engine or processing chain
3. Rendering the output to a new buffer
4. Comparing the original and processed signals with metrics
5. Displaying results in the UI for side-by-side model comparison

For some models, the project uses browser audio worklets and WebAssembly-based execution paths. For offline analysis, it also uses OfflineAudioContext for rendering and experimentation.

---

## Project structure

```text
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── models/
│   └── samples/
├── src/
│   ├── main.ts
│   ├── style.css
│   ├── audio/
│   │   ├── audio-context.ts
│   │   ├── deepfilter-engine.ts
│   │   ├── dtln-engine.ts
│   │   ├── gtcrn-engine.ts
│   │   ├── rnnoise-engine.ts
│   │   ├── pipeline-engine.ts
│   │   ├── speech-enhancer-engine.ts
│   │   ├── types.ts
│   │   └── metrics.ts
│   └── ui/
│       ├── benchmark-card.ts
│       ├── comparison-deck.ts
│       ├── flow-builder.ts
│       ├── realtime-mic.ts
│       └── speech-enhancer-view.ts
└── suppressors/
```

A few notable folders:

- `src/audio/`: processing engines and metrics
- `src/ui/`: UI views and benchmarking components
- `public/models/`: packaged model assets used by the browser
- `public/samples/`: preloaded noisy audio samples
- `suppressors/`: vendor / integration code for noise suppression libraries

---

## Setup and running locally

### Prerequisites

- Node.js 18+ recommended
- a modern browser with microphone access enabled
- working local audio permissions for microphone recording

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal, typically something like:

```text
http://localhost:5173
```

### Production build

```bash
npm run build
```

This generates a production bundle suitable for deployment.

### Local preview

```bash
npm run preview
```

---

## Typical usage flow

1. Open the app in a browser.
2. Choose a noisy sample or record a live microphone snippet.
3. Upload or capture the audio.
4. Click the benchmark button to run all models.
5. Compare performance, quality, and latency across models.
6. Switch to the live mic or enhancer tabs for interactive testing.
7. Build a custom processing chain in the flow tab.

---

## Notes on performance and browser constraints

This project is intentionally tuned around browser execution realities:

- Some models depend on WebAssembly or browser SIMD support.
- Real-time audio has tight latency budgets.
- Different browsers and devices can produce different runtime behavior.
- Processing quality and responsiveness often involve a tradeoff between denoising power and latency.

For mobile or low-end devices, the lighter models such as RNNoise are often more robust in real time.

---

## Use cases

This project is useful for:

- evaluating denoising model quality in browser audio pipelines
- benchmarking browser-only speech enhancement approaches
- building interview or conferencing UX for noisy environments
- prototyping custom noise suppression chains
- educating teams on tradeoffs between quality, latency, and hardware constraints

---

## License and dependency notes

This project brings together multiple open-source and third-party components. Some audio suppressors and model packages are included under their own licenses. Use the project in accordance with the package dependencies defined in `package.json` and relevant upstream licenses for models or libraries.

---

## Summary

CleanVoice AI Studio is a practical browser-based research and demo app for comparing real-time speech enhancement systems under realistic audio conditions. It combines interactive UI, model benchmarking, live microphone testing, and custom pipeline design into one place, making it a strong workspace for experimenting with denoising and quality engineering in the browser.

If you want to explore the implementation, start with:

- `src/main.ts` for app orchestration
- `src/audio/` for processing engines and metrics
- `src/ui/` for user-facing benchmark and simulator interfaces

---

## Quick start

```bash
npm install
npm run dev
```

Then open the local dev server and begin benchmarking noisy interview recordings or live microphone input.
