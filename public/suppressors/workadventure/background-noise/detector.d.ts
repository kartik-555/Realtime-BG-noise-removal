export interface BackgroundNoiseDetectorOptions {
    triggerRms?: number;
    noisyRms?: number;
    analysisWindowMs?: number;
    maxSpeechFrameRatio?: number;
    maxVoiceFrameRatio?: number;
    speechProbabilityThreshold?: number;
    maxAverageSpeechProbability?: number;
    cooldownMs?: number;
}
export interface ResolvedBackgroundNoiseDetectorOptions {
    triggerRms: number;
    noisyRms: number;
    analysisWindowMs: number;
    maxSpeechFrameRatio: number;
    speechProbabilityThreshold: number;
    maxAverageSpeechProbability: number;
    cooldownMs: number;
}
export interface BackgroundNoiseDetectorFrameInput {
    speechProbability?: number;
    isVoice?: boolean;
    durationMs: number;
    timestampMs?: number;
}
export interface BackgroundNoiseDetectorFrameResult {
    isSpeech: boolean;
    speechProbability: number;
    rms: number;
    rmsDb: number;
    durationMs: number;
}
export interface BackgroundNoiseDetectedMessage {
    type: "background-noise-detected";
    rms: number;
    rmsDb: number;
    speechFrameRatio: number;
    voiceFrameRatio: number;
    averageSpeechProbability: number;
    maxSpeechProbability: number;
    activeFrameRatio: number;
    windowMs: number;
    timestampMs: number;
}
export interface BackgroundNoiseDetectorProcessResult {
    frame: BackgroundNoiseDetectorFrameResult;
    event: BackgroundNoiseDetectedMessage | null;
}
export declare const DEFAULT_BACKGROUND_NOISE_DETECTOR_OPTIONS: ResolvedBackgroundNoiseDetectorOptions;
export declare class BackgroundNoiseDetector {
    readonly options: ResolvedBackgroundNoiseDetectorOptions;
    private candidateWindow;
    private lastEventTimestampMs;
    private elapsedMs;
    constructor(options?: BackgroundNoiseDetectorOptions);
    processFrame(frame: Float32Array, input: BackgroundNoiseDetectorFrameInput): BackgroundNoiseDetectorProcessResult;
    reset(): void;
    private resolveTimestampMs;
    private isCoolingDown;
    private evaluateCandidateWindow;
}
export declare function resolveBackgroundNoiseDetectorOptions(options?: BackgroundNoiseDetectorOptions): ResolvedBackgroundNoiseDetectorOptions;
export declare function calculateRms(frame: Float32Array): number;
export declare function rmsToDbfs(rms: number): number;
//# sourceMappingURL=detector.d.ts.map