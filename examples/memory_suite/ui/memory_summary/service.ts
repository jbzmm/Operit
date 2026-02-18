import type { ComposeDslContext } from "../../../types/compose-dsl";
import { callMemoryRuntimeTool, parseObject } from "../shared/runtime_tool";

export interface SummaryNodeItem {
  id: string;
  title: string;
  content: string;
  source: string;
  folderPath: string;
  updatedAt: number;
}

function asText(value: unknown): string {
  return String(value == null ? "" : value).trim();
}

function normalizeSummaryNodes(raw: unknown): SummaryNodeItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(item => {
    const row = parseObject<Record<string, unknown>>(item, {});
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

export async function loadSummaryNodes(
  ctx: ComposeDslContext,
  query: string,
  limit = 60
): Promise<SummaryNodeItem[]> {
  const result = await callMemoryRuntimeTool(ctx, "memory_get_dashboard", {
    query,
    folder_path: "自动总结",
    limit
  });
  const parsed = parseObject(result, { dashboard: { nodes: [] } });
  const dashboard = parseObject(parsed.dashboard, { nodes: [] });
  return normalizeSummaryNodes(dashboard.nodes);
}

export async function createManualSummary(
  ctx: ComposeDslContext,
  title: string,
  content: string
): Promise<Record<string, unknown>> {
  const normalizedTitle = asText(title) || "手动总结";
  const normalizedContent = asText(content);
  if (!normalizedContent) {
    throw new Error("总结内容不能为空");
  }

  return callMemoryRuntimeTool(ctx, "memory_upsert_node", {
    title: normalizedTitle,
    content: normalizedContent,
    node_type: "summary",
    source: "manual_summary",
    content_type: "text/plain",
    folder_path: "自动总结",
    is_document_node: false
  });
}

export async function runHookSummary(
  ctx: ComposeDslContext,
  content: string
): Promise<Record<string, unknown>> {
  const normalizedContent = asText(content);
  if (!normalizedContent) {
    throw new Error("总结内容不能为空");
  }
  return callMemoryRuntimeTool(ctx, "hooks_after_reply", {
    event_payload: JSON.stringify({
      summary: normalizedContent
    })
  });
}

export async function deleteSummaryNode(ctx: ComposeDslContext, id: string): Promise<Record<string, unknown>> {
  return callMemoryRuntimeTool(ctx, "memory_delete_node", { id });
}
