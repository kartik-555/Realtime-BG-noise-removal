import { type RealTimeVADOptions } from "@ricky0123/vad-web";
import type { BackgroundNoiseDetectedMessage } from "./background-noise/detector";
export type BackgroundNoiseDetectorSileroModel = "v5" | "legacy";
export interface BackgroundNoiseDetectorRuntimeOptions {
    sileroModel?: BackgroundNoiseDetectorSileroModel;
    baseAssetPath?: string;
    onnxWASMBasePath?: string;
    positiveSpeechThreshold?: number;
    negativeSpeechThreshold?: number;
    redemptionMs?: number;
    preSpeechPadMs?: number;
    minSpeechMs?: number;
    processorType?: RealTimeVADOptions["processorType"];
    triggerRms?: number;
    noisyRms?: number;
    analysisWindowMs?: number;
    maxSpeechFrameRatio?: number;
    maxVoiceFrameRatio?: number;
    speechProbabilityThreshold?: number;
    maxAverageSpeechProbability?: number;
    cooldownMs?: number;
}
export interface BackgroundNoiseDetectorReadyMessage {
    type: "ready";
    sampleRate: number;
    frameSamples: number;
    frameDurationMs: number;
    sileroModel: BackgroundNoiseDetectorSileroModel;
}
export interface BackgroundNoiseDetectorErrorMessage {
    type: "error";
    message: string;
    stack?: string;
}
export type BackgroundNoiseDetectorOutboundMessage = BackgroundNoiseDetectorReadyMessage | BackgroundNoiseDetectorErrorMessage | BackgroundNoiseDetectedMessage;
export interface BackgroundNoiseDetectorHandle {
    ready: Promise<BackgroundNoiseDetectorReadyMessage>;
    dispose(): void;
}
export declare function createBackgroundNoiseDetector(context: AudioContext, stream: MediaStream, options?: BackgroundNoiseDetectorRuntimeOptions): Promise<BackgroundNoiseDetectorHandle>;
export declare function observeBackgroundNoiseDetectorMessages(handle: BackgroundNoiseDetectorHandle, listener: (message: BackgroundNoiseDetectorOutboundMessage) => void): () => void;
export declare function isBackgroundNoiseDetectedMessage(message: BackgroundNoiseDetectorOutboundMessage): message is BackgroundNoiseDetectedMessage;
export type { BackgroundNoiseDetectedMessage };
//# sourceMappingURL=background-noise.d.ts.map