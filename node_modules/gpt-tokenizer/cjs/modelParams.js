Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_encodingParams_cl100k_base = require("./encodingParams/cl100k_base.js");
const require_encodingParams_o200k_base = require("./encodingParams/o200k_base.js");
const require_encodingParams_o200k_harmony = require("./encodingParams/o200k_harmony.js");
const require_encodingParams_p50k_base = require("./encodingParams/p50k_base.js");
const require_encodingParams_p50k_edit = require("./encodingParams/p50k_edit.js");
const require_encodingParams_r50k_base = require("./encodingParams/r50k_base.js");
//#region src/modelParams.ts
function getEncodingParams(encodingName, getMergeableRanks) {
	const mergeableBytePairRanks = getMergeableRanks(encodingName);
	switch (encodingName.toLowerCase()) {
		case "gpt2":
		case "r50k_base": return require_encodingParams_r50k_base.R50KBase(mergeableBytePairRanks);
		case "p50k_base": return require_encodingParams_p50k_base.P50KBase(mergeableBytePairRanks);
		case "p50k_edit": return require_encodingParams_p50k_edit.P50KEdit(mergeableBytePairRanks);
		case "cl100k_base": return require_encodingParams_cl100k_base.Cl100KBase(mergeableBytePairRanks);
		case "o200k_base": return require_encodingParams_o200k_base.O200KBase(mergeableBytePairRanks);
		case "o200k_harmony": return require_encodingParams_o200k_harmony.O200KHarmony(mergeableBytePairRanks);
		default: throw new Error(`Unknown encoding name: ${encodingName}`);
	}
}
//#endregion
exports.getEncodingParams = getEncodingParams;

//# sourceMappingURL=modelParams.js.map