Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_encodingParams_constants = require("./constants.js");
const require_specialTokens = require("../specialTokens.js");
require("../modelParams.js");
//#region src/encodingParams/p50k_base.ts
function P50KBase(bytePairRankDecoder) {
	return {
		expectedVocabularySize: 50281,
		tokenSplitRegex: require_encodingParams_constants.R50K_TOKEN_SPLIT_REGEX,
		bytePairRankDecoder,
		specialTokensEncoder: /* @__PURE__ */ new Map([[require_specialTokens.EndOfText, 50256]])
	};
}
//#endregion
exports.P50KBase = P50KBase;

//# sourceMappingURL=p50k_base.js.map