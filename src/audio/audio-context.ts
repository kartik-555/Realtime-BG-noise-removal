/**
 * Centralized AudioContext and Hardware Capabilities Manager
 */

let sharedAudioContext48k: AudioContext | null = null;
let sharedAudioContext16k: AudioContext | null = null;

export function getAudioContext48k(): AudioContext {
  if (!sharedAudioContext48k || sharedAudioContext48k.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext48k = new AudioContextClass({
      sampleRate: 48000,
      latencyHint: 'interactive'
    });
  }
  return sharedAudioContext48k;
}

export function getAudioContext16k(): AudioContext {
  if (!sharedAudioContext16k || sharedAudioContext16k.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext16k = new AudioContextClass({
      sampleRate: 16000,
      latencyHint: 'interactive'
    });
  }
  return sharedAudioContext16k;
}

export async function ensureAudioContextResumed(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/**
 * Check browser and device hardware features:
 * WebAssembly SIMD, AudioWorklet, SharedArrayBuffer, Hardware Concurrency
 */
export async function detectDeviceCapabilities(): Promise<{
  hasSimd: boolean;
  hasAudioWorklet: boolean;
  hasSharedArrayBuffer: boolean;
  logicalCores: number;
  quantumBudgetMs: number;
  sampleRate: number;
}> {
  let hasSimd = false;
  try {
    // 0xFD is the SIMD prefix in WebAssembly
    hasSimd = WebAssembly.validate(new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
    ]));
  } catch {
    hasSimd = false;
  }

  const hasAudioWorklet = typeof window !== 'undefined' && 'audioWorklet' in AudioContext.prototype;
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const logicalCores = navigator.hardwareConcurrency || 4;

  // Real-time quantum budget for 128 samples at 48kHz is 128 / 48000 * 1000 = ~2.667 ms
  const quantumBudgetMs = Number(((128 / 48000) * 1000).toFixed(2));

  return {
    hasSimd,
    hasAudioWorklet,
    hasSharedArrayBuffer,
    logicalCores,
    quantumBudgetMs,
    sampleRate: 48000,
  };
}

/**
 * Check whether the file is a video container that may need its audio extracted before decoding.
 */
function isVideoLikeFile(file: File | Blob): boolean {
  const fileName = 'name' in file ? file.name : '';
  return file.type.startsWith('video/') || /\.(mp4|m4v|mov|avi|mkv|webm|wmv|flv|mpeg|mpg|m2ts|ts)$/i.test(fileName);
}

async function extractAudioFromVideoFile(file: File | Blob): Promise<Blob> {
  if (!(file instanceof File)) {
    throw new Error('Video audio extraction requires a browser File object.');
  }

  if (typeof MediaRecorder === 'undefined' || typeof HTMLMediaElement === 'undefined') {
    throw new Error('This browser does not support extracting audio from video uploads.');
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;
  video.crossOrigin = 'anonymous';

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('The selected video could not be loaded.'));
    });

    const mediaElement = video as HTMLMediaElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const captureStream = mediaElement.captureStream?.bind(video) ?? mediaElement.mozCaptureStream?.bind(video);
    const stream = captureStream ? captureStream() : null;

    if (!stream || stream.getAudioTracks().length === 0) {
      throw new Error('This video file does not contain an audio track.');
    }

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream);

    const stopPromise = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onerror = () => reject(new Error('Unable to read the audio stream from this video file.'));
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
    });

    recorder.start();
    await video.play();

    await new Promise<void>((resolve, reject) => {
      video.onended = () => resolve();
      video.onerror = () => reject(new Error('The selected video could not be played for audio extraction.'));
    });

    recorder.stop();
    return await stopPromise;
  } finally {
    video.pause();
    video.src = '';
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Decode any uploaded file (WAV, MP3, M4A, OGG, MP4 video audio, etc.) into an AudioBuffer resampled to 48kHz.
 */
export async function decodeAudioFile(file: File | Blob, targetSampleRate = 48000): Promise<AudioBuffer> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tempCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const rawBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
    await tempCtx.close();

    if (rawBuffer.sampleRate === targetSampleRate && rawBuffer.numberOfChannels === 1) {
      return rawBuffer;
    }

    // Resample and convert to mono (interview speech standard)
    return resampleAndMono(rawBuffer, targetSampleRate);
  } catch (error) {
    if (isVideoLikeFile(file)) {
      try {
        const extractedAudio = await extractAudioFromVideoFile(file);
        return decodeAudioFile(extractedAudio, targetSampleRate);
      } catch {
        // If we cannot extract audio from a supported video file, rethrow the original decode error.
      }
    }

    throw error;
  }
}

/**
 * Resample an AudioBuffer to target sample rate and downmix to mono
 */
export function resampleAndMono(buffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
  return new Promise((resolve) => {
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil((buffer.duration * targetSampleRate)),
      targetSampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    offlineCtx.startRendering().then(resolve);
  });
}
