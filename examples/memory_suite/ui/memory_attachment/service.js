"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFolders = loadFolders;
exports.buildAttachmentScope = buildAttachmentScope;
const runtime_tool_1 = require("../shared/runtime_tool");
const format_1 = require("../shared/format");
function asText(value) {
    return String(value == null ? "" : value).trim();
}
function asFolderList(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map(item => asText(item)).filter(Boolean);
}
async function loadFolders(ctx) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_list_folders", {});
    const parsed = (0, runtime_tool_1.parseObject)(result, { folders: [] });
    return asFolderList(parsed.folders);
}
function normalizePreviewNodes(rawNodes) {
    if (!Array.isArray(rawNodes)) {
        return [];
    }
    return rawNodes.map(item => {
        const row = (0, runtime_tool_1.parseObject)(item, {});
        const score = (0, runtime_tool_1.parseObject)(row.score, {});
        const finalScore = Number(score.final);
        return {
            id: asText(row.id),
            title: asText(row.title),
            content: asText(row.content),
            folderPath: asText(row.folderPath),
            score: Number.isFinite(finalScore) ? finalScore : null
        };
    });
}
function buildAttachmentText(query, folderPath, nodes) {
    const lines = [];
    lines.push(`query=${query || "(empty)"}`);
    lines.push(`folder=${folderPath || "(all)"}`);
    lines.push(`hits=${nodes.length}`);
    lines.push("");
    nodes.slice(0, 10).forEach((node, index) => {
        const scoreText = typeof node.score === "number" ? ` score=${node.score.toFixed(4)}` : "";
        lines.push(`${index + 1}. ${node.title || "(untitled)"}${scoreText}`);
        lines.push(`   folder: ${node.folderPath || "(none)"}`);
        lines.push(`   ${(0, format_1.compactText)(node.content, 160)}`);
    });
    return lines.join("\n");
}
async function buildAttachmentScope(ctx, query, folderPath, limit) {
    const scopeResult = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "attachment_select_scope", {
        user_query: query,
        folder_path: folderPath,
        limit
    });
    const parsedScope = (0, runtime_tool_1.parseObject)(scopeResult, { scope: { query: query, folders: [] } });
    const scope = (0, runtime_tool_1.parseObject)(parsedScope.scope, { query: query, folders: [] });
    const dashboardResult = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_get_dashboard", {
        query,
        folder_path: folderPath,
        limit
    });
    const parsedDashboard = (0, runtime_tool_1.parseObject)(dashboardResult, { dashboard: { nodes: [], folders: [] } });
    const dashboard = (0, runtime_tool_1.parseObject)(parsedDashboard.dashboard, { nodes: [], folders: [] });
    const nodes = normalizePreviewNodes(dashboard.nodes);
    const folders = asFolderList(dashboard.folders);
    const attachmentText = buildAttachmentText(query, folderPath, nodes);
    return {
        scope: {
            query: asText(scope.query) || query,
            folders: asFolderList(scope.folders)
        },
        folders,
        nodes,
        attachmentText
    };
}
