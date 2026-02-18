import type { ComposeDslContext } from "../../../types/compose-dsl";
import { callMemoryRuntimeTool, parseObject } from "../shared/runtime_tool";

export interface MemoryNodeItem {
  id: string;
  title: string;
  content: string;
  folderPath: string;
  nodeType: string;
  source: string;
  contentType: string;
  isDocumentNode: boolean;
  importance: number;
  credibility: number;
  tags: any[];
  createdAt: number;
  updatedAt: number;
  score?: {
    final: number;
    keyword: number;
    vector: number;
    edge: number;
    recency: number;
  } | null;
}

export interface MemoryLinkItem {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  linkType: string;
  weight: number;
  description: string;
  updatedAt: number;
}

export interface DashboardPayload {
  profileId: string;
  query: string;
  folderPath: string;
  nodes: MemoryNodeItem[];
  links: MemoryLinkItem[];
  folders: string[];
  settings: Record<string, unknown>;
  cloud: Record<string, unknown>;
  dimensionStats: Record<string, unknown>;
  rebuildJob: Record<string, unknown> | null;
  stats: {
    nodeCount: number;
    linkCount: number;
    chunkCount: number;
  };
}

const EMPTY_DASHBOARD: DashboardPayload = {
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

function normalizeDashboard(raw: unknown): DashboardPayload {
  const parsed = parseObject(raw, { dashboard: EMPTY_DASHBOARD });
  const dashboard = parseObject(parsed.dashboard, EMPTY_DASHBOARD);
  return {
    ...EMPTY_DASHBOARD,
    ...dashboard,
    nodes: Array.isArray(dashboard.nodes) ? dashboard.nodes : [],
    links: Array.isArray(dashboard.links) ? dashboard.links : [],
    folders: Array.isArray(dashboard.folders) ? dashboard.folders : []
  };
}

export async function loadDashboard(
  ctx: ComposeDslContext,
  query: string,
  folderPath: string,
  limit = 120
): Promise<DashboardPayload> {
  const result = await callMemoryRuntimeTool(ctx, "memory_get_dashboard", {
    query,
    folder_path: folderPath,
    limit
  });
  return normalizeDashboard(result);
}

export async function bootstrapDashboard(
  ctx: ComposeDslContext,
  query: string,
  folderPath: string,
  limit = 120
): Promise<DashboardPayload> {
  const result = await callMemoryRuntimeTool(ctx, "memory_bootstrap", {
    query,
    folder_path: folderPath,
    limit
  });
  return normalizeDashboard(result);
}

export async function upsertNode(ctx: ComposeDslContext, payload: Record<string, unknown>): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_upsert_node", payload);
}

export async function deleteNode(ctx: ComposeDslContext, id: string): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_delete_node", { id });
}

export async function bulkDeleteNodes(ctx: ComposeDslContext, ids: string[]): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_bulk_delete_nodes", {
    ids_json: JSON.stringify(ids)
  });
}

export async function moveNodesToFolder(
  ctx: ComposeDslContext,
  ids: string[],
  targetFolderPath: string
): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_move_nodes_to_folder", {
    ids_json: JSON.stringify(ids),
    target_folder_path: targetFolderPath
  });
}

export async function createFolder(ctx: ComposeDslContext, folderPath: string): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_create_folder", {
    folder_path: folderPath
  });
}

export async function renameFolder(
  ctx: ComposeDslContext,
  oldPath: string,
  newPath: string
): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_rename_folder", {
    old_path: oldPath,
    new_path: newPath
  });
}

export async function deleteFolder(ctx: ComposeDslContext, folderPath: string): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_delete_folder", {
    folder_path: folderPath
  });
}

export async function upsertLink(
  ctx: ComposeDslContext,
  payload: Record<string, unknown>
): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_upsert_link", payload);
}

export async function deleteLink(ctx: ComposeDslContext, id: string): Promise<any> {
  return callMemoryRuntimeTool(ctx, "memory_delete_link", { id });
}
