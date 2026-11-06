Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_encodingParams_constants = require("./constants.js");
const require_specialTokens = require("../specialTokens.js");
require("../modelParams.js");
//#region src/encodingParams/p50k_edit.ts
function P50KEdit(bytePairRankDecoder) {
	return {
		tokenSplitRegex: require_encodingParams_constants.R50K_TOKEN_SPLIT_REGEX,
		bytePairRankDecoder,
		specialTokensEncoder: /* @__PURE__ */ new Map([
			[require_specialTokens.EndOfText, 50256],
			[require_specialTokens.FimPrefix, 50281],
			[require_specialTokens.FimMiddle, 50282],
			[require_specialTokens.FimSuffix, 50283]
		])
	};
}
//#endregion
exports.P50KEdit = P50KEdit;

//# sourceMappingURL=p50k_edit.js.map