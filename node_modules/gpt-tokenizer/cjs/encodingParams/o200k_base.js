Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_encodingParams_constants = require("./constants.js");
const require_specialTokens = require("../specialTokens.js");
//#region src/encodingParams/o200k_base.ts
const O200K_BASE_SPECIAL_TOKEN_ENTRIES = [
	[require_specialTokens.EndOfText, 199999],
	[require_specialTokens.FimPrefix, 2e5],
	[require_specialTokens.FimMiddle, 200001],
	[require_specialTokens.FimSuffix, 200002],
	[require_specialTokens.ImStart, 200003],
	[require_specialTokens.ImEnd, 200004],
	[require_specialTokens.ImSep, 200005],
	[require_specialTokens.EndOfPrompt, 200006]
];
const createO200KSpecialTokenMap = () => new Map(O200K_BASE_SPECIAL_TOKEN_ENTRIES);
function O200KBase(bytePairRankDecoder) {
	return {
		tokenSplitRegex: require_encodingParams_constants.O200K_TOKEN_SPLIT_REGEX,
		bytePairRankDecoder,
		specialTokensEncoder: createO200KSpecialTokenMap()
	};
}
//#endregion
exports.O200KBase = O200KBase;
exports.createO200KSpecialTokenMap = createO200KSpecialTokenMap;

//# sourceMappingURL=o200k_base.js.map