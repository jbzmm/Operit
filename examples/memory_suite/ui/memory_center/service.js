"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDashboard = loadDashboard;
exports.bootstrapDashboard = bootstrapDashboard;
exports.upsertNode = upsertNode;
exports.deleteNode = deleteNode;
exports.bulkDeleteNodes = bulkDeleteNodes;
exports.moveNodesToFolder = moveNodesToFolder;
exports.createFolder = createFolder;
exports.renameFolder = renameFolder;
exports.deleteFolder = deleteFolder;
exports.upsertLink = upsertLink;
exports.deleteLink = deleteLink;
const runtime_tool_1 = require("../shared/runtime_tool");
const EMPTY_DASHBOARD = {
    profileId: "default",
    query: "",
    folderPath: "",
    nodes: [],
    links: [],
    folders: [],
    settings: {},
    cloud: {},
    dimensionStats: {},
    rebuildJob: null,
    stats: {
        nodeCount: 0,
        linkCount: 0,
        chunkCount: 0
    }
};
function normalizeDashboard(raw) {
    const parsed = (0, runtime_tool_1.parseObject)(raw, { dashboard: EMPTY_DASHBOARD });
    const dashboard = (0, runtime_tool_1.parseObject)(parsed.dashboard, EMPTY_DASHBOARD);
    return Object.assign(Object.assign(Object.assign({}, EMPTY_DASHBOARD), dashboard), { nodes: Array.isArray(dashboard.nodes) ? dashboard.nodes : [], links: Array.isArray(dashboard.links) ? dashboard.links : [], folders: Array.isArray(dashboard.folders) ? dashboard.folders : [] });
}
async function loadDashboard(ctx, query, folderPath, limit = 120) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_get_dashboard", {
        query,
        folder_path: folderPath,
        limit
    });
    return normalizeDashboard(result);
}
async function bootstrapDashboard(ctx, query, folderPath, limit = 120) {
    const result = await (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_bootstrap", {
        query,
        folder_path: folderPath,
        limit
    });
    return normalizeDashboard(result);
}
async function upsertNode(ctx, payload) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_upsert_node", payload);
}
async function deleteNode(ctx, id) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_delete_node", { id });
}
async function bulkDeleteNodes(ctx, ids) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_bulk_delete_nodes", {
        ids_json: JSON.stringify(ids)
    });
}
async function moveNodesToFolder(ctx, ids, targetFolderPath) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_move_nodes_to_folder", {
        ids_json: JSON.stringify(ids),
        target_folder_path: targetFolderPath
    });
}
async function createFolder(ctx, folderPath) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_create_folder", {
        folder_path: folderPath
    });
}
async function renameFolder(ctx, oldPath, newPath) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_rename_folder", {
        old_path: oldPath,
        new_path: newPath
    });
}
async function deleteFolder(ctx, folderPath) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_delete_folder", {
        folder_path: folderPath
    });
}
async function upsertLink(ctx, payload) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_upsert_link", payload);
}
async function deleteLink(ctx, id) {
    return (0, runtime_tool_1.callMemoryRuntimeTool)(ctx, "memory_delete_link", { id });
}
