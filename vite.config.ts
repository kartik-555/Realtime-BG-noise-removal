import { defineConfig } from 'vite';
import { noiseSuppressionAudioWorkletVitePlugin } from '@workadventure/noise-suppression/vite';

export default defineConfig({
  plugins: [noiseSuppressionAudioWorkletVitePlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  assetsInclude: ['**/*.wasm', '**/*.tar.gz', '**/*.tflite'],
  optimizeDeps: {
    exclude: ['@workadventure/noise-suppression', '@sapphi-red/web-noise-suppressor', '@shiguredo/rnnoise-wasm', 'deepfilternet3-noise-filter'],
  },
});
