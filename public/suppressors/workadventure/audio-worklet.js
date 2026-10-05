import { a as e, t } from "./browser-runtime-options-D2tvA7U3.js";
import { t as n } from "./audio-worklet-dev-module-url-C7kts-WI.js";
//#region \0virtual:noise-suppression-audio-worklet-module-url
var r = new URL("assets/audio-worklet-processor.js", import.meta.url).href, i = "workadventure-noise-suppression", a = 3e4, o = /* @__PURE__ */ new WeakMap(), s = new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	5,
	1,
	96,
	0,
	1,
	123,
	3,
	2,
	1,
	0,
	10,
	15,
	1,
	13,
	0,
	65,
	1,
	253,
	15,
	65,
	2,
	253,
	15,
	253,
	128,
	2,
	11
]);
function c() {
	try {
		return WebAssembly.validate(s) ? "relaxed" : "compat";
	} catch {
		return "compat";
	}
}
var l = /* @__PURE__ */ new Map();
async function u(t) {
	let n = e(t), r = await fetch(n);
	if (!r.ok) throw Error(`Failed to load LiteRT Wasm (${t}) from ${n}: ${r.status} ${r.statusText}`);
	return r.arrayBuffer();
}
function d(e) {
	let t = l.get(e);
	return t || (t = u(e).catch((t) => {
		throw l.delete(e), t;
	}), l.set(e, t)), t;
}
function f(e, t) {
	let n = o.get(e);
	n || (n = /* @__PURE__ */ new Map(), o.set(e, n));
	let r = n.get(t);
	if (r) return r;
	let i = e.audioWorklet.addModule(t);
	return n.set(t, i), i;
}
function p(e) {
	return e.type === "ready";
}
function m(e) {
	return e.type === "error";
}
function h(e) {
	return e.type === "benchmark-complete";
}
function g(e, t) {
	return new Promise((n, r) => {
		let i = globalThis.setTimeout(() => {
			s(), r(/* @__PURE__ */ Error("Timed out waiting for the noise suppression worklet to initialize."));
		}, t), a = (e) => {
			let t = e.data;
			if (p(t)) {
				s(), n(t);
				return;
			}
			m(t) && (s(), r(Error(t.message)));
		}, o = () => {
			s(), r(/* @__PURE__ */ Error("The noise suppression AudioWorklet processor failed."));
		}, s = () => {
			globalThis.clearTimeout(i), e.port.removeEventListener("message", a), e.removeEventListener("processorerror", o);
		};
		e.port.addEventListener("message", a), e.port.start(), e.addEventListener("processorerror", o);
	});
}
async function _(e, n = {}) {
	let o = n.moduleUrl ?? r, s = n.readyTimeoutMs ?? a, l = n.threads === !0, u = t(n.numThreads), p = n.bypassUntilReady ?? !0, m = c(), [, h] = await Promise.all([f(e, o), d(m)]), _ = {
		threads: l,
		numThreads: u,
		bypassUntilReady: p,
		liteRtVariant: m,
		liteRtWasmBinary: h
	}, v = new AudioWorkletNode(e, i, {
		channelCount: 1,
		channelCountMode: "explicit",
		numberOfInputs: 1,
		numberOfOutputs: 1,
		outputChannelCount: [1],
		processorOptions: _
	});
	return {
		node: v,
		ready: g(v, s),
		moduleUrl: o,
		processorName: i,
		dispose() {
			v.port.postMessage({ type: "dispose" }), v.disconnect();
		}
	};
}
function v(e, t) {
	let n = (e) => {
		t(e.data);
	};
	return e.node.port.addEventListener("message", n), e.node.port.start(), () => {
		e.node.port.removeEventListener("message", n);
	};
}
function y(e) {
	return e.type === "processing-started";
}
async function b(e, t = {}) {
	let n = t.warmupIterations ?? 40, r = t.benchmarkIterations ?? 300;
	return await e.ready, new Promise((t, i) => {
		let a = (e) => {
			let n = e.data;
			if (h(n)) {
				s(), t(n);
				return;
			}
			m(n) && (s(), i(Error(n.message)));
		}, o = () => {
			s(), i(/* @__PURE__ */ Error("The noise suppression AudioWorklet processor failed."));
		}, s = () => {
			e.node.port.removeEventListener("message", a), e.node.removeEventListener("processorerror", o);
		};
		e.node.port.addEventListener("message", a), e.node.port.start(), e.node.addEventListener("processorerror", o);
		let c = {
			type: "start-benchmark",
			warmupIterations: n,
			benchmarkIterations: r
		};
		e.node.port.postMessage(c);
	});
}
//#endregion
export { n as NOISE_SUPPRESSION_AUDIO_WORKLET_DEV_MODULE_URL, i as NOISE_SUPPRESSION_AUDIO_WORKLET_PROCESSOR_NAME, _ as createNoiseSuppressionAudioWorklet, y as isNoiseSuppressionProcessingStartedMessage, v as observeNoiseSuppressionAudioWorkletMessages, b as runNoiseSuppressionAudioWorkletBenchmark };

//# sourceMappingURL=audio-worklet.js.map