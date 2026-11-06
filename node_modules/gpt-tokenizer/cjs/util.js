Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/util.ts
function getMaxValueFromMap(map) {
	let max = 0;
	map.forEach((val) => {
		max = Math.max(max, val);
	});
	return max;
}
function escapeRegExp(string) {
	return string.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&");
}
function getSpecialTokenRegex(tokens) {
	const inner = [...tokens].map(escapeRegExp).join("|");
	return new RegExp(`(${inner})`);
}
//#endregion
exports.escapeRegExp = escapeRegExp;
exports.getMaxValueFromMap = getMaxValueFromMap;
exports.getSpecialTokenRegex = getSpecialTokenRegex;

//# sourceMappingURL=util.js.map