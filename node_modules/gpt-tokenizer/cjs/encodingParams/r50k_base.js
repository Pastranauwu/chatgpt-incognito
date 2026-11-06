Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_encodingParams_constants = require("./constants.js");
const require_specialTokens = require("../specialTokens.js");
require("../modelParams.js");
//#region src/encodingParams/r50k_base.ts
function R50KBase(bytePairRankDecoder) {
	return {
		expectedVocabularySize: 50257,
		tokenSplitRegex: require_encodingParams_constants.R50K_TOKEN_SPLIT_REGEX,
		bytePairRankDecoder,
		specialTokensEncoder: /* @__PURE__ */ new Map([[require_specialTokens.EndOfText, 50256]])
	};
}
//#endregion
exports.R50KBase = R50KBase;

//# sourceMappingURL=r50k_base.js.map