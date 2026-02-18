import type { ComposeDslContext } from "../../../types/compose-dsl";
import { callMemoryRuntimeTool, parseObject } from "../shared/runtime_tool";
import { compactText } from "../shared/format";

export interface AttachmentPreviewNode {
  id: string;
  title: string;
  content: string;
  folderPath: string;
  score?: number | null;
}

export interface AttachmentBuildResult {
  scope: {
    query: string;
    folders: string[];
  };
  folders: string[];
  nodes: AttachmentPreviewNode[];
  attachmentText: string;
}

function asText(value: unknown): string {
  return String(value == null ? "" : value).trim();
}

function asFolderList(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(item => asText(item)).filter(Boolean);
}

export async function loadFolders(ctx: ComposeDslContext): Promise<string[]> {
  const result = await callMemoryRuntimeTool(ctx, "memory_list_folders", {});
  const parsed = parseObject(result, { folders: [] });
  return asFolderList(parsed.folders);
}

function normalizePreviewNodes(rawNodes: unknown): AttachmentPreviewNode[] {
  if (!Array.isArray(rawNodes)) {
    return [];
  }

  return rawNodes.map(item => {
    const row = parseObject<Record<string, unknown>>(item, {});
    const score = parseObject<Record<string, unknown>>(row.score, {});
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

function buildAttachmentText(query: string, folderPath: string, nodes: AttachmentPreviewNode[]): string {
  const lines: string[] = [];
  lines.push(`query=${query || "(empty)"}`);
  lines.push(`folder=${folderPath || "(all)"}`);
  lines.push(`hits=${nodes.length}`);
  lines.push("");
  nodes.slice(0, 10).forEach((node, index) => {
    const scoreText = typeof node.score === "number" ? ` score=${node.score.toFixed(4)}` : "";
    lines.push(`${index + 1}. ${node.title || "(untitled)"}${scoreText}`);
    lines.push(`   folder: ${node.folderPath || "(none)"}`);
    lines.push(`   ${compactText(node.content, 160)}`);
  });
  return lines.join("\n");
}

export async function buildAttachmentScope(
  ctx: ComposeDslContext,
  query: string,
  folderPath: string,
  limit: number
): Promise<AttachmentBuildResult> {
  const scopeResult = await callMemoryRuntimeTool(ctx, "attachment_select_scope", {
    user_query: query,
    folder_path: folderPath,
    limit
  });
  const parsedScope = parseObject(scopeResult, { scope: { query: query, folders: [] } });
  const scope = parseObject(parsedScope.scope, { query: query, folders: [] });

  const dashboardResult = await callMemoryRuntimeTool(ctx, "memory_get_dashboard", {
    query,
    folder_path: folderPath,
    limit
  });
  const parsedDashboard = parseObject(dashboardResult, { dashboard: { nodes: [], folders: [] } });
  const dashboard = parseObject(parsedDashboard.dashboard, { nodes: [], folders: [] });
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
