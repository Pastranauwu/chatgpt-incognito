Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_encodingParams_constants = require("./constants.js");
const require_specialTokens = require("../specialTokens.js");
//#region src/encodingParams/cl100k_base.ts
function Cl100KBase(bytePairRankDecoder) {
	return {
		tokenSplitRegex: require_encodingParams_constants.CL100K_TOKEN_SPLIT_REGEX,
		bytePairRankDecoder,
		specialTokensEncoder: /* @__PURE__ */ new Map([
			[require_specialTokens.EndOfText, 100257],
			[require_specialTokens.FimPrefix, 100258],
			[require_specialTokens.FimMiddle, 100259],
			[require_specialTokens.FimSuffix, 100260],
			[require_specialTokens.ImStart, 100264],
			[require_specialTokens.ImEnd, 100265],
			[require_specialTokens.ImSep, 100266],
			[require_specialTokens.EndOfPrompt, 100276]
		])
	};
}
//#endregion
exports.Cl100KBase = Cl100KBase;

//# sourceMappingURL=cl100k_base.js.map