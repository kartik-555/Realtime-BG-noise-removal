import { i as e, n as t, o as n, r, t as i } from "./browser-runtime-options-D2tvA7U3.js";
import a from "fft.js";
//#region forks/litertjs-wasm-utils/index.js
async function o(e) {
	if (typeof importScripts == "function") importScripts(e.toString());
	else {
		let t = document.createElement("script");
		return t.src = e.toString(), t.crossOrigin = "anonymous", new Promise((e, n) => {
			t.addEventListener("load", () => {
				e();
			}, !1), t.addEventListener("error", (e) => {
				n(e);
			}, !1), document.body.appendChild(t);
		});
	}
}
var s = async (e, t, n, r, i) => {
	let a = t, s;
	if (typeof t == "object" && t && (a = t.wasmLoaderScript, n = t.assetLoaderScript, r = t.glCanvas, i = t.fileLocator, s = t.moduleFactory), s) return new e(await s(i), r);
	if (a && await o(a), !self.ModuleFactory || n && (await o(n), !self.ModuleFactory)) throw Error("ModuleFactory not set.");
	if (self.Module && i) {
		let e = self.Module;
		e.locateFile = i.locateFile, i.mainScriptUrlOrBlob && (e.mainScriptUrlOrBlob = i.mainScriptUrlOrBlob);
	}
	let c = await self.ModuleFactory(self.Module || i);
	return self.ModuleFactory = self.Module = void 0, new e(c, r);
}, c = {
	NONE: 0,
	FLOAT32: 1,
	INT32: 2,
	UINT8: 3,
	INT64: 4,
	STRING: 5,
	BOOL: 6,
	INT16: 7,
	COMPLEX64: 8,
	INT8: 9,
	FLOAT16: 10,
	FLOAT64: 11,
	COMPLEX128: 12,
	UINT64: 13,
	RESOURCE: 14,
	VARIANT: 15,
	UINT32: 16,
	UINT16: 17,
	INT4: 18,
	BFLOAT16: 19
}, l = {
	[c.NONE]: "NONE",
	[c.FLOAT32]: "FLOAT32",
	[c.INT32]: "INT32",
	[c.UINT8]: "UINT8",
	[c.INT64]: "INT64",
	[c.STRING]: "STRING",
	[c.BOOL]: "BOOL",
	[c.INT16]: "INT16",
	[c.COMPLEX64]: "COMPLEX64",
	[c.INT8]: "INT8",
	[c.FLOAT16]: "FLOAT16",
	[c.FLOAT64]: "FLOAT64",
	[c.COMPLEX128]: "COMPLEX128",
	[c.UINT64]: "UINT64",
	[c.RESOURCE]: "RESOURCE",
	[c.VARIANT]: "VARIANT",
	[c.UINT32]: "UINT32",
	[c.UINT16]: "UINT16",
	[c.INT4]: "INT4",
	[c.BFLOAT16]: "BFLOAT16"
}, u = {
	HOST_MEMORY: 1,
	WEB_GPU_BUFFER: 20,
	WEB_GPU_BUFFER_FP16: 21,
	WEB_GPU_BUFFER_PACKED: 26
}, d = {
	[u.HOST_MEMORY]: "HOST_MEMORY",
	[u.WEB_GPU_BUFFER]: "WEB_GPU_BUFFER",
	[u.WEB_GPU_BUFFER_FP16]: "WEB_GPU_BUFFER_FP16",
	[u.WEB_GPU_BUFFER_PACKED]: "WEB_GPU_BUFFER_PACKED"
}, f = Object.freeze([
	{
		dtype: "float32",
		typedArrayConstructor: Float32Array,
		elementType: c.FLOAT32
	},
	{
		dtype: "int32",
		typedArrayConstructor: Int32Array,
		elementType: c.INT32
	},
	{
		dtype: "uint8",
		typedArrayConstructor: Uint8Array,
		elementType: c.UINT8
	}
]);
function p(e) {
	for (let t of f) if (t.dtype === e || t.typedArrayConstructor === e || e instanceof t.typedArrayConstructor || t.elementType === e) return t;
	throw typeof e == "string" ? Error(`DType ${e} is not supported.`) : e instanceof Object ? Error(`Typed array ${"name" in e ? e.name : e.constructor.name} is not supported.`) : Error(`Element type ${l[e] ?? e} is not supported.`);
}
var m = class extends Error {
	constructor() {
		super("LiteRT is not initialized yet. Please call loadLiteRt() and wait for its promise to resolve to load the LiteRT WASM module.");
	}
}, h = void 0, g = void 0;
function _() {
	if (!h) throw new m();
	return h;
}
function ee(e) {
	h = e;
}
function v() {
	return g;
}
function te() {
	return !!g;
}
function y(e) {
	g = e;
}
var ne = {
	webgpu: u.WEB_GPU_BUFFER_PACKED,
	wasm: u.HOST_MEMORY
}, re = {
	[u.HOST_MEMORY]: "wasm",
	[u.WEB_GPU_BUFFER]: "webgpu",
	[u.WEB_GPU_BUFFER_FP16]: "webgpu",
	[u.WEB_GPU_BUFFER_PACKED]: "webgpu"
}, ie = ["shader-f16", "subgroups"], b = class e {
	constructor(e) {
		this.options = e, this.liteRtEnvironment = _().liteRtWasm.LiteRtEnvironment.create(e.webGpuDevice);
	}
	liteRtEnvironment;
	static async create(t = {}) {
		let n = null;
		if ("webGpuDevice" in t) t.webGpuDevice && (n = t.webGpuDevice);
		else try {
			n = await ae();
		} catch (e) {
			console.warn("Failed to create default WebGPU device:", e);
		}
		return new e({
			...t,
			webGpuDevice: n
		});
	}
	get webGpuDevice() {
		return this.options.webGpuDevice;
	}
	delete() {
		this.liteRtEnvironment.delete();
	}
};
async function ae() {
	let e = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
	if (!e) throw Error("No GPU adapter found.");
	let t = {
		maxBufferSize: e.limits.maxBufferSize,
		maxStorageBufferBindingSize: e.limits.maxStorageBufferBindingSize,
		maxStorageBuffersPerShaderStage: e.limits.maxStorageBuffersPerShaderStage,
		maxTextureDimension2D: e.limits.maxTextureDimension2D
	}, n = [];
	for (let t of ie) e.features.has(t) && n.push(t);
	return await e.requestDevice({
		requiredFeatures: n,
		requiredLimits: t
	});
}
function x(e) {
	let t = Array(e.size());
	for (let n = 0; n < e.size(); ++n) t[n] = e.get(n);
	return e.delete(), t;
}
function S(e, t) {
	for (let n of e) t.push_back(n);
}
function oe(e) {
	let t = e.shift();
	if (t instanceof _().liteRtWasm.LiteRtTensorBuffer) return { liteRtTensorBuffer: t };
	if (ArrayBuffer.isView(t)) return { typedArray: t };
	if (t instanceof GPUBuffer) return { gpuBuffer: t };
	throw Error(`Unknown type (${t?.constructor.name ?? t}) provided to create a Tensor`);
}
function se(e) {
	return Array.isArray(e[0]) || e[0] instanceof Int32Array ? { shape: e.shift() } : {};
}
function C(e) {
	for (; e.length > 0 && e[0] === void 0;) e.shift();
}
function ce(e) {
	return C(e), typeof e[0] == "string" ? { dataType: p(e.shift()).dtype } : {};
}
function le(e) {
	return C(e), e[0] instanceof b ? { environment: e.shift() } : {};
}
function ue(e) {
	return C(e), e[0] instanceof Function ? { onDelete: e.shift() } : {};
}
function de(e) {
	return {
		...oe(e),
		...se(e),
		...ce(e),
		...le(e),
		...ue(e)
	};
}
var w = class e {
	liteRtTensorBuffer;
	type;
	environment;
	deletedInternal = !1;
	onDelete;
	static copyFunctions = /* @__PURE__ */ new Map();
	constructor(e, t, n, r, i) {
		let { typedArray: a, gpuBuffer: o, liteRtTensorBuffer: s, shape: c, dataType: l, environment: u, onDelete: d } = de([
			e,
			t,
			n,
			r,
			i
		]);
		if (this.onDelete = d, this.environment = u ?? _().getDefaultEnvironment(), s) {
			if (c) throw Error("A LiteRtTensorBuffer cannot be provided with a shape.");
			if (l) throw Error("A LiteRtTensorBuffer cannot be provided with a data type.");
			this.liteRtTensorBuffer = s;
		} else if (o) {
			if (!c) throw Error("A GPUBuffer must be provided with a shape.");
			if (!l) throw Error("A GPUBuffer must be provided with a data type.");
			let [e, t] = pe(o, c, l, this.environment);
			this.liteRtTensorBuffer = e;
			let n = this.onDelete;
			this.onDelete = () => {
				_().liteRtWasm.wgpuBufferRelease(t), n?.();
			};
		} else if (a) this.liteRtTensorBuffer = me(a, c, u);
		else throw Error("No data provided to create a Tensor.");
		this.type = fe(this.liteRtTensorBuffer);
	}
	static fromTypedArray(t, n, r) {
		return new e(t, n, r);
	}
	ensureNotDeleted() {
		if (this.deleted) throw Error("Tensor is deleted and cannot be used.");
	}
	async data() {
		if (this.ensureNotDeleted(), this.liteRtTensorBuffer.bufferType().value === u.HOST_MEMORY) return this.toTypedArray();
		let e = await this.copyTo("wasm"), t = await e.data();
		return e.delete(), t;
	}
	toTypedArray() {
		this.ensureNotDeleted();
		let e = _().liteRtWasm;
		if (this.liteRtTensorBuffer.isWebGpuMemory()) throw Error("Cannot convert a Tensor with WebGPU memory to a TypedArray.");
		if (this.liteRtTensorBuffer.bufferType().value !== e.LiteRtTensorBufferType.HOST_MEMORY.value) throw Error("Cannot convert a Tensor with non-host memory to a TypedArray.");
		if (this.liteRtTensorBuffer.size() !== this.liteRtTensorBuffer.packedSize() || this.liteRtTensorBuffer.offset() !== 0) throw Error("Tensors with strides or padding are not yet supported.");
		let t = this.liteRtTensorBuffer.tensorType(), n = t.elementType(), r = e.liteRtGetByteWidth(n);
		t.delete();
		let i = p(n.value).typedArrayConstructor;
		if (i.BYTES_PER_ELEMENT !== r) throw Error(`Byte width ${r} of the tensor's element type ${l[n.value]} does not match the expected byte width ${i.BYTES_PER_ELEMENT} of the ${i.name}.`);
		let a = this.liteRtTensorBuffer.lock(_().liteRtWasm.LiteRtTensorBufferLockMode.READ);
		try {
			let t = e.HEAPU8.slice(a, a + this.liteRtTensorBuffer.packedSize());
			return new i(t.buffer, t.byteOffset, t.byteLength / r);
		} finally {
			this.liteRtTensorBuffer.unlock();
		}
	}
	getBufferType() {
		return this.ensureNotDeleted(), this.liteRtTensorBuffer.bufferType().value;
	}
	toGpuBuffer() {
		this.ensureNotDeleted();
		let e = _().liteRtWasm;
		if (!this.liteRtTensorBuffer.isWebGpuMemory()) throw Error("Cannot convert a Tensor with non-WebGPU memory to a GPUBuffer.");
		let t = this.liteRtTensorBuffer.bufferType().value;
		if (t !== e.LiteRtTensorBufferType.WEB_GPU_BUFFER.value && t !== e.LiteRtTensorBufferType.WEB_GPU_BUFFER_FP16.value && t !== e.LiteRtTensorBufferType.WEB_GPU_BUFFER_PACKED.value) throw Error("Cannot convert a Tensor with host memory to a GPUBuffer.");
		if (this.liteRtTensorBuffer.size() !== this.liteRtTensorBuffer.packedSize() || this.liteRtTensorBuffer.offset() !== 0) throw Error("Tensors with strides or padding are not yet supported.");
		let n = this.liteRtTensorBuffer.getWebGpuBuffer();
		return e.WebGPU.getJsObject(n);
	}
	getCopyFunctionSet(t) {
		this.ensureNotDeleted();
		let n = this.getBufferType(), r = e.copyFunctions.get(n);
		if (!r) throw Error(`TensorBufferType ${d[n] ?? n} does not support copying or moving`);
		let i = typeof t == "string" ? ne[t] : t;
		if (i == null) throw Error(`Unknown destination '${t}' for copying or moving.`);
		let a = r.get(i);
		if (!a) {
			let e = [...r].map(([e]) => d[e] ?? e);
			throw Error(`TensorBufferType ${d[n]} does not support copying or moving to ${d[i]}. It supports the following TensorBufferTypes: [${e.join(", ")}].`);
		}
		return [a, i];
	}
	async copyTo(e, t) {
		let [n, r] = this.getCopyFunctionSet(e);
		if (!n.copyTo) throw Error(`Copying to ${d[r]} is not supported by this tensor.`);
		return n.copyTo(this, t);
	}
	async moveTo(e, t) {
		let [n, r] = this.getCopyFunctionSet(e);
		if (!n.moveTo) throw Error(`Moving to ${d[r]} is not supported by this tensor.`);
		return n.moveTo(this, t);
	}
	get bufferType() {
		return this.liteRtTensorBuffer.bufferType().value;
	}
	get accelerator() {
		let e = re[this.bufferType];
		if (e === void 0) throw Error(`TensorBufferType ${d[this.bufferType]} has an unknown accelerator type.`);
		return e;
	}
	get deleted() {
		return this.deletedInternal;
	}
	delete() {
		this.deletedInternal || (this.deletedInternal = !0, this.liteRtTensorBuffer.delete(), this.onDelete?.());
	}
};
function fe(e) {
	let t = e.tensorType(), n = t.elementType(), r = t.layout(), i = r.dimensions();
	return r.delete(), t.delete(), {
		dtype: p(n.value).dtype,
		layout: { dimensions: x(i) }
	};
}
function pe(e, t, n, r) {
	let i = _().liteRtWasm, a = new i.VectorInt32();
	S(t, a);
	let o = i.LiteRtLayout.create(a);
	a.delete();
	let s = i.LiteRtRankedTensorType.create({ value: p(n).elementType }, o);
	o.delete();
	let c = i.WebGPU.importJsBuffer(e), l = i.LiteRtTensorBuffer.createFromWebGpuBuffer(r.liteRtEnvironment, s, i.LiteRtTensorBufferType.WEB_GPU_BUFFER_PACKED, c, e.size);
	return s.delete(), [l, c];
}
function me(e, t, n) {
	let r = _(), i = r.liteRtWasm;
	n ??= r.getDefaultEnvironment();
	let a = p(e).elementType, o = new i.VectorInt32();
	S(t ?? [e.length], o);
	let s = i.LiteRtLayout.create(o);
	o.delete();
	let c = s.numElements();
	if (e.length !== c) throw s.delete(), Error(`Number of elements ${e.length} of the provided TypedArray does not match the expected number of elements ${c}.`);
	let l = i.LiteRtRankedTensorType.create({ value: a }, s);
	s.delete();
	let u = e.constructor.BYTES_PER_ELEMENT * e.length, d = l.bytes();
	if (u !== d) throw l.delete(), Error(`Byte length ${u} of the provided TypedArray does not match the expected buffer size ${d}.`);
	let f = i.LiteRtTensorBuffer.createManaged(n.liteRtEnvironment, i.LiteRtTensorBufferType.HOST_MEMORY, l, u);
	l.delete();
	let m = f.lock(i.LiteRtTensorBufferLockMode.WRITE);
	try {
		let t = new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
		i.HEAPU8.set(t, m);
	} finally {
		f.unlock();
	}
	return f;
}
var he = class {
	constructor(e, t, n, r) {
		this.signatureIndex = e, this.liteRtModel = t, this.liteRtCompiledModel = n, this.options = r, this.liteRtSimpleSignature = t.getSignature(e);
		let i = x(this.liteRtSimpleSignature.inputNames()), a = [];
		for (let r = 0; r < i.length; r++) {
			let o = i[r], s = t.getInputTensorType(e, r), c = n.getInputBufferRequirements(e, r);
			a.push(T(o, r, s, c));
		}
		this.inputDetails = Object.freeze(a);
		let o = x(this.liteRtSimpleSignature.outputNames()), s = [];
		for (let r = 0; r < o.length; r++) {
			let i = o[r], a = t.getOutputTensorType(e, r), c = n.getOutputBufferRequirements(e, r);
			s.push(T(i, r, a, c));
		}
		this.outputDetails = Object.freeze(s);
	}
	inputDetails;
	outputDetails;
	liteRtSimpleSignature;
	deletedInternal = !1;
	get key() {
		return this.ensureNotDeleted(), this.liteRtSimpleSignature.key();
	}
	getInputDetails() {
		return this.ensureNotDeleted(), this.inputDetails;
	}
	getOutputDetails() {
		return this.ensureNotDeleted(), this.outputDetails;
	}
	async run(e) {
		this.ensureNotDeleted();
		let t = this.inputsToArray(e), { inputsOnAccelerator: n, cleanup: r } = await this.ensureInputsOnAccelerator(t), i;
		try {
			i = await this.runWithArray(n);
		} finally {
			r();
		}
		return Array.isArray(e) || e instanceof w ? i : this.outputsToRecord(i);
	}
	inputsToArray(e) {
		if (Array.isArray(e)) {
			if (e.length !== this.inputDetails.length) throw Error(`run() called with ${e.length} inputs, but signature expects ${this.inputDetails.length} inputs`);
			return e;
		}
		if (e instanceof w) {
			if (this.inputDetails.length !== 1) throw Error(`run() called with a single tensor, but signature expects ${this.inputDetails.length} inputs`);
			return [e];
		}
		let t = [];
		for (let n of this.inputDetails) {
			if (!(n.name in e)) throw Error(`run() called with input record that is missing input ${n.name} with index ${n.index}`);
			t.push(e[n.name]);
		}
		return t;
	}
	outputsToRecord(e) {
		let t = {};
		for (let n = 0; n < this.outputDetails.length; n++) t[this.outputDetails[n].name] = e[n];
		return t;
	}
	async ensureInputsOnAccelerator(e) {
		let t = [], n = [], r = this.getInputDetails();
		if (e.length !== r.length) throw Error(`ensureInputsOnAccelerator() called with ${e.length} inputs, but signature expects ${r.length} inputs`);
		for (let i = 0; i < e.length; i++) {
			let a = e[i], o = a.getBufferType(), s = r[i].supportedBufferTypes;
			if (s.size === 0) throw Error(`Tensor ${r[i].name} with index ${r[i].index} has no supported buffer types.`);
			if (s.has(o)) n.push(a);
			else {
				let e = s.values().next().value, r = await a.copyTo(e);
				t.push(r), n.push(r);
			}
		}
		return {
			inputsOnAccelerator: n,
			cleanup: () => {
				for (let e of t) e.delete();
			}
		};
	}
	async runWithArray(e) {
		for (let t = 0; t < e.length; t++) {
			let n = e[t], r = this.liteRtModel.getInputTensorType(this.signatureIndex, t), i = this.liteRtCompiledModel.getInputBufferRequirements(this.signatureIndex, t);
			_().liteRtWasm.checkTensorBufferCompatible(n.liteRtTensorBuffer, r, i), r.delete(), i.delete();
		}
		return (await this.liteRtCompiledModel.run(this.signatureIndex, e.map((e) => e.liteRtTensorBuffer))).map((e) => new w(e, this.options.environment));
	}
	get deleted() {
		return this.deletedInternal;
	}
	ensureNotDeleted() {
		if (this.deleted) throw Error("CompiledModelSignatureRunner is deleted and cannot be used.");
	}
	delete() {
		this.deletedInternal || (this.deletedInternal = !0, this.liteRtSimpleSignature.delete());
	}
};
function T(e, t, n, r) {
	let i = n.layout(), a = x(i.dimensions());
	i.delete();
	let o = new Set(x(r.supportedTypes()).map(({ value: e }) => e)), s = {
		name: e,
		index: t,
		dtype: p(n.elementType().value).dtype,
		shape: new Int32Array(a),
		supportedBufferTypes: o
	};
	return n.delete(), r.delete(), s;
}
var ge = class {
	constructor(e, t, n, r) {
		this.model = e, this.liteRtCompiledModel = t, this.options = n, this.onDelete = r;
		let i = e.liteRtModel.getNumSignatures(), a = {};
		for (let r = 0; r < i; r++) {
			let i = new he(r, e.liteRtModel, t, n);
			a[i.key] = i;
		}
		this.compiledModelSignatureRunners = Object.freeze(a), this.defaultSignature = Object.values(this.signatures)[0], this.key = this.defaultSignature.key;
	}
	defaultSignature;
	compiledModelSignatureRunners;
	key;
	deletedInternal = !1;
	get signatures() {
		return this.ensureNotDeleted(), this.compiledModelSignatureRunners;
	}
	getInputDetails() {
		return this.ensureNotDeleted(), this.defaultSignature.getInputDetails();
	}
	getOutputDetails() {
		return this.ensureNotDeleted(), this.defaultSignature.getOutputDetails();
	}
	async run(e, t) {
		this.ensureNotDeleted();
		let [n, r] = this.parseRunInputs(e, t);
		return await n.run(r);
	}
	parseRunInputs(e, t) {
		let n, r;
		if (typeof e == "string") {
			if (n = this.signatures[e], !n) throw Error(`No signature named ${e} found in model.`);
			if (!t) throw Error(`No input provided for signature ${e}`);
			r = t;
		} else n = this.defaultSignature, r = e;
		return [n, r];
	}
	get deleted() {
		return this.deletedInternal;
	}
	ensureNotDeleted() {
		if (this.deleted) throw Error("CompiledModel is deleted and cannot be used.");
	}
	get isFullyAccelerated() {
		return this.ensureNotDeleted(), this.liteRtCompiledModel.isFullyAccelerated();
	}
	delete() {
		if (!this.deletedInternal) {
			this.deletedInternal = !0, this.liteRtCompiledModel.delete(), this.model.delete();
			for (let e of Object.values(this.compiledModelSignatureRunners)) e.delete();
			this.onDelete();
		}
	}
};
async function _e(e) {
	let t = await fetch(e);
	return new Uint8Array(await t.arrayBuffer());
}
async function ve(e) {
	let t = 0, n = new Uint8Array(1024), r = 2e9;
	for (;;) {
		let { done: i, value: a } = await e.read();
		if (a) {
			if (n.byteLength < t + a.byteLength) {
				if (t + a.byteLength > r) throw Error(`Model is too large (> ${r} bytes).`);
				let e = new Uint8Array(Math.min(r, Math.max(n.byteLength, a.byteLength) * 2));
				e.set(n), n = e;
			}
			n.set(a, t), t += a.byteLength;
		}
		if (i) break;
	}
	return n.slice(0, t);
}
var ye = class {
	constructor(e, t) {
		this.liteRtModel = e, this.onDelete = t;
	}
	delete() {
		this.liteRtModel.delete(), this.onDelete();
	}
};
function E(e, t) {
	return _().loadAndCompile(e, t);
}
var D = class {
	liteRtWasm;
	defaultEnvironment;
	objectsToDelete = /* @__PURE__ */ new Set();
	constructor(e) {
		this.liteRtWasm = e, this.liteRtWasm.setupLogging();
	}
	setDefaultEnvironment(e) {
		this.defaultEnvironment = e;
	}
	getDefaultEnvironment() {
		if (!this.defaultEnvironment) throw Error("Default environment is not set.");
		return this.defaultEnvironment;
	}
	setWebGpuDevice(e) {
		let t = this.getDefaultEnvironment();
		this.setDefaultEnvironment(new b({
			...t.options,
			webGpuDevice: e
		}));
	}
	getWebGpuDevice() {
		return this.getDefaultEnvironment().webGpuDevice;
	}
	async loadAndCompile(e, t = {}) {
		let n;
		if (typeof e == "string" || e instanceof URL) n = await _e(e);
		else if (e instanceof Uint8Array) n = e;
		else if (e instanceof ReadableStreamDefaultReader) n = await ve(e);
		else throw Error("Unsupported model type.");
		let r = t.environment ?? this.getDefaultEnvironment(), i = t.accelerator ?? (r.webGpuDevice ? "webgpu" : "wasm");
		if ((Array.isArray(i) ? i.includes("webgpu") : i === "webgpu") && !r.webGpuDevice) throw Error("WebGPU was requested but no WebGPU device is set in the environment.");
		let a = {
			environment: r,
			accelerator: i,
			cpuOptions: t.cpuOptions ?? { numThreads: this.liteRtWasm.getThreadCount() },
			gpuOptions: t.gpuOptions ?? {},
			webNNOptions: t.webNNOptions ?? {}
		}, o = this.liteRtWasm._malloc(n.byteLength);
		this.liteRtWasm.HEAPU8.set(n, o);
		let s = this.liteRtWasm.loadModel(a.environment.liteRtEnvironment, o, n.byteLength), c = await this.liteRtWasm.compileModel(a.environment.liteRtEnvironment, s, a), l = new ge(new ye(s, () => {
			this.liteRtWasm._free(o);
		}), c, a, () => {
			this.objectsToDelete.delete(l);
		});
		return this.objectsToDelete.add(l), l;
	}
	delete() {
		for (let e of this.objectsToDelete) e.delete();
	}
};
function O(e) {
	return e;
}
function be(e, t) {
	return e ? t ? (e.endsWith("/") ? e : e + "/") + (t.startsWith("/") ? t.substring(1) : t) : e : t;
}
var xe = new Uint8Array([
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
]), Se = new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	4,
	1,
	96,
	0,
	0,
	3,
	2,
	1,
	0,
	5,
	4,
	1,
	3,
	1,
	1,
	10,
	11,
	1,
	9,
	0,
	65,
	0,
	254,
	16,
	2,
	0,
	26,
	11
]), k = {
	relaxedSimd: void 0,
	threads: void 0,
	jspi: void 0,
	webnn: void 0
};
function Ce() {
	return "Suspending" in WebAssembly;
}
function we() {
	return typeof navigator < "u" && !!navigator.ml;
}
async function A(e) {
	try {
		return await WebAssembly.instantiate(e), { supported: !0 };
	} catch (e) {
		return {
			supported: !1,
			error: e
		};
	}
}
var j = {
	relaxedSimd: () => (k.relaxedSimd === void 0 && (k.relaxedSimd = A(xe)), k.relaxedSimd),
	threads: () => {
		if (k.threads === void 0) try {
			typeof MessageChannel < "u" && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), k.threads = A(Se);
		} catch (e) {
			k.threads = Promise.resolve({
				supported: !1,
				error: e
			});
		}
		return k.threads;
	},
	jspi: () => {
		if (k.jspi === void 0) {
			let e = Ce();
			k.jspi = Promise.resolve({
				supported: e,
				error: e ? void 0 : /* @__PURE__ */ Error("JSPI is not supported")
			});
		}
		return k.jspi;
	},
	webnn: () => {
		if (k.webnn === void 0) {
			let e = we();
			k.webnn = Promise.resolve({
				supported: e,
				error: e ? void 0 : /* @__PURE__ */ Error("WebNN is not supported")
			});
		}
		return k.webnn;
	}
};
async function Te(e) {
	let t = j[e]?.();
	if (!t) throw Error(`Unknown feature: ${e}`);
	return (await t).supported;
}
async function M(e) {
	let t = j[e]?.();
	if (!t) throw Error(`Unknown feature: ${e}`);
	let n = await t;
	if (!n.supported) throw n.error;
}
var Ee = "litert_wasm_internal.js", De = "litert_wasm_compat_internal.js", Oe = "litert_wasm_threaded_internal.js", ke = "litert_wasm_jspi_internal.js", Ae = "litert_wasm_internal.mjs", je = "litert_wasm_compat_internal.mjs", Me = "litert_wasm_threaded_internal.mjs", Ne = "litert_wasm_jspi_internal.mjs";
async function Pe(e, t) {
	if (typeof e == "function") return await N(t, !0, "the provided Wasm module factory"), s(D, {
		fileLocator: t?.fileLocator,
		moduleFactory: e
	});
	let n = O(e), r = t?.wasmLoaderType === "module" || n.endsWith(".mjs"), i = await N(t, n.endsWith(".wasm") || n.endsWith(".js") || n.endsWith(".mjs"), n), a = r ? je : De;
	i && (a = t?.threads ? r ? Me : Oe : t?.jspi ? r ? Ne : ke : r ? Ae : Ee);
	let o = e;
	if (n.endsWith(".wasm")) throw Error("Please load the `.js` file corresponding to the `.wasm` file, or load the directory containing it.");
	if (!n.endsWith(".js") && !n.endsWith(".mjs") && (o = be(e, a)), r) {
		let e = await Fe(o);
		return s(D, {
			fileLocator: t?.fileLocator,
			moduleFactory: e
		});
	}
	return s(D, o, null, null, t?.fileLocator);
}
async function N(e, t, n) {
	let r = await Te("relaxedSimd");
	if (e?.threads) {
		if (e?.jspi) throw Error("The `threads` and `jspi` options are mutually exclusive.");
		if (t && console.warn(`The \`threads\` option was specified, but the wasm path ${n} is a full file path. Whether threads are available or not will depend on the loaded file. To allow LiteRT.js to load the threaded wasm file, use a directory path instead of a full file path.`), !r) throw Error("Threads are only supported with relaxed SIMD, and the current browser does not support relaxed SIMD.");
		await M("threads");
	}
	return e?.jspi && (t && console.warn(`The \`jspi\` option was specified, but the wasm path ${n} is a full file path. Whether JSPI is available or not will depend on the loaded file. To allow LiteRT.js to load the JSPI wasm file, use a directory path instead of a full file path.`), await M("jspi")), r;
}
async function Fe(e) {
	let t = Ie(e), n = await import(
		/* @vite-ignore */
		t
);
	if (typeof n.default != "function") throw Error(`LiteRT Wasm ES module ${t} must have a default export module factory.`);
	return n.default;
}
function Ie(e) {
	let t = O(e), n = Le();
	if (!n) return t;
	try {
		return new URL(t, n).href;
	} catch {
		return t;
	}
}
function Le() {
	if (typeof document < "u") return document.baseURI;
	if (typeof location < "u") return location.href;
}
function P(e, t) {
	if (te()) throw Error("LiteRT is already loading / loaded.");
	return y(Pe(e, t).then(async (e) => (ee(e), e.setDefaultEnvironment(await b.create()), e)).catch((e) => {
		throw y(void 0), e;
	})), v();
}
async function F(e, t = {}) {
	let n = t.environment ?? e.environment, r = _().liteRtWasm, i = e.liteRtTensorBuffer;
	if (i.bufferType().value !== u.HOST_MEMORY) throw Error("Source tensor is not in host memory. Cannot copy to host memory.");
	let a = i.lock(r.LiteRtTensorBufferLockMode.READ), o;
	try {
		o = r.LiteRtTensorBuffer.createManaged(n.liteRtEnvironment, r.LiteRtTensorBufferType.HOST_MEMORY, i.tensorType(), i.size());
		let e = o.lock(r.LiteRtTensorBufferLockMode.WRITE);
		try {
			let t = new Uint8Array(r.HEAPU8.buffer, a, i.size());
			r.HEAPU8.set(t, e);
		} finally {
			o.unlock();
		}
	} finally {
		i.unlock();
	}
	if (!o) throw Error("Failed to create destination tensor buffer.");
	return new w(o, n);
}
async function I(e, t = {}) {
	let n = t.environment ?? e.environment, r = n.webGpuDevice;
	if (!r) throw Error("No WebGPU device is available. Did you forget to pass a destination environment that has a WebGPU device?");
	let i = _().liteRtWasm, a = e.liteRtTensorBuffer.size() + 3 & -4, o = r.createBuffer({
		size: a,
		usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
		mappedAtCreation: !0
	}), s = await o.getMappedRange(), c = new Uint8Array(s), l = e.liteRtTensorBuffer.lock(i.LiteRtTensorBufferLockMode.READ);
	try {
		let t = new Uint8Array(i.HEAPU8.buffer, l, e.liteRtTensorBuffer.size());
		c.set(t);
	} finally {
		e.liteRtTensorBuffer.unlock();
	}
	o.unmap();
	let u = r.createBuffer({
		size: a,
		usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
	}), d = r.createCommandEncoder();
	return d.copyBufferToBuffer(o, 0, u, 0, a), r.queue.submit([d.finish()]), o.destroy(), new w(u, e.type.layout.dimensions, e.type.dtype, n, () => {
		u.destroy();
	});
}
async function L(e, t = {}) {
	let n = t.environment ?? e.environment, r = e.environment.webGpuDevice;
	if (!r) throw Error("No WebGPU device is available. Does the source tensor have a WebGPU device?");
	let i = _().liteRtWasm, a = e.liteRtTensorBuffer, o = a.bufferType();
	if (o !== i.LiteRtTensorBufferType.WEB_GPU_BUFFER_PACKED) throw Error(`Cannot convert a tensor with a non-WebGPU buffer type ${o} to a CPU tensor.`);
	let s = i.WebGPU.getJsObject(a.getWebGpuBuffer()), c = a.offset(), l = a.tensorType(), u = l.layout(), d = u.numElements(), f = p(l.elementType().value).typedArrayConstructor;
	u.delete(), l.delete();
	let m = s, h = () => {};
	if (!(s.usage & GPUBufferUsage.MAP_READ)) {
		m = r.createBuffer({
			size: s.size,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
		}), h = () => {
			m.destroy();
		};
		let e = r.createCommandEncoder();
		e.copyBufferToBuffer(s, 0, m, 0, s.size), r.queue.submit([e.finish()]);
	}
	await m.mapAsync(GPUMapMode.READ);
	let g = new w(new f(m.getMappedRange(), c, d), e.type.layout.dimensions, n);
	return m.unmap(), h(), g;
}
function R(e) {
	return async (t, n) => {
		let r = await e(t, n);
		return t.delete(), r;
	};
}
function Re() {
	w.copyFunctions.set(u.HOST_MEMORY, /* @__PURE__ */ new Map([[u.HOST_MEMORY, {
		copyTo: F,
		moveTo: R(F)
	}], [u.WEB_GPU_BUFFER_PACKED, {
		copyTo: I,
		moveTo: R(I)
	}]])), w.copyFunctions.set(u.WEB_GPU_BUFFER_PACKED, /* @__PURE__ */ new Map([[u.HOST_MEMORY, {
		copyTo: L,
		moveTo: R(L)
	}]]));
}
Re();
//#endregion
//#region src/runtime.ts
var z = 512, B = 128, V = 257, H = [
	"fft",
	"magnitude",
	"model1_tensor",
	"model1_invoke",
	"model1_read",
	"mask",
	"ifft",
	"model2_tensor",
	"model2_invoke",
	"model2_read",
	"overlap_add",
	"infer_total",
	"denoise_total"
], U = {
	sampleRate: 16e3,
	channels: 1,
	frameSize: z,
	frameDuration: 32
};
function ze(e) {
	return Number.isFinite(e) && e !== void 0 && e > 0 ? Math.floor(e) : 1;
}
async function Be(e) {
	let t = v();
	if (t) return t;
	if (e.wasmModuleFactory) {
		if (e.threads) throw Error("Threaded bundled LiteRT loading is not supported yet in the worklet path.");
		return P(e.wasmBinary ? (t) => e.wasmModuleFactory({
			...typeof t == "object" && t ? t : {},
			wasmBinary: e.wasmBinary
		}) : e.wasmModuleFactory, { threads: e.threads });
	}
	return P(e.wasmRoot, { threads: e.threads });
}
function Ve(e) {
	return Array.from(e, (e) => Number(e));
}
function W(e) {
	return e.map((e) => ({
		name: e.name,
		index: e.index,
		dtype: e.dtype,
		shape: Ve(e.shape)
	}));
}
function G(e) {
	return {
		inputs: W(e.getInputDetails()),
		outputs: W(e.getOutputDetails())
	};
}
function K(e, t) {
	let n = e.defaultSignature;
	if (!n || typeof n.signatureIndex != "number" || !n.liteRtModel || !n.liteRtCompiledModel || typeof n.liteRtCompiledModel.run != "function") throw Error(`LiteRT.js internal sync runner is unavailable for ${t}. This package currently depends on that API to keep dtln_denoise synchronous.`);
	return n;
}
function He(e) {
	return typeof e == "object" && !!e && "then" in e && typeof e.then == "function";
}
function q(e, t) {
	let n = _().liteRtWasm;
	for (let r = 0; r < t.length; r++) {
		let i = t[r], a = e.liteRtModel.getInputTensorType(e.signatureIndex, r), o = e.liteRtCompiledModel.getInputBufferRequirements(e.signatureIndex, r);
		try {
			n.checkTensorBufferCompatible(i.liteRtTensorBuffer, a, o);
		} finally {
			a.delete(), o.delete();
		}
	}
	let r = e.liteRtCompiledModel.run(e.signatureIndex, t.map((e) => e.liteRtTensorBuffer));
	if (He(r)) throw Error("LiteRT.js returned an async model invocation. AudioWorklet inference requires a synchronous wasm run path.");
	let i = w;
	return r.map((t) => new i(t, e.options.environment));
}
function J(e, t) {
	if (!(t instanceof Float32Array)) throw TypeError(`${e} must be a Float32Array`);
}
function Y(e) {
	for (let t of e) t.delete();
}
function X() {
	return performance.now();
}
function Ue() {
	return {
		inferCalls: 0,
		denoiseCalls: 0,
		timings: Object.fromEntries(H.map((e) => [e, []]))
	};
}
function Z(e, t, n) {
	e.timings[t].push(n);
}
function We(e) {
	if (e.length === 0) return {
		count: 0,
		totalMs: 0,
		meanMs: 0,
		p95Ms: 0
	};
	let t = [...e].sort((e, t) => e - t), n = e.reduce((e, t) => e + t, 0), r = Math.min(t.length - 1, Math.max(0, Math.ceil(t.length * .95) - 1));
	return {
		count: e.length,
		totalMs: n,
		meanMs: n / e.length,
		p95Ms: t[r] ?? 0
	};
}
function Ge(e) {
	let t = Object.create(null);
	for (let n of H) t[n] = {
		...We(e.timings[n]),
		inferShare: 0,
		denoiseShare: 0
	};
	let n = t.infer_total.totalMs, r = t.denoise_total.totalMs;
	for (let e of H) {
		let i = t[e].totalMs;
		t[e].inferShare = n > 0 ? i / n : 0, t[e].denoiseShare = r > 0 ? i / r : 0;
	}
	return {
		inferCalls: e.inferCalls,
		denoiseCalls: e.denoiseCalls,
		stages: t
	};
}
function Q(e, t) {
	if (!(t instanceof Float32Array)) throw TypeError(`${e} must resolve to Float32Array`);
	return t;
}
function Ke(e) {
	return e.createComplexArray();
}
var qe = class {
	model1Runner;
	model2Runner;
	profilingEnabled;
	profile;
	model1InputShapes;
	model2InputShapes;
	fft;
	fftSpectrum;
	ifftComplex;
	inBuffer;
	outBuffer;
	states1;
	states2;
	inMag;
	estimatedBlock;
	constructor(e, t, n = {}) {
		if (this.model1Runner = K(e, "model1"), this.model2Runner = K(t, "model2"), this.profilingEnabled = n.profilingEnabled === !0, this.profile = Ue(), this.model1InputShapes = e.getInputDetails().map((e) => e.shape), this.model2InputShapes = t.getInputDetails().map((e) => e.shape), this.model1InputShapes.length !== 2 || this.model2InputShapes.length !== 2) throw Error("Expected exactly two inputs for each DTLN model");
		this.fft = new a(z), this.fftSpectrum = Ke(this.fft), this.ifftComplex = Ke(this.fft), this.inBuffer = new Float32Array(z), this.outBuffer = new Float32Array(z), this.states1 = new Float32Array(z), this.states2 = new Float32Array(z), this.inMag = new Float32Array(V), this.estimatedBlock = new Float32Array(z);
	}
	denoise(e, t) {
		if (J("inputSamples", e), J("outputSamples", t), e.length % B !== 0) throw RangeError(`inputSamples length must be a multiple of ${B}`);
		if (t.length < e.length) throw RangeError("outputSamples must be at least as large as inputSamples");
		let n = this.profilingEnabled ? X() : 0, r = e.length / B;
		for (let n = 0; n < r; n++) {
			let r = n * B;
			this.inBuffer.copyWithin(0, B), this.inBuffer.set(e.subarray(r, r + B), z - B), this.infer(), t.set(this.outBuffer.subarray(0, B), r);
		}
		return this.profilingEnabled && (this.profile.denoiseCalls++, Z(this.profile, "denoise_total", X() - n)), !1;
	}
	getProfile() {
		return Ge(this.profile);
	}
	resetProfile() {
		this.profile = Ue();
	}
	infer() {
		let e = this.profilingEnabled ? X() : 0, t = this.profilingEnabled ? e : 0;
		this.fft.realTransform(this.fftSpectrum, this.inBuffer), this.profilingEnabled && (Z(this.profile, "fft", X() - t), t = X());
		for (let e = 0; e < V; e++) {
			let t = e * 2;
			this.inMag[e] = Math.hypot(this.fftSpectrum[t], this.fftSpectrum[t + 1]);
		}
		this.profilingEnabled && (Z(this.profile, "magnitude", X() - t), t = X());
		let n = [w.fromTypedArray(this.inMag, this.model1InputShapes[0]), w.fromTypedArray(this.states1, this.model1InputShapes[1])];
		this.profilingEnabled && (Z(this.profile, "model1_tensor", X() - t), t = X());
		let r;
		try {
			r = q(this.model1Runner, n);
		} finally {
			Y(n);
		}
		this.profilingEnabled && (Z(this.profile, "model1_invoke", X() - t), t = X());
		let i = Q("model1 mask output", r[0].toTypedArray()), a = Q("model1 state output", r[1].toTypedArray());
		this.states1.set(a), this.profilingEnabled && (Z(this.profile, "model1_read", X() - t), t = X());
		for (let e = 0; e < V; e++) {
			let t = e * 2, n = i[e];
			this.fftSpectrum[t] *= n, this.fftSpectrum[t + 1] *= n;
		}
		this.profilingEnabled && (Z(this.profile, "mask", X() - t), t = X()), Y(r), this.fftSpectrum[1] = 0, this.fftSpectrum[513] = 0, this.fft.completeSpectrum(this.fftSpectrum), this.fft.inverseTransform(this.ifftComplex, this.fftSpectrum);
		for (let e = 0; e < z; e++) this.estimatedBlock[e] = this.ifftComplex[e * 2];
		this.profilingEnabled && (Z(this.profile, "ifft", X() - t), t = X());
		let o = [w.fromTypedArray(this.estimatedBlock, this.model2InputShapes[0]), w.fromTypedArray(this.states2, this.model2InputShapes[1])];
		this.profilingEnabled && (Z(this.profile, "model2_tensor", X() - t), t = X());
		let s;
		try {
			s = q(this.model2Runner, o);
		} finally {
			Y(o);
		}
		this.profilingEnabled && (Z(this.profile, "model2_invoke", X() - t), t = X());
		let c = Q("model2 output", s[0].toTypedArray()), l = Q("model2 state output", s[1].toTypedArray());
		this.states2.set(l), Y(s), this.profilingEnabled && (Z(this.profile, "model2_read", X() - t), t = X()), this.outBuffer.copyWithin(0, B), this.outBuffer.fill(0, z - B);
		for (let e = 0; e < z; e++) {
			let t = this.outBuffer[e] ?? 0;
			this.outBuffer[e] = t + c[e];
		}
		this.profilingEnabled && (Z(this.profile, "overlap_add", X() - t), this.profile.inferCalls++, Z(this.profile, "infer_total", X() - e));
	}
};
async function Je(e) {
	let t = e.liteRtWasmRoot, n = e.model1Data ?? e.model1Url, r = e.model2Data ?? e.model2Url, i = e.threads === !0, a = ze(e.numThreads), o = e.enableProfiling === !0;
	if (!n) throw Error("Missing model1 source. Provide model1Url or model1Data.");
	if (!r) throw Error("Missing model2 source. Provide model2Url or model2Data.");
	if (!e.liteRtWasmModuleFactory && !t) throw Error("Missing LiteRT runtime source. Provide liteRtWasmRoot or liteRtWasmModuleFactory.");
	let s = {
		wasmRoot: t,
		threads: i
	};
	e.liteRtWasmModuleFactory !== void 0 && (s.wasmModuleFactory = e.liteRtWasmModuleFactory), e.liteRtWasmBinary !== void 0 && (s.wasmBinary = e.liteRtWasmBinary), await Be(s);
	let c = {
		accelerator: "wasm",
		cpuOptions: { numThreads: a }
	}, [l, u] = await Promise.all([E(n, c), E(r, c)]), d = {
		model1: G(l),
		model2: G(u),
		threads: i,
		numThreads: a,
		liteRtWasmRoot: t
	};
	e.logModelDetails && console.info("[noise-suppression] model details", d);
	let f = /* @__PURE__ */ new Map(), p = 1, m = (e) => {
		let t = f.get(e);
		if (!t) throw Error(`Unknown noise suppression handle: ${e}`);
		return t;
	}, h = {
		ready: Promise.resolve(void 0),
		modelDetails: d,
		audioConfig: U,
		dtln_create() {
			let e = p++;
			return f.set(e, new qe(l, u, { profilingEnabled: o })), e;
		},
		dtln_denoise(e, t, n) {
			return m(e).denoise(t, n);
		},
		dtln_stop(e) {
			f.delete(e);
		},
		dtln_destroy(e) {
			f.delete(e);
		},
		get_profile(e) {
			return m(e).getProfile();
		},
		reset_profile(e) {
			m(e).resetProfile();
		},
		dtln_profile_get(e) {
			return m(e).getProfile();
		},
		dtln_profile_reset(e) {
			m(e).resetProfile();
		}
	};
	return h.ready = Promise.resolve(h), h;
}
//#endregion
//#region src/index.ts
async function $(a = {}) {
	let o = {
		liteRtWasmRoot: a.liteRtWasmRoot ?? t(),
		model1Url: a.model1Url ?? r(),
		model2Url: a.model2Url ?? e(),
		threads: n(a.threads),
		numThreads: i(a.numThreads)
	};
	return a.logModelDetails !== void 0 && (o.logModelDetails = a.logModelDetails), a.enableProfiling !== void 0 && (o.enableProfiling = a.enableProfiling), Je(o);
}
//#endregion
export { U as AUDIO_CONFIG, $ as createNoiseSuppressionModule, $ as default, Je as createNoiseSuppressionRuntime };

//# sourceMappingURL=index.js.map