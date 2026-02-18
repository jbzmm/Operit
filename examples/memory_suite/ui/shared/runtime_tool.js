"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callMemoryRuntimeTool = callMemoryRuntimeTool;
exports.asErrorText = asErrorText;
exports.parseObject = parseObject;
function parseMaybeJson(value) {
    if (typeof value !== "string") {
        return value;
    }
    const text = value.trim();
    if (!text) {
        return value;
    }
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        return value;
    }
}
function normalizeError(error) {
    if (error instanceof Error) {
        return error.message || "unknown error";
    }
    return String(error || "unknown error");
}
function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
}
async function resolveToolCandidates(ctx, toolName) {
    var _a;
    const currentPackageName = String(((_a = ctx.getCurrentPackageName) === null || _a === void 0 ? void 0 : _a.call(ctx)) || "").trim();
    const candidates = [];
    if (ctx.resolveToolName) {
        try {
            const resolvedBySubpackage = await ctx.resolveToolName({
                packageName: currentPackageName,
                subpackageId: "memory_runtime",
                toolName,
                preferImported: true
            });
            const normalized = String(resolvedBySubpackage || "").trim();
            if (normalized) {
                candidates.push(normalized);
            }
        }
        catch (_b) {
            // ignore resolve failure and use fallback candidates
        }
        try {
            const resolvedByPackage = await ctx.resolveToolName({
                packageName: currentPackageName,
                toolName,
                preferImported: true
            });
            const normalized = String(resolvedByPackage || "").trim();
            if (normalized) {
                candidates.push(normalized);
            }
        }
        catch (_c) {
            // ignore resolve failure and use fallback candidates
        }
    }
    candidates.push(`memory_runtime:${toolName}`);
    if (currentPackageName) {
        candidates.push(`${currentPackageName}:${toolName}`);
    }
    return unique(candidates);
}
async function callMemoryRuntimeTool(ctx, toolName, params) {
    const candidates = await resolveToolCandidates(ctx, toolName);
    let lastError = "tool call failed";
    for (const candidate of candidates) {
        try {
            const result = await ctx.callTool(candidate, params || {});
            const parsed = parseMaybeJson(result);
            return parsed;
        }
        catch (error) {
            lastError = normalizeError(error);
        }
    }
    throw new Error(`${toolName}: ${lastError}`);
}
function asErrorText(error) {
    return normalizeError(error);
}
function parseObject(value, fallback) {
    const parsed = parseMaybeJson(value);
    if (!parsed || typeof parsed !== "object") {
        return fallback;
    }
    return parsed;
}
