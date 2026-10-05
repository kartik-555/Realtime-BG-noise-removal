import "./audio-worklet-dev-module-url-C7kts-WI.js";
import e from "node:fs";
import { fileURLToPath as t } from "node:url";
//#region src/vite.ts
var n = t(new URL(
	/* @vite-ignore */
	"./assets/audio-worklet-processor.js",
	import.meta.url
)), r = t(new URL(
	/* @vite-ignore */
	"./audio-worklet.js",
	import.meta.url
)), i = "new URL(\"assets/audio-worklet-processor.js\", import.meta.url).href";
function a(t = {}) {
	let a = t.moduleUrl ?? "/node_modules/@workadventure/noise-suppression/dist/assets/audio-worklet-processor.js", o = t.processorPath ?? n;
	return {
		name: "noise-suppression-audio-worklet",
		apply: "serve",
		config() {
			return { optimizeDeps: { exclude: ["@workadventure/noise-suppression", "@workadventure/noise-suppression/audio-worklet"] } };
		},
		configureServer(t) {
			t.middlewares.use(a, (t, n, r) => {
				n.statusCode = 200, n.setHeader("Content-Type", "text/javascript"), n.setHeader("Cache-Control", "no-cache");
				let i = e.createReadStream(o);
				i.on("error", r), i.pipe(n);
			});
		},
		transform(e, t) {
			return t.split("?")[0] === r ? e.includes(i) ? {
				code: e.replace(i, JSON.stringify(a)),
				map: null
			} : (this.warn("Could not rewrite the noise suppression AudioWorklet processor URL for Vite dev mode."), null) : null;
		}
	};
}
//#endregion
export { a as noiseSuppressionAudioWorkletVitePlugin };

//# sourceMappingURL=vite.js.map