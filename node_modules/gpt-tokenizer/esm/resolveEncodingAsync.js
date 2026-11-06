//#region src/resolveEncodingAsync.ts
const resolveEncodingAsync = async (encoding) => {
	switch (encoding) {
		case "gpt2":
		case "r50k_base": return import("./bpeRanks/r50k_base.js").then(({ default: rawBytePairRanks }) => rawBytePairRanks);
		case "p50k_base":
		case "p50k_edit": return import("./bpeRanks/p50k_base.js").then(({ default: rawBytePairRanks }) => rawBytePairRanks);
		case "cl100k_base": return import("./bpeRanks/cl100k_base.js").then(({ default: rawBytePairRanks }) => rawBytePairRanks);
		case "o200k_base":
		case "o200k_harmony": return import("./bpeRanks/o200k_base.js").then(({ default: rawBytePairRanks }) => rawBytePairRanks);
		default: throw new Error(`Unknown encoding name: ${String(encoding)}`);
	}
};
//#endregion
export { resolveEncodingAsync };

//# sourceMappingURL=resolveEncodingAsync.js.map