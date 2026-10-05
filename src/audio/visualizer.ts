/**
 * Canvas Visualizer Engine: Waveforms, Spectrograms, and Realtime Oscilloscopes
 */

// Turbo / Inferno colormap for spectrogram
function getSpectrogramColor(val: number): [number, number, number] {
  // val is 0.0 to 1.0 (normalized dB intensity)
  const v = Math.max(0, Math.min(1, val));
  if (v < 0.2) {
    // Deep purple / dark obsidian
    const t = v / 0.2;
    return [Math.floor(15 + t * 40), Math.floor(15 + t * 15), Math.floor(35 + t * 65)];
  } else if (v < 0.45) {
    // Purple to Magenta
    const t = (v - 0.2) / 0.25;
    return [Math.floor(55 + t * 130), Math.floor(30 + t * 10), Math.floor(100 + t * 40)];
  } else if (v < 0.75) {
    // Magenta to Vivid Orange/Coral
    const t = (v - 0.45) / 0.3;
    return [Math.floor(185 + t * 65), Math.floor(40 + t * 110), Math.floor(140 - t * 100)];
  } else {
    // Orange to Bright Yellow/White
    const t = (v - 0.75) / 0.25;
    return [Math.floor(250 + t * 5), Math.floor(150 + t * 105), Math.floor(40 + t * 190)];
  }
}

/**
 * Render Waveform onto Canvas with playhead support
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  playheadProgress = 0,
  themeColor = '#06b6d4'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const amp = height / 2;

  ctx.clearRect(0, 0, width, height);

  // Background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, amp);
  ctx.lineTo(width, amp);
  ctx.stroke();

  // Waveform fill & outline
  ctx.fillStyle = `${themeColor}22`;
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(0, amp);

  // Top half
  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    const startIdx = i * step;
    for (let j = 0; j < step; j++) {
      const datum = data[startIdx + j] || 0;
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.lineTo(i, (1 - max) * amp);
  }

  // Bottom half backwards
  for (let i = width - 1; i >= 0; i--) {
    let min = 1.0;
    let max = -1.0;
    const startIdx = i * step;
    for (let j = 0; j < step; j++) {
      const datum = data[startIdx + j] || 0;
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.lineTo(i, (1 - min) * amp);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Playhead cursor
  if (playheadProgress > 0 && playheadProgress <= 1) {
    const playheadX = playheadProgress * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Subtle glow
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
  }
  ctx.shadowBlur = 0;
}

/**
 * Render Audio Spectrogram (STFT FFT Heatmap)
 */
export function drawSpectrogram(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;

  ctx.clearRect(0, 0, width, height);

  const fftSize = 512;
  const halfFft = fftSize / 2;
  const numSlices = Math.min(width, 360);
  const sliceHop = Math.floor((data.length - fftSize) / numSlices);

  if (sliceHop <= 0) return;

  const imgData = ctx.createImageData(width, height);
  const pixels = imgData.data;

  // Pre-calculate Hanning window
  const window = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
  }

  // Real & Imag arrays for discrete Fourier transform approximation
  const real = new Float32Array(halfFft);
  const imag = new Float32Array(halfFft);

  for (let slice = 0; slice < width; slice++) {
    const dataIdx = Math.floor(slice * ((data.length - fftSize) / width));

    // Compute power spectrum across frequency bins
    for (let k = 0; k < halfFft; k++) {
      let r = 0;
      let im = 0;
      // Stride sampling for speed
      for (let n = 0; n < fftSize; n += 2) {
        const val = data[dataIdx + n] * window[n];
        const angle = (2 * Math.PI * k * n) / fftSize;
        r += val * Math.cos(angle);
        im -= val * Math.sin(angle);
      }
      real[k] = r;
      imag[k] = im;
    }

    // Map each frequency bin to vertical Y pixel
    for (let y = 0; y < height; y++) {
      // Invert Y (high frequencies at top, low frequencies at bottom)
      const binIdx = Math.floor(((height - 1 - y) / height) * (halfFft * 0.75));
      const mag = Math.sqrt(real[binIdx] * real[binIdx] + imag[binIdx] * imag[binIdx]);
      const db = 20 * Math.log10(Math.max(1e-5, mag));
      // Normalize from -70dB .. -10dB to 0.0 .. 1.0
      const norm = Math.max(0, Math.min(1, (db + 65) / 55));

      const [cr, cg, cb] = getSpectrogramColor(norm);
      const pIdx = (y * width + slice) * 4;
      pixels[pIdx] = cr;
      pixels[pIdx + 1] = cg;
      pixels[pIdx + 2] = cb;
      pixels[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Overlay frequency markers
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '9px monospace';
  ctx.fillText('16kHz', 6, 14);
  ctx.fillText('8kHz', 6, height / 2);
  ctx.fillText('300Hz', 6, height - 6);
}

/**
 * Realtime Live Frequency Spectrum & Oscilloscope Analyzer
 */
export class LiveAudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode;
  private animId: number | null = null;
  private freqData: Uint8Array;
  private timeData: Uint8Array;

  constructor(canvas: HTMLCanvasElement, analyser: AnalyserNode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.analyser = analyser;
    this.analyser.fftSize = 1024;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
  }

  start() {
    const draw = () => {
      this.animId = requestAnimationFrame(draw);
      this.render();
    };
    draw();
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    this.analyser.getByteFrequencyData(this.freqData as unknown as Uint8Array<ArrayBuffer>);
    this.analyser.getByteTimeDomainData(this.timeData as unknown as Uint8Array<ArrayBuffer>);

    ctx.fillStyle = 'rgba(11, 15, 23, 0.4)';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Frequency spectrum bars (bottom half)
    const barCount = 64;
    const barWidth = width / barCount;
    for (let i = 0; i < barCount; i++) {
      const binIdx = Math.floor(Math.pow(i / barCount, 1.4) * (this.freqData.length * 0.7));
      const val = this.freqData[binIdx] / 255;
      const barHeight = val * (height * 0.7);

      const hue = 190 + (i / barCount) * 90; // cyan to purple gradient
      ctx.fillStyle = `hsla(${hue}, 85%, 55%, 0.75)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }

    // 2. Draw Oscilloscope waveform curve
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();

    const sliceWidth = width / this.timeData.length;
    let x = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const v = this.timeData[i] / 128.0;
      const y = (v * (height * 0.3)) + (height * 0.2);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }
    ctx.stroke();
  }
}
