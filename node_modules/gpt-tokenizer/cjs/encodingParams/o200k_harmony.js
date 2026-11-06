Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_encodingParams_constants = require("./constants.js");
const require_specialTokens = require("../specialTokens.js");
//#region src/encodingParams/o200k_harmony.ts
const RESERVED_TOKEN_RANGE_START = 200013;
const RESERVED_TOKEN_RANGE_END = 201088;
const STATIC_SPECIAL_TOKEN_ENTRIES = [
	[require_specialTokens.HarmonyStartOfText, 199998],
	[require_specialTokens.EndOfText, 199999],
	["<|reserved_200000|>", 2e5],
	["<|reserved_200001|>", 200001],
	[require_specialTokens.HarmonyReturn, 200002],
	[require_specialTokens.HarmonyConstrain, 200003],
	["<|reserved_200004|>", 200004],
	[require_specialTokens.HarmonyChannel, 200005],
	[require_specialTokens.HarmonyStart, 200006],
	[require_specialTokens.HarmonyEnd, 200007],
	[require_specialTokens.HarmonyMessage, 200008],
	["<|reserved_200009|>", 200009],
	["<|reserved_200010|>", 200010],
	["<|reserved_200011|>", 200011],
	[require_specialTokens.HarmonyCall, 200012]
];
function O200KHarmony(bytePairRankDecoder) {
	const specialTokensEncoder = new Map(STATIC_SPECIAL_TOKEN_ENTRIES);
	for (let tokenId = RESERVED_TOKEN_RANGE_START; tokenId < RESERVED_TOKEN_RANGE_END; tokenId += 1) specialTokensEncoder.set(`<|reserved_${tokenId}|>`, tokenId);
	specialTokensEncoder.set(require_specialTokens.EndOfPrompt, 200018);
	return {
		tokenSplitRegex: require_encodingParams_constants.O200K_TOKEN_SPLIT_REGEX,
		bytePairRankDecoder,
		specialTokensEncoder,
		chatFormatter: "harmony"
	};
}
//#endregion
exports.O200KHarmony = O200KHarmony;

//# sourceMappingURL=o200k_harmony.js.map