"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSettings = loadSettings;
exports.saveSettings = saveSettings;
exports.loadDimensionUsage = loadDimensionUsage;
exports.startRebuild = startRebuild;
exports.getRebuildProgress = getRebuildProgress;
const runtime_tool_1 = require("../shared/runtime_tool");
const DEFAULT_SETTINGS = {
    search: {
        semanticThreshold: 0.6,
        scoreMode: "balanced",
        keywordWeight: 10,
        vectorWeight: 0,
        edgeWeight: 0.4
    },
    cloud: {
        enabled: false,
        endpoint: "",
        apiKey: "",
        model: "",
        provider: "cloud",
        ready: false
    }
};
const DEFAULT_DIMENSION_USAGE = {
    memoryTotal: 0,
    memoryMissing: 0,
    memoryDimensions: [],
    chunkTotal: 0,
    chunkMissing: 0,
    chunkDimensions: [],
    grouped: []
};
function normalizeSettings(raw) {
    const parsed = (0, runtime_tool_1.parseObject)(raw, { settings: DEFAULT_SETTINGS });
    const settings = (0, runtime_tool_1.parseObject)(parsed.settings, DEFAULT_SETTINGS);
    return {
        search: Object.assign(Object.assign({}, DEFAULT_SETTINGS.search), (0, runtime_tool_1.parseObject)(settings.search, DEFAULT_SETTINGS.search)),
        cloud: Object.assign(Object.assign({}, DEFAULT_SETTINGS.cloud), (0, runtime_tool_1.parseObject)(settings.cloud, DEFAULT_SETTINGS.cloud))
    };
}
async function loadSettings(ctx) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_get_settings", {});
    return normalizeSettings(result);
}
async function saveSettings(ctx, payload) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_save_settings", {
        settings_json: JSON.stringify(payload)
    });
    const parsed = (0, runtime_tool_1.parseObject)(result, { settings: payload });
    const settings = (0, runtime_tool_1.parseObject)(parsed.settings, payload);
    return {
        search: Object.assign(Object.assign({}, DEFAULT_SETTINGS.search), (0, runtime_tool_1.parseObject)(settings.search, payload.search)),
        cloud: Object.assign(Object.assign({}, DEFAULT_SETTINGS.cloud), (0, runtime_tool_1.parseObject)(settings.cloud, payload.cloud))
    };
}
async function loadDimensionUsage(ctx) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_get_dimension_stats", {});
    const parsed = (0, runtime_tool_1.parseObject)(result, { usage: DEFAULT_DIMENSION_USAGE });
    const usage = (0, runtime_tool_1.parseObject)(parsed.usage, DEFAULT_DIMENSION_USAGE);
    return Object.assign(Object.assign(Object.assign({}, DEFAULT_DIMENSION_USAGE), usage), { memoryDimensions: Array.isArray(usage.memoryDimensions) ? usage.memoryDimensions : [], chunkDimensions: Array.isArray(usage.chunkDimensions) ? usage.chunkDimensions : [], grouped: Array.isArray(usage.grouped) ? usage.grouped : [] });
}
async function startRebuild(ctx, batchSize = 20) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_start_rebuild_embedding_job", {
        batch_size: batchSize
    });
    const parsed = (0, runtime_tool_1.parseObject)(result, { job: null });
    const job = parsed.job;
    return job && typeof job === "object" ? job : null;
}
async function getRebuildProgress(ctx, jobId, batchSize = 20) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_get_rebuild_job_progress", {
        job_id: jobId,
        batch_size: batchSize
    });
    const parsed = (0, runtime_tool_1.parseObject)(result, { job: null });
    const job = parsed.job;
    return job && typeof job === "object" ? job : null;
}
