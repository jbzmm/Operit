"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSummaryNodes = loadSummaryNodes;
exports.createManualSummary = createManualSummary;
exports.runHookSummary = runHookSummary;
exports.deleteSummaryNode = deleteSummaryNode;
const runtime_tool_1 = require("../shared/runtime_tool");
function asText(value) {
    return String(value == null ? "" : value).trim();
}
function normalizeSummaryNodes(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map(item => {
        const row = (0, runtime_tool_1.parseObject)(item, {});
        return {
            id: asText(row.id),
            title: asText(row.title),
            content: asText(row.content),
            source: asText(row.source),
            folderPath: asText(row.folderPath),
            updatedAt: Number(row.updatedAt) || 0
        };
    });
}
async function loadSummaryNodes(ctx, query, limit = 60) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_get_dashboard", {
        query,
        folder_path: "自动总结",
        limit
    });
    const parsed = (0, runtime_tool_1.parseObject)(result, { dashboard: { nodes: [] } });
    const dashboard = (0, runtime_tool_1.parseObject)(parsed.dashboard, { nodes: [] });
    return normalizeSummaryNodes(dashboard.nodes);
}
async function createManualSummary(ctx, title, content) {
    const normalizedTitle = asText(title) || "手动总结";
    const normalizedContent = asText(content);
    if (!normalizedContent) {
        throw new Error("总结内容不能为空");
    }
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_upsert_node", {
        title: normalizedTitle,
        content: normalizedContent,
        node_type: "summary",
        source: "manual_summary",
        content_type: "text/plain",
        folder_path: "自动总结",
        is_document_node: false
    });
}
async function runHookSummary(ctx, content) {
    const normalizedContent = asText(content);
    if (!normalizedContent) {
        throw new Error("总结内容不能为空");
    }
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "hooks_after_reply", {
        event_payload: JSON.stringify({
            summary: normalizedContent
        })
    });
}
async function deleteSummaryNode(ctx, id) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_delete_node", { id });
}
