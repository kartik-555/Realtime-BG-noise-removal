import { MicVAD as e } from "@ricky0123/vad-web";
//#region \0virtual:background-noise-detector-silero-assets
var t = [
	new URL("vendor/silero/vad.worklet.bundle.min.js", import.meta.url).href,
	new URL("vendor/silero/silero_vad_legacy.onnx", import.meta.url).href,
	new URL("vendor/silero/silero_vad_v5.onnx", import.meta.url).href
], n = [
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.asyncify.mjs", import.meta.url).href,
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.asyncify.wasm", import.meta.url).href,
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.jsep.mjs", import.meta.url).href,
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.jsep.wasm", import.meta.url).href,
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.jspi.mjs", import.meta.url).href,
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.jspi.wasm", import.meta.url).href,
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.mjs", import.meta.url).href,
	new URL("vendor/onnxruntime/ort-wasm-simd-threaded.wasm", import.meta.url).href
], r = a(t[0]), i = a(n[0]);
function a(e) {
	return e.slice(0, e.lastIndexOf("/") + 1);
}
//#endregion
//#region src/background-noise/detector.ts
var o = {
	triggerRms: .01,
	noisyRms: .02,
	analysisWindowMs: 1500,
	maxSpeechFrameRatio: .75,
	speechProbabilityThreshold: .3,
	maxAverageSpeechProbability: .5,
	cooldownMs: 15e3
}, s = class {
	options;
	candidateWindow = null;
	lastEventTimestampMs = null;
	elapsedMs = 0;
	constructor(e = {}) {
		this.options = c(e);
	}
	processFrame(e, t) {
		let n = t.durationMs, r = this.resolveTimestampMs(n, t.timestampMs), i = p(t, this.options), a = l(e), o = {
			isSpeech: i >= this.options.speechProbabilityThreshold,
			speechProbability: i,
			rms: a,
			rmsDb: u(a),
			durationMs: n
		};
		if (this.isCoolingDown(r)) return this.candidateWindow = null, {
			frame: o,
			event: null
		};
		if (this.candidateWindow === null) {
			if (o.isSpeech || o.rms < this.options.triggerRms) return {
				frame: o,
				event: null
			};
			this.candidateWindow = d();
		}
		if (f(this.candidateWindow, o, this.options.triggerRms), this.candidateWindow.durationMs < this.options.analysisWindowMs) return {
			frame: o,
			event: null
		};
		let s = this.evaluateCandidateWindow(this.candidateWindow, r);
		return this.candidateWindow = null, s !== null && (this.lastEventTimestampMs = r), {
			frame: o,
			event: s
		};
	}
	reset() {
		this.candidateWindow = null, this.lastEventTimestampMs = null, this.elapsedMs = 0;
	}
	resolveTimestampMs(e, t) {
		return t === void 0 ? (this.elapsedMs += e, this.elapsedMs) : (this.elapsedMs = t, this.elapsedMs);
	}
	isCoolingDown(e) {
		return this.lastEventTimestampMs !== null && e - this.lastEventTimestampMs < this.options.cooldownMs;
	}
	evaluateCandidateWindow(e, t) {
		let n = e.rmsSum / e.totalFrames, r = e.speechFrames / e.totalFrames, i = e.speechProbabilitySum / e.totalFrames;
		return n < this.options.noisyRms || r > this.options.maxSpeechFrameRatio || i > this.options.maxAverageSpeechProbability ? null : {
			type: "background-noise-detected",
			rms: n,
			rmsDb: u(n),
			speechFrameRatio: r,
			voiceFrameRatio: r,
			averageSpeechProbability: i,
			maxSpeechProbability: e.maxSpeechProbability,
			activeFrameRatio: e.activeFrames / e.totalFrames,
			windowMs: e.durationMs,
			timestampMs: t
		};
	}
};
function c(e = {}) {
	let t = e.maxSpeechFrameRatio ?? e.maxVoiceFrameRatio ?? o.maxSpeechFrameRatio, n = {
		...o,
		...e,
		maxSpeechFrameRatio: t
	};
	return g(n.triggerRms, "triggerRms"), g(n.noisyRms, "noisyRms"), h(n.analysisWindowMs, "analysisWindowMs"), m(n.maxSpeechFrameRatio, "maxSpeechFrameRatio"), m(n.speechProbabilityThreshold, "speechProbabilityThreshold"), m(n.maxAverageSpeechProbability, "maxAverageSpeechProbability"), g(n.cooldownMs, "cooldownMs"), n;
}
function l(e) {
	if (e.length === 0) throw Error("Cannot calculate RMS for an empty audio frame.");
	let t = 0;
	for (let n = 0; n < e.length; n++) {
		let r = e[n] ?? 0;
		Number.isFinite(r) && (t += r * r);
	}
	return Math.sqrt(t / e.length);
}
function u(e) {
	return 20 * Math.log10(Math.max(e, Number.MIN_VALUE));
}
function d() {
	return {
		totalFrames: 0,
		speechFrames: 0,
		activeFrames: 0,
		speechProbabilitySum: 0,
		maxSpeechProbability: 0,
		rmsSum: 0,
		durationMs: 0
	};
}
function f(e, t, n) {
	e.totalFrames++, e.speechFrames += +!!t.isSpeech, e.activeFrames += +(t.rms >= n), e.speechProbabilitySum += t.speechProbability, e.maxSpeechProbability = Math.max(e.maxSpeechProbability, t.speechProbability), e.rmsSum += t.rms, e.durationMs += t.durationMs;
}
function p(e, t) {
	return e.speechProbability === void 0 ? e.isVoice === !0 ? t.speechProbabilityThreshold : 0 : e.speechProbability;
}
function m(e, t) {
	if (_(e, t), e < 0 || e > 1) throw Error(`${t} must be between 0 and 1.`);
	return e;
}
function h(e, t) {
	if (_(e, t), e <= 0) throw Error(`${t} must be greater than 0.`);
	return e;
}
function g(e, t) {
	if (_(e, t), e < 0) throw Error(`${t} must be greater than or equal to 0.`);
	return e;
}
function _(e, t) {
	if (!Number.isFinite(e)) throw Error(`${t} must be finite.`);
	return e;
}
//#endregion
//#region src/background-noise.ts
var v = "v5", y = 16e3, b = {
	v5: 512,
	legacy: 1536
}, x = /* @__PURE__ */ new WeakMap();
async function S(t, n, a = {}) {
	let o = a.sileroModel ?? v, c = b[o], l = new s(T(a)), u = new EventTarget(), d = !1, f = await e.new({
		audioContext: t,
		baseAssetPath: a.baseAssetPath ?? r,
		onnxWASMBasePath: a.onnxWASMBasePath ?? i,
		model: o,
		processorType: a.processorType ?? "AudioWorklet",
		startOnLoad: !0,
		getStream: async () => n,
		pauseStream: async () => void 0,
		resumeStream: async () => n,
		onFrameProcessed: (e, t) => {
			if (d) return;
			let n = l.processFrame(t, {
				speechProbability: e.isSpeech,
				durationMs: t.length / y * 1e3
			});
			n.event !== null && D(u, n.event);
		},
		onSpeechStart: () => void 0,
		onSpeechRealStart: () => void 0,
		onSpeechEnd: () => void 0,
		onVADMisfire: () => void 0,
		...E(a)
	}), p = {
		type: "ready",
		sampleRate: y,
		frameSamples: c,
		frameDurationMs: c / y * 1e3,
		sileroModel: o
	}, m = {
		ready: Promise.resolve(p),
		dispose() {
			d || (d = !0, l.reset(), f.destroy().catch(() => void 0));
		}
	};
	return x.set(m, u), m;
}
function C(e, t) {
	let n = x.get(e);
	if (!n) return () => void 0;
	let r = (e) => {
		t(e.detail);
	};
	return n.addEventListener("message", r), () => {
		n.removeEventListener("message", r);
	};
}
function w(e) {
	return e.type === "background-noise-detected";
}
function T(e) {
	return {
		triggerRms: e.triggerRms ?? o.triggerRms,
		noisyRms: e.noisyRms ?? o.noisyRms,
		analysisWindowMs: e.analysisWindowMs ?? o.analysisWindowMs,
		maxSpeechFrameRatio: e.maxSpeechFrameRatio ?? e.maxVoiceFrameRatio ?? o.maxSpeechFrameRatio,
		speechProbabilityThreshold: e.speechProbabilityThreshold ?? e.positiveSpeechThreshold ?? o.speechProbabilityThreshold,
		maxAverageSpeechProbability: e.maxAverageSpeechProbability ?? o.maxAverageSpeechProbability,
		cooldownMs: e.cooldownMs ?? o.cooldownMs
	};
}
function E(e) {
	let t = {};
	return e.positiveSpeechThreshold !== void 0 && (t.positiveSpeechThreshold = e.positiveSpeechThreshold), e.negativeSpeechThreshold !== void 0 && (t.negativeSpeechThreshold = e.negativeSpeechThreshold), e.redemptionMs !== void 0 && (t.redemptionMs = e.redemptionMs), e.preSpeechPadMs !== void 0 && (t.preSpeechPadMs = e.preSpeechPadMs), e.minSpeechMs !== void 0 && (t.minSpeechMs = e.minSpeechMs), t;
}
function D(e, t) {
	e.dispatchEvent(new CustomEvent("message", { detail: t }));
}
//#endregion
export { S as createBackgroundNoiseDetector, w as isBackgroundNoiseDetectedMessage, C as observeBackgroundNoiseDetectorMessages };

//# sourceMappingURL=background-noise.js.map