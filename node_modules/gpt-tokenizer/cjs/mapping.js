Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_modelsChatEnabled_gen = require("./modelsChatEnabled.gen.js");
const require_modelsMap = require("./modelsMap.js");
const require_specialTokens = require("./specialTokens.js");
//#region src/mapping.ts
const cl100k_base = "cl100k_base";
const gpt2 = "gpt2";
const p50k_base = "p50k_base";
const p50k_edit = "p50k_edit";
const r50k_base = "r50k_base";
const o200k_base = "o200k_base";
const o200k_harmony = "o200k_harmony";
const DEFAULT_ENCODING = o200k_base;
const encodingNames = [
	gpt2,
	p50k_base,
	r50k_base,
	p50k_edit,
	cl100k_base,
	o200k_base,
	o200k_harmony
];
/**
* maps model names to encoding names
* if a model is not listed, it uses the default encoding for new models
* which is `o200k_base`
*/
const modelToEncodingMap = Object.fromEntries(Object.entries(require_modelsMap.modelsMap_exports).flatMap(([encodingName, models]) => models.map((modelName) => [modelName, encodingName])));
const gpt3params = {
	messageSeparator: "\n",
	roleSeparator: "\n"
};
const gpt4params = {
	messageSeparator: "",
	roleSeparator: require_specialTokens.ImSep
};
const chatModelParams = Object.fromEntries(require_modelsChatEnabled_gen.chatEnabledModels.flatMap((modelName) => modelName.startsWith("gpt-3.5") ? [[modelName, gpt3params]] : [[modelName, gpt4params]]));
//#endregion
exports.DEFAULT_ENCODING = DEFAULT_ENCODING;
exports.chatModelParams = chatModelParams;
exports.cl100k_base = cl100k_base;
exports.encodingNames = encodingNames;
exports.gpt2 = gpt2;
exports.modelToEncodingMap = modelToEncodingMap;
exports.o200k_base = o200k_base;
exports.o200k_harmony = o200k_harmony;
exports.p50k_base = p50k_base;
exports.p50k_edit = p50k_edit;
exports.r50k_base = r50k_base;

//# sourceMappingURL=mapping.js.map