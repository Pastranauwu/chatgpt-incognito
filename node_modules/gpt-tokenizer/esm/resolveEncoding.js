import bpe from "./bpeRanks/o200k_base.js";
import bpe$1 from "./bpeRanks/cl100k_base.js";
import bpe$2 from "./bpeRanks/p50k_base.js";
import bpe$3 from "./bpeRanks/r50k_base.js";
//#region src/resolveEncoding.ts
const resolveEncoding = (encoding) => {
	switch (encoding) {
		case "gpt2":
		case "r50k_base": return bpe$3;
		case "p50k_base":
		case "p50k_edit": return bpe$2;
		case "cl100k_base": return bpe$1;
		case "o200k_base":
		case "o200k_harmony": return bpe;
		default: throw new Error(`Unknown encoding name: ${String(encoding)}`);
	}
};
//#endregion
export { resolveEncoding };

//# sourceMappingURL=resolveEncoding.js.map