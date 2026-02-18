import type { ComposeDslContext, ComposeNode } from "../../../types/compose-dsl";
import {
  bootstrapDashboard,
  bulkDeleteNodes,
  createFolder,
  deleteFolder,
  deleteLink,
  deleteNode,
  loadDashboard,
  moveNodesToFolder,
  renameFolder,
  upsertLink,
  upsertNode,
  type DashboardPayload,
  type MemoryLinkItem,
  type MemoryNodeItem
} from "./service";
import { asErrorText } from "../shared/runtime_tool";
import { clampNumber, compactText, formatDateTime, formatPercent, toNumberInput } from "../shared/format";
import {
  getRebuildProgress,
  loadDimensionUsage,
  loadSettings,
  saveSettings,
  startRebuild,
  type DimensionUsage,
  type RebuildJob,
  type SettingsPayload
} from "../memory_settings/service";

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

const DEFAULT_SETTINGS_PAYLOAD: SettingsPayload = {
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

const DEFAULT_DIMENSION_USAGE: DimensionUsage = {
  memoryTotal: 0,
  memoryMissing: 0,
  memoryDimensions: [],
  chunkTotal: 0,
  chunkMissing: 0,
  chunkDimensions: [],
  grouped: []
};

function useValueState<T>(ctx: ComposeDslContext, key: string, initialValue: T): { value: T; set: (value: T) => void } {
  const pair = ctx.useState<T>(key, initialValue);
  return {
    value: pair[0],
    set: pair[1]
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeId(value: unknown): string {
  return String(value == null ? "" : value).trim();
}

function splitDocumentChunks(content: string): string[] {
  return String(content || "")
    .split(/\n\s*\n/g)
    .map(item => item.trim())
    .filter(Boolean);
}

function buildDocumentContent(chunks: string[]): string {
  return chunks
    .map(item => String(item || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function deriveTitleFromPath(path: string): string {
  const normalized = String(path || "").replace(/\\/g, "/").trim();
  const segments = normalized.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : "导入文档";
}

function parseFileText(raw: unknown): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (raw && typeof raw === "object" && typeof (raw as { content?: unknown }).content === "string") {
    return String((raw as { content: string }).content);
  }
  return "";
}

function compactDimensionList(items: Array<{ dimension: number; count: number }>): string {
  if (!Array.isArray(items) || items.length <= 0) {
    return "无";
  }
  return items
    .slice(0, 8)
    .map(item => `${item.dimension}D×${item.count}`)
    .join(" · ");
}

type GraphPoint = {
  x: number;
  y: number;
};

function asFiniteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeGraphLayout(value: unknown): Record<string, GraphPoint> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, GraphPoint> = {};
  for (const [rawId, rawPoint] of Object.entries(value as Record<string, unknown>)) {
    const id = normalizeId(rawId);
    if (!id || !rawPoint || typeof rawPoint !== "object" || Array.isArray(rawPoint)) {
      continue;
    }
    const point = rawPoint as { x?: unknown; y?: unknown };
    result[id] = {
      x: asFiniteNumber(point.x, 120),
      y: asFiniteNumber(point.y, 120)
    };
  }
  return result;
}

function ensureGraphLayout(nodeIds: string[], currentLayout: Record<string, GraphPoint>): Record<string, GraphPoint> {
  const uniqueIds = Array.from(new Set(nodeIds.map(item => normalizeId(item)).filter(Boolean)));
  const nextLayout: Record<string, GraphPoint> = {};
  const missing: string[] = [];

  uniqueIds.forEach(id => {
    const current = currentLayout[id];
    if (current && Number.isFinite(current.x) && Number.isFinite(current.y)) {
      nextLayout[id] = {
        x: current.x,
        y: current.y
      };
    } else {
      missing.push(id);
    }
  });

  if (missing.length > 0) {
    const centerX = 500;
    const centerY = 170;
    const radius = Math.max(90, 80 + (missing.length * 9));
    missing.forEach((id, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, missing.length);
      nextLayout[id] = {
        x: centerX + (Math.cos(angle) * radius),
        y: centerY + (Math.sin(angle) * radius)
      };
    });
  }

  return nextLayout;
}

export function buildMemoryCenterScreen(ctx: ComposeDslContext): ComposeNode {
  const initializedState = useValueState(ctx, "mc_initialized", false);
  const loadingState = useValueState(ctx, "mc_loading", false);
  const errorState = useValueState(ctx, "mc_error", "");

  const queryState = useValueState(ctx, "mc_query", "");
  const selectedFolderState = useValueState(ctx, "mc_selected_folder", "");
  const showFolderPanelState = useValueState(ctx, "mc_show_folder_panel", true);

  const dashboardState = useValueState<DashboardPayload>(ctx, "mc_dashboard", EMPTY_DASHBOARD);

  const boxModeState = useValueState(ctx, "mc_box_mode", false);
  const linkModeState = useValueState(ctx, "mc_link_mode", false);
  const selectedIdsState = useValueState<string[]>(ctx, "mc_selected_ids", []);
  const graphLayoutState = useValueState<Record<string, GraphPoint>>(ctx, "mc_graph_layout", {});

  const editorOpenState = useValueState(ctx, "mc_editor_open", false);
  const editorIdState = useValueState(ctx, "mc_editor_id", "");
  const editorTitleState = useValueState(ctx, "mc_editor_title", "");
  const editorContentState = useValueState(ctx, "mc_editor_content", "");
  const editorFolderState = useValueState(ctx, "mc_editor_folder", "");
  const editorSourceState = useValueState(ctx, "mc_editor_source", "user_input");
  const editorContentTypeState = useValueState(ctx, "mc_editor_content_type", "text/plain");
  const editorIsDocumentState = useValueState(ctx, "mc_editor_is_document", false);

  const importTitleState = useValueState(ctx, "mc_import_title", "");
  const importContentState = useValueState(ctx, "mc_import_content", "");
  const importPathState = useValueState(ctx, "mc_import_path", "");

  const documentOpenState = useValueState(ctx, "mc_document_open", false);
  const documentNodeIdState = useValueState(ctx, "mc_document_node_id", "");
  const documentTitleState = useValueState(ctx, "mc_document_title", "");
  const documentFolderState = useValueState(ctx, "mc_document_folder", "");
  const documentSourceState = useValueState(ctx, "mc_document_source", "user_input");
  const documentContentTypeState = useValueState(ctx, "mc_document_content_type", "text/plain");
  const documentSearchState = useValueState(ctx, "mc_document_search", "");
  const documentChunksState = useValueState<string[]>(ctx, "mc_document_chunks", []);

  const moveTargetFolderState = useValueState(ctx, "mc_move_target_folder", "");

  const folderCreateInputState = useValueState(ctx, "mc_folder_create_input", "");
  const folderRenameOldState = useValueState(ctx, "mc_folder_rename_old", "");
  const folderRenameNewState = useValueState(ctx, "mc_folder_rename_new", "");
  const folderDeleteInputState = useValueState(ctx, "mc_folder_delete_input", "");

  const linkSourceState = useValueState(ctx, "mc_link_source", "");
  const linkTargetState = useValueState(ctx, "mc_link_target", "");
  const linkTypeState = useValueState(ctx, "mc_link_type", "related");
  const linkWeightState = useValueState(ctx, "mc_link_weight", "1");
  const linkDescriptionState = useValueState(ctx, "mc_link_description", "");

  const edgeDetailOpenState = useValueState(ctx, "mc_edge_detail_open", false);
  const edgeEditModeState = useValueState(ctx, "mc_edge_edit_mode", false);
  const edgeIdState = useValueState(ctx, "mc_edge_id", "");
  const edgeSourceState = useValueState(ctx, "mc_edge_source", "");
  const edgeTargetState = useValueState(ctx, "mc_edge_target", "");
  const edgeTypeState = useValueState(ctx, "mc_edge_type", "related");
  const edgeWeightState = useValueState(ctx, "mc_edge_weight", "1");
  const edgeDescriptionState = useValueState(ctx, "mc_edge_description", "");

  const selectedNodeIdState = useValueState(ctx, "mc_selected_node_id", "");
  const memoryInfoOpenState = useValueState(ctx, "mc_memory_info_open", false);
  const linkDialogOpenState = useValueState(ctx, "mc_link_dialog_open", false);
  const batchDeleteConfirmOpenState = useValueState(ctx, "mc_batch_delete_confirm_open", false);
  const importDialogOpenState = useValueState(ctx, "mc_import_dialog_open", false);

  const settingsDialogOpenState = useValueState(ctx, "mc_settings_dialog_open", false);
  const settingsLoadingState = useValueState(ctx, "mc_settings_loading", false);
  const semanticThresholdState = useValueState(
    ctx,
    "mc_settings_semantic_threshold",
    String(DEFAULT_SETTINGS_PAYLOAD.search.semanticThreshold)
  );
  const scoreModeState = useValueState(ctx, "mc_settings_score_mode", DEFAULT_SETTINGS_PAYLOAD.search.scoreMode);
  const keywordWeightState = useValueState(
    ctx,
    "mc_settings_keyword_weight",
    String(DEFAULT_SETTINGS_PAYLOAD.search.keywordWeight)
  );
  const vectorWeightState = useValueState(
    ctx,
    "mc_settings_vector_weight",
    String(DEFAULT_SETTINGS_PAYLOAD.search.vectorWeight)
  );
  const edgeWeightSettingState = useValueState(
    ctx,
    "mc_settings_edge_weight",
    String(DEFAULT_SETTINGS_PAYLOAD.search.edgeWeight)
  );

  const cloudEnabledState = useValueState(ctx, "mc_settings_cloud_enabled", DEFAULT_SETTINGS_PAYLOAD.cloud.enabled);
  const cloudEndpointState = useValueState(ctx, "mc_settings_cloud_endpoint", DEFAULT_SETTINGS_PAYLOAD.cloud.endpoint);
  const cloudApiKeyState = useValueState(ctx, "mc_settings_cloud_api_key", DEFAULT_SETTINGS_PAYLOAD.cloud.apiKey);
  const cloudModelState = useValueState(ctx, "mc_settings_cloud_model", DEFAULT_SETTINGS_PAYLOAD.cloud.model);
  const cloudProviderState = useValueState(ctx, "mc_settings_cloud_provider", DEFAULT_SETTINGS_PAYLOAD.cloud.provider);
  const dimensionUsageState = useValueState<DimensionUsage>(ctx, "mc_settings_dimension_usage", DEFAULT_DIMENSION_USAGE);
  const rebuildJobState = useValueState<RebuildJob | null>(ctx, "mc_settings_rebuild_job", null);

  const setLoading = (loading: boolean): void => {
    loadingState.set(loading);
  };

  const setError = (message: string): void => {
    errorState.set(message.trim());
  };

  const clearError = (): void => {
    setError("");
  };

  const setSettingsLoading = (loading: boolean): void => {
    settingsLoadingState.set(loading);
  };

  const applyLoadedSettings = (payload: SettingsPayload): void => {
    const search = payload?.search || DEFAULT_SETTINGS_PAYLOAD.search;
    const cloud = payload?.cloud || DEFAULT_SETTINGS_PAYLOAD.cloud;
    semanticThresholdState.set(String(search.semanticThreshold));
    scoreModeState.set(String(search.scoreMode || "balanced"));
    keywordWeightState.set(String(search.keywordWeight));
    vectorWeightState.set(String(search.vectorWeight));
    edgeWeightSettingState.set(String(search.edgeWeight));

    cloudEnabledState.set(!!cloud.enabled);
    cloudEndpointState.set(String(cloud.endpoint || ""));
    cloudApiKeyState.set(String(cloud.apiKey || ""));
    cloudModelState.set(String(cloud.model || ""));
    cloudProviderState.set(String(cloud.provider || "cloud"));
  };

  const collectSettingsPayload = (): SettingsPayload => ({
    search: {
      semanticThreshold: clampNumber(semanticThresholdState.value, 0, 1, DEFAULT_SETTINGS_PAYLOAD.search.semanticThreshold),
      scoreMode: String(scoreModeState.value || "balanced").trim() || "balanced",
      keywordWeight: clampNumber(keywordWeightState.value, 0, 1000, DEFAULT_SETTINGS_PAYLOAD.search.keywordWeight),
      vectorWeight: clampNumber(vectorWeightState.value, 0, 1000, DEFAULT_SETTINGS_PAYLOAD.search.vectorWeight),
      edgeWeight: clampNumber(edgeWeightSettingState.value, 0, 1000, DEFAULT_SETTINGS_PAYLOAD.search.edgeWeight)
    },
    cloud: {
      enabled: !!cloudEnabledState.value,
      endpoint: String(cloudEndpointState.value || "").trim(),
      apiKey: String(cloudApiKeyState.value || "").trim(),
      model: String(cloudModelState.value || "").trim(),
      provider: String(cloudProviderState.value || "").trim() || "cloud",
      ready: false
    }
  });

  const refreshSettingsData = async (): Promise<void> => {
    setSettingsLoading(true);
    try {
      const payload = await loadSettings(ctx);
      const usage = await loadDimensionUsage(ctx);
      applyLoadedSettings(payload);
      dimensionUsageState.set(usage);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setSettingsLoading(false);
    }
  };

  const openSettingsDialog = async (): Promise<void> => {
    settingsDialogOpenState.set(true);
    await refreshSettingsData();
  };

  const saveSettingsAction = async (): Promise<void> => {
    setSettingsLoading(true);
    try {
      const payload = collectSettingsPayload();
      const saved = await saveSettings(ctx, payload);
      applyLoadedSettings(saved);
      const usage = await loadDimensionUsage(ctx);
      dimensionUsageState.set(usage);
      clearError();
      await refreshDashboard();
      if (ctx.showToast) {
        await ctx.showToast("记忆搜索设置已保存");
      }
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setSettingsLoading(false);
    }
  };

  const startRebuildAction = async (): Promise<void> => {
    setSettingsLoading(true);
    try {
      const job = await startRebuild(ctx, 20);
      rebuildJobState.set(job);
      const usage = await loadDimensionUsage(ctx);
      dimensionUsageState.set(usage);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setSettingsLoading(false);
    }
  };

  const refreshRebuildProgressAction = async (): Promise<void> => {
    const job = rebuildJobState.value;
    if (!job || !job.jobId) {
      setError("暂无可刷新的重建任务");
      return;
    }
    setSettingsLoading(true);
    try {
      const next = await getRebuildProgress(ctx, job.jobId, 20);
      rebuildJobState.set(next);
      const usage = await loadDimensionUsage(ctx);
      dimensionUsageState.set(usage);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setSettingsLoading(false);
    }
  };

  const selectedIds = asArray<string>(selectedIdsState.value)
    .map(item => normalizeId(item))
    .filter(Boolean);

  const setSelectedIds = (values: string[]): void => {
    selectedIdsState.set(Array.from(new Set(values.map(item => normalizeId(item)).filter(Boolean))));
  };

  const toggleSelectedId = (id: string): void => {
    const normalized = normalizeId(id);
    if (!normalized) {
      return;
    }
    if (selectedIds.includes(normalized)) {
      setSelectedIds(selectedIds.filter(item => item !== normalized));
    } else {
      setSelectedIds(selectedIds.concat([normalized]));
    }
  };

  const refreshDashboard = async (): Promise<void> => {
    setLoading(true);
    try {
      const dashboard = await loadDashboard(
        ctx,
        queryState.value,
        selectedFolderState.value,
        180
      );
      dashboardState.set(dashboard);
      graphLayoutState.set(
        ensureGraphLayout(
          asArray<MemoryNodeItem>(dashboard.nodes).map(item => normalizeId(item.id)),
          normalizeGraphLayout(graphLayoutState.value)
        )
      );
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const bootstrap = async (): Promise<void> => {
    setLoading(true);
    try {
      const dashboard = await bootstrapDashboard(
        ctx,
        queryState.value,
        selectedFolderState.value,
        180
      );
      dashboardState.set(dashboard);
      graphLayoutState.set(
        ensureGraphLayout(
          asArray<MemoryNodeItem>(dashboard.nodes).map(item => normalizeId(item.id)),
          normalizeGraphLayout(graphLayoutState.value)
        )
      );
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (node?: MemoryNodeItem): void => {
    memoryInfoOpenState.set(false);
    if (!node) {
      editorIdState.set("");
      editorTitleState.set("");
      editorContentState.set("");
      editorFolderState.set(selectedFolderState.value);
      editorSourceState.set("user_input");
      editorContentTypeState.set("text/plain");
      editorIsDocumentState.set(false);
      editorOpenState.set(true);
      return;
    }

    editorIdState.set(node.id);
    editorTitleState.set(node.title || "");
    editorContentState.set(node.content || "");
    editorFolderState.set(node.folderPath || "");
    editorSourceState.set(node.source || "user_input");
    editorContentTypeState.set(node.contentType || "text/plain");
    editorIsDocumentState.set(!!node.isDocumentNode);
    editorOpenState.set(true);
  };

  const saveEditor = async (): Promise<void> => {
    const title = editorTitleState.value.trim();
    if (!title) {
      setError("标题不能为空");
      return;
    }

    setLoading(true);
    try {
      const chunks = editorIsDocumentState.value
        ? editorContentState.value
            .split(/\n\s*\n/g)
            .map(item => item.trim())
            .filter(Boolean)
        : [];

      await upsertNode(ctx, {
        id: editorIdState.value || undefined,
        title,
        content: editorContentState.value,
        folder_path: editorFolderState.value,
        source: editorSourceState.value,
        content_type: editorContentTypeState.value,
        node_type: editorIsDocumentState.value ? "document" : "text",
        is_document_node: editorIsDocumentState.value,
        chunks_json: JSON.stringify(chunks)
      });

      editorOpenState.set(false);
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const importDocumentText = async (): Promise<void> => {
    const title = importTitleState.value.trim();
    const content = importContentState.value.trim();
    if (!title || !content) {
      setError("导入文本文档需要标题和内容");
      return;
    }

    setLoading(true);
    try {
      const chunks = content
        .split(/\n\s*\n/g)
        .map(item => item.trim())
        .filter(Boolean);

      await upsertNode(ctx, {
        title,
        content,
        folder_path: selectedFolderState.value,
        source: "import_text",
        content_type: "text/plain",
        node_type: "document",
        is_document_node: true,
        chunks_json: JSON.stringify(chunks)
      });

      importTitleState.set("");
      importContentState.set("");
      importDialogOpenState.set(false);
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const importDocumentFromPath = async (): Promise<void> => {
    const path = importPathState.value.trim();
    if (!path) {
      setError("请输入要导入的文件路径");
      return;
    }

    setLoading(true);
    try {
      const raw = await ctx.callTool("read_file_full", { path });
      const content = parseFileText(raw).trim();
      if (!content) {
        setError("读取到的文件内容为空");
        return;
      }

      const title = importTitleState.value.trim() || deriveTitleFromPath(path);
      const chunks = splitDocumentChunks(content);

      await upsertNode(ctx, {
        title,
        content,
        folder_path: selectedFolderState.value,
        source: "import_file",
        content_type: "text/plain",
        node_type: "document",
        is_document_node: true,
        chunks_json: JSON.stringify(chunks)
      });

      importPathState.set("");
      importTitleState.set("");
      importContentState.set("");
      importDialogOpenState.set(false);
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const openDocumentView = (node: MemoryNodeItem): void => {
    if (!node.isDocumentNode) {
      setError("仅文档节点支持分块查看与编辑");
      return;
    }

    const nodeId = normalizeId(node.id);
    if (!nodeId) {
      setError("文档节点缺少有效ID");
      return;
    }

    documentNodeIdState.set(nodeId);
    documentTitleState.set(node.title || "");
    documentFolderState.set(node.folderPath || "");
    documentSourceState.set(node.source || "user_input");
    documentContentTypeState.set(node.contentType || "text/plain");
    documentSearchState.set("");
    documentChunksState.set(splitDocumentChunks(node.content || ""));
    documentOpenState.set(true);
    memoryInfoOpenState.set(false);
  };

  const closeDocumentView = (): void => {
    documentOpenState.set(false);
    documentSearchState.set("");
  };

  const updateDocumentChunk = (chunkIndex: number, value: string): void => {
    const chunks = asArray<string>(documentChunksState.value).map(item => String(item == null ? "" : item));
    if (chunkIndex < 0 || chunkIndex >= chunks.length) {
      return;
    }
    chunks[chunkIndex] = value;
    documentChunksState.set(chunks);
  };

  const addDocumentChunk = (): void => {
    const chunks = asArray<string>(documentChunksState.value).map(item => String(item == null ? "" : item));
    documentChunksState.set(chunks.concat([""]));
  };

  const removeDocumentChunk = (chunkIndex: number): void => {
    const chunks = asArray<string>(documentChunksState.value).map(item => String(item == null ? "" : item));
    if (chunkIndex < 0 || chunkIndex >= chunks.length) {
      return;
    }
    documentChunksState.set(chunks.filter((_, index) => index !== chunkIndex));
  };

  const saveDocumentView = async (): Promise<void> => {
    const nodeId = normalizeId(documentNodeIdState.value);
    const title = documentTitleState.value.trim();
    if (!nodeId) {
      setError("文档节点ID无效");
      return;
    }
    if (!title) {
      setError("文档标题不能为空");
      return;
    }

    const chunks = asArray<string>(documentChunksState.value)
      .map(item => String(item == null ? "" : item).trim())
      .filter(Boolean);
    if (chunks.length <= 0) {
      setError("文档至少保留一个有效分块");
      return;
    }

    setLoading(true);
    try {
      await upsertNode(ctx, {
        id: nodeId,
        title,
        content: buildDocumentContent(chunks),
        folder_path: documentFolderState.value.trim(),
        source: documentSourceState.value.trim() || "user_input",
        content_type: documentContentTypeState.value.trim() || "text/plain",
        node_type: "document",
        is_document_node: true,
        chunks_json: JSON.stringify(chunks)
      });
      documentOpenState.set(false);
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const removeOneNode = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteNode(ctx, id);
      setSelectedIds(selectedIds.filter(item => item !== id));
      if (selectedNodeIdState.value === id) {
        selectedNodeIdState.set("");
        memoryInfoOpenState.set(false);
      }
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const removeSelectedNodes = async (): Promise<void> => {
    if (selectedIds.length <= 0) {
      setError("请先选择要删除的节点");
      return;
    }

    setLoading(true);
    try {
      await bulkDeleteNodes(ctx, selectedIds);
      setSelectedIds([]);
      boxModeState.set(false);
      batchDeleteConfirmOpenState.set(false);
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const moveSelected = async (): Promise<void> => {
    const targetFolder = moveTargetFolderState.value.trim();
    if (selectedIds.length <= 0) {
      setError("请先选择要移动的节点");
      return;
    }

    setLoading(true);
    try {
      await moveNodesToFolder(ctx, selectedIds, targetFolder);
      setSelectedIds([]);
      moveTargetFolderState.set("");
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const createFolderAction = async (): Promise<void> => {
    const folderPath = folderCreateInputState.value.trim();
    if (!folderPath) {
      setError("请输入要创建的文件夹路径");
      return;
    }

    setLoading(true);
    try {
      await createFolder(ctx, folderPath);
      folderCreateInputState.set("");
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const renameFolderAction = async (): Promise<void> => {
    const oldPath = folderRenameOldState.value.trim();
    const newPath = folderRenameNewState.value.trim();
    if (!oldPath || !newPath) {
      setError("重命名文件夹需要旧路径和新路径");
      return;
    }

    setLoading(true);
    try {
      await renameFolder(ctx, oldPath, newPath);
      folderRenameOldState.set("");
      folderRenameNewState.set("");
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const deleteFolderAction = async (): Promise<void> => {
    const folderPath = folderDeleteInputState.value.trim();
    if (!folderPath) {
      setError("请输入要删除的文件夹路径");
      return;
    }

    setLoading(true);
    try {
      await deleteFolder(ctx, folderPath);
      if (selectedFolderState.value === folderPath) {
        selectedFolderState.set("");
      }
      folderDeleteInputState.set("");
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const bindLinkNode = (id: string): void => {
    const normalized = normalizeId(id);
    if (!normalized) {
      return;
    }

    if (!linkSourceState.value || linkSourceState.value === normalized) {
      linkSourceState.set(normalized);
      linkTargetState.set("");
      linkDialogOpenState.set(false);
      return;
    }

    if (linkTargetState.value === normalized) {
      linkTargetState.set("");
      linkDialogOpenState.set(false);
      return;
    }

    linkTargetState.set(normalized);
    linkDialogOpenState.set(true);
  };

  const submitLink = async (): Promise<void> => {
    const sourceNodeId = linkSourceState.value.trim();
    const targetNodeId = linkTargetState.value.trim();
    if (!sourceNodeId || !targetNodeId) {
      setError("创建连接前，请先选择源节点和目标节点");
      return;
    }

    setLoading(true);
    try {
      await upsertLink(ctx, {
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        link_type: linkTypeState.value,
        weight: Number(linkWeightState.value || "1"),
        description: linkDescriptionState.value
      });
      linkDescriptionState.set("");
      linkTypeState.set("related");
      linkWeightState.set("1");
      linkSourceState.set("");
      linkTargetState.set("");
      linkDialogOpenState.set(false);
      linkModeState.set(false);
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const removeLink = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteLink(ctx, id);
      if (edgeDetailOpenState.value && edgeIdState.value === id) {
        edgeDetailOpenState.set(false);
        edgeEditModeState.set(false);
      }
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const openEdgeDetail = (link: MemoryLinkItem, editMode = false): void => {
    edgeIdState.set(link.id || "");
    edgeSourceState.set(link.sourceNodeId || "");
    edgeTargetState.set(link.targetNodeId || "");
    edgeTypeState.set(link.linkType || "related");
    edgeWeightState.set(String(link.weight == null ? 1 : link.weight));
    edgeDescriptionState.set(link.description || "");
    edgeEditModeState.set(editMode);
    edgeDetailOpenState.set(true);
  };

  const closeEdgeDetail = (): void => {
    edgeDetailOpenState.set(false);
    edgeEditModeState.set(false);
  };

  const saveEdgeDetail = async (): Promise<void> => {
    const id = normalizeId(edgeIdState.value);
    const sourceNodeId = normalizeId(edgeSourceState.value);
    const targetNodeId = normalizeId(edgeTargetState.value);
    if (!id || !sourceNodeId || !targetNodeId) {
      setError("边信息不完整，无法保存");
      return;
    }

    setLoading(true);
    try {
      await upsertLink(ctx, {
        id,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        link_type: edgeTypeState.value.trim() || "related",
        weight: Number(edgeWeightState.value || "1"),
        description: edgeDescriptionState.value
      });
      edgeEditModeState.set(false);
      await refreshDashboard();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGraphNodeClick = (payload: unknown): void => {
    const map = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const nodeId = normalizeId(map.id);
    if (!nodeId) {
      return;
    }

    if (linkModeState.value) {
      bindLinkNode(nodeId);
      return;
    }

    if (boxModeState.value) {
      toggleSelectedId(nodeId);
      return;
    }

    const target = asArray<MemoryNodeItem>(dashboardState.value.nodes).find(item => normalizeId(item.id) === nodeId);
    if (target) {
      selectedNodeIdState.set(nodeId);
      memoryInfoOpenState.set(true);
    }
  };

  const handleGraphEdgeClick = (payload: unknown): void => {
    const map = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const edgeId = normalizeId(map.id);
    if (!edgeId) {
      return;
    }
    const target = asArray<MemoryLinkItem>(dashboardState.value.links).find(item => normalizeId(item.id) === edgeId);
    if (target) {
      openEdgeDetail(target, false);
    }
  };

  const handleGraphNodeDragEnd = (payload: unknown): void => {
    const map = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const nodeId = normalizeId(map.id);
    if (!nodeId) {
      return;
    }
    const normalized = normalizeGraphLayout(graphLayoutState.value);
    normalized[nodeId] = {
      x: asFiniteNumber(map.x, normalized[nodeId]?.x ?? 120),
      y: asFiniteNumber(map.y, normalized[nodeId]?.y ?? 120)
    };
    graphLayoutState.set(normalized);
  };

  const allNodes = asArray<MemoryNodeItem>(dashboardState.value.nodes);
  const allLinks = asArray<MemoryLinkItem>(dashboardState.value.links);
  const allFolders = asArray<string>(dashboardState.value.folders);
  const graphLayout = ensureGraphLayout(
    allNodes.map(item => normalizeId(item.id)),
    normalizeGraphLayout(graphLayoutState.value)
  );
  const graphNodes = allNodes.map((node, index) => {
    const id = normalizeId(node.id);
    const point = graphLayout[id] || { x: 120 + (index * 28), y: 120 + (index * 16) };
    return {
      id,
      label: node.title || "(无标题)",
      x: point.x,
      y: point.y,
      radius: node.isDocumentNode ? 28 : 24,
      color: node.isDocumentNode ? "secondaryContainer" : "primaryContainer",
      selected:
        selectedIds.includes(id) ||
        selectedNodeId === id ||
        linkSourceState.value === id ||
        linkTargetState.value === id
    };
  });
  const graphEdges = allLinks.map(link => ({
    id: normalizeId(link.id),
    sourceId: normalizeId(link.sourceNodeId),
    targetId: normalizeId(link.targetNodeId),
    weight: Number(link.weight || 1),
    color: "outline",
    selected: edgeDetailOpenState.value && edgeIdState.value === normalizeId(link.id)
  }));
  const documentChunks = asArray<string>(documentChunksState.value).map(item => String(item == null ? "" : item));
  const documentSearchKeyword = documentSearchState.value.trim().toLowerCase();
  const visibleDocumentChunkIndexes = documentChunks
    .map((content, index) => ({ content, index }))
    .filter(item => !documentSearchKeyword || item.content.toLowerCase().includes(documentSearchKeyword))
    .map(item => item.index);

  const selectedNodeId = normalizeId(selectedNodeIdState.value);
  const selectedMemory = allNodes.find(item => normalizeId(item.id) === selectedNodeId) || null;

  const toggleBoxMode = (): void => {
    const next = !boxModeState.value;
    boxModeState.set(next);
    if (next) {
      linkModeState.set(false);
      linkDialogOpenState.set(false);
      linkSourceState.set("");
      linkTargetState.set("");
    } else {
      setSelectedIds([]);
    }
  };

  const toggleLinkMode = (): void => {
    const next = !linkModeState.value;
    linkModeState.set(next);
    if (next) {
      boxModeState.set(false);
      setSelectedIds([]);
    } else {
      linkDialogOpenState.set(false);
      linkSourceState.set("");
      linkTargetState.set("");
    }
  };

  const rootChildren: ComposeNode[] = [];

  const folderPanelNode = ctx.Card({ width: 340, fillMaxSize: true }, [
    ctx.Column({ padding: 12, spacing: 8 }, [
      ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
        ctx.Text({ text: "记忆仓库", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
        ctx.IconButton({ icon: "close", onClick: () => showFolderPanelState.set(false) })
      ]),
      ctx.Text({
        text: `当前 Profile: ${dashboardState.value.profileId || "default"}`,
        style: "bodySmall",
        color: "onSurfaceVariant"
      }),
      ctx.Row({ spacing: 8 }, [
        ctx.Button({ text: "刷新", onClick: refreshDashboard }),
        ctx.Button({
          text: selectedFolderState.value ? `已选: ${selectedFolderState.value}` : "全部文件夹",
          onClick: async () => {
            selectedFolderState.set("");
            await refreshDashboard();
          }
        })
      ]),
      ctx.Text({ text: "文件夹列表", style: "labelLarge", color: "onSurfaceVariant" }),
      ctx.LazyColumn({ spacing: 6, height: 220 }, [
        ctx.Button({
          text: selectedFolderState.value ? "全部" : "全部 (当前)",
          onClick: async () => {
            selectedFolderState.set("");
            await refreshDashboard();
          }
        }),
        ...allFolders.map(folder =>
          ctx.Button({
            text: selectedFolderState.value === folder ? `${folder} (当前)` : folder,
            onClick: async () => {
              selectedFolderState.set(folder);
              await refreshDashboard();
            }
          })
        )
      ]),
      ctx.TextField({
        label: "新建文件夹",
        value: folderCreateInputState.value,
        onValueChange: folderCreateInputState.set,
        singleLine: true
      }),
      ctx.Button({ text: "创建文件夹", onClick: createFolderAction }),
      ctx.TextField({
        label: "重命名旧路径",
        value: folderRenameOldState.value,
        onValueChange: folderRenameOldState.set,
        singleLine: true
      }),
      ctx.TextField({
        label: "重命名新路径",
        value: folderRenameNewState.value,
        onValueChange: folderRenameNewState.set,
        singleLine: true
      }),
      ctx.Button({ text: "执行重命名", onClick: renameFolderAction }),
      ctx.TextField({
        label: "删除文件夹路径",
        value: folderDeleteInputState.value,
        onValueChange: folderDeleteInputState.set,
        singleLine: true
      }),
      ctx.Button({ text: "删除文件夹", onClick: deleteFolderAction }),
      ctx.TextField({
        label: "批量移动目标文件夹",
        value: moveTargetFolderState.value,
        onValueChange: moveTargetFolderState.set,
        singleLine: true
      }),
      ctx.Button({ text: "移动已框选节点", enabled: selectedIds.length > 0, onClick: moveSelected })
    ])
  ]);

  const actionChildren: ComposeNode[] = [];
  if (boxModeState.value) {
    actionChildren.push(
      ctx.Button({
        text: `删 ${selectedIds.length}`,
        enabled: selectedIds.length > 0,
        onClick: () => batchDeleteConfirmOpenState.set(true)
      })
    );
  }
  actionChildren.push(
    ctx.Button({ text: boxModeState.value ? "框选关" : "框选开", onClick: toggleBoxMode }),
    ctx.Button({ text: linkModeState.value ? "连线关" : "连线开", onClick: toggleLinkMode }),
    ctx.Button({ text: "导入", onClick: () => importDialogOpenState.set(true) }),
    ctx.Button({ text: "新建", onClick: () => openEditor() }),
    ctx.Button({ text: "刷新", onClick: refreshDashboard })
  );

  rootChildren.push(
    ctx.Row({ fillMaxSize: true, spacing: 10, verticalAlignment: "start" }, [
      showFolderPanelState.value ? folderPanelNode : ctx.Spacer({ width: 0 }),
      ctx.Column({ weight: 1, fillMaxSize: true, spacing: 8 }, [
        ctx.Row({ fillMaxWidth: true, spacing: 8, verticalAlignment: "center" }, [
          ctx.IconButton({
            icon: showFolderPanelState.value ? "folderOpen" : "folder",
            onClick: () => showFolderPanelState.set(!showFolderPanelState.value)
          }),
          ctx.TextField({
            label: "搜索记忆",
            value: queryState.value,
            onValueChange: queryState.set,
            singleLine: true,
            weight: 1
          }),
          ctx.Button({ text: "搜索", onClick: refreshDashboard }),
          ctx.IconButton({ icon: "settings", onClick: openSettingsDialog })
        ]),
        loadingState.value
          ? ctx.Row({ spacing: 8, verticalAlignment: "center" }, [
              ctx.CircularProgressIndicator({ width: 18, height: 18, strokeWidth: 2 }),
              ctx.Text({ text: "加载记忆图谱中...", style: "bodySmall", color: "onSurfaceVariant" })
            ])
          : ctx.Spacer({ height: 0 }),
        ctx.Card({ fillMaxWidth: true, weight: 1 }, [
          ctx.Column({ fillMaxSize: true, padding: 10, spacing: 8 }, [
            ctx.Text({
              text: `节点 ${dashboardState.value.stats.nodeCount} · 边 ${dashboardState.value.stats.linkCount} · 文档块 ${dashboardState.value.stats.chunkCount}`,
              style: "bodySmall",
              color: "onSurfaceVariant"
            }),
            ctx.GraphCanvas({
              fillMaxWidth: true,
              height: 520,
              backgroundColor: "surfaceVariant",
              gridColor: "onSurfaceVariant",
              nodes: graphNodes,
              edges: graphEdges,
              onNodeClick: handleGraphNodeClick,
              onEdgeClick: handleGraphEdgeClick,
              onNodeDragEnd: handleGraphNodeDragEnd
            }),
            ctx.Text({
              text: boxModeState.value
                ? `框选模式开启，可多选节点 (${selectedIds.length})`
                : linkModeState.value
                ? `连线模式开启，先选源后选目标 (${linkSourceState.value || "-"} -> ${linkTargetState.value || "-"})`
                : "点击节点查看记忆信息",
              style: "bodySmall",
              color: "onSurfaceVariant"
            })
          ])
        ])
      ]),
      ctx.Card({ width: 90 }, [ctx.Column({ padding: 8, spacing: 8 }, actionChildren)])
    ])
  );

  if (errorState.value.trim()) {
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "errorContainer", contentColor: "onErrorContainer" }, [
        ctx.Row({ padding: 10, spacing: 8, verticalAlignment: "center" }, [
          ctx.Icon({ name: "error", tint: "onErrorContainer" }),
          ctx.Text({ text: errorState.value, style: "bodyMedium", color: "onErrorContainer", weight: 1 }),
          ctx.IconButton({ icon: "close", onClick: clearError })
        ])
      ])
    );
  }

  if (batchDeleteConfirmOpenState.value) {
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "tertiaryContainer", contentColor: "onTertiaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Text({ text: "确认批量删除", style: "titleMedium", fontWeight: "semiBold" }),
          ctx.Text({ text: `将删除 ${selectedIds.length} 条记忆，操作不可撤销。`, style: "bodyMedium" }),
          ctx.Row({ spacing: 8 }, [
            ctx.Button({ text: "确认删除", enabled: selectedIds.length > 0, onClick: removeSelectedNodes }),
            ctx.Button({ text: "取消", onClick: () => batchDeleteConfirmOpenState.set(false) })
          ])
        ])
      ])
    );
  }

  if (memoryInfoOpenState.value && selectedMemory) {
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "secondaryContainer", contentColor: "onSecondaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
            ctx.Text({ text: "记忆详情", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
            ctx.IconButton({ icon: "close", onClick: () => memoryInfoOpenState.set(false) })
          ]),
          ctx.Text({ text: selectedMemory.title || "(无标题)", style: "titleMedium", fontWeight: "semiBold" }),
          ctx.Text({
            text: compactText(selectedMemory.content, 360) || "(空内容)",
            style: "bodySmall",
            color: "onSurfaceVariant"
          }),
          ctx.Text({
            text: `文件夹: ${selectedMemory.folderPath || "未分类"} · 类型: ${selectedMemory.nodeType || "text"} · 更新时间: ${formatDateTime(selectedMemory.updatedAt)}`,
            style: "bodySmall",
            color: "onSurfaceVariant"
          }),
          ctx.Row({ spacing: 8 }, [
            ctx.Button({ text: "编辑", onClick: () => openEditor(selectedMemory) }),
            selectedMemory.isDocumentNode
              ? ctx.Button({ text: "文档查看", onClick: () => openDocumentView(selectedMemory) })
              : ctx.Spacer({ width: 0 }),
            ctx.Button({
              text: "删除",
              onClick: async () => {
                await removeOneNode(normalizeId(selectedMemory.id));
                memoryInfoOpenState.set(false);
              }
            })
          ])
        ])
      ])
    );
  }

  if (linkDialogOpenState.value && linkSourceState.value && linkTargetState.value) {
    const source = allNodes.find(item => normalizeId(item.id) === normalizeId(linkSourceState.value));
    const target = allNodes.find(item => normalizeId(item.id) === normalizeId(linkTargetState.value));
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "secondaryContainer", contentColor: "onSecondaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
            ctx.Text({ text: "创建连接", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
            ctx.IconButton({
              icon: "close",
              onClick: () => {
                linkDialogOpenState.set(false);
                linkTargetState.set("");
              }
            })
          ]),
          ctx.Text({ text: `${source?.title || linkSourceState.value} -> ${target?.title || linkTargetState.value}`, style: "bodyMedium" }),
          ctx.Row({ spacing: 8, fillMaxWidth: true }, [
            ctx.TextField({
              label: "关系类型",
              value: linkTypeState.value,
              onValueChange: linkTypeState.set,
              singleLine: true,
              weight: 1
            }),
            ctx.TextField({
              label: "权重",
              value: toNumberInput(linkWeightState.value, "1"),
              onValueChange: linkWeightState.set,
              singleLine: true,
              width: 96
            })
          ]),
          ctx.TextField({
            label: "关系描述",
            value: linkDescriptionState.value,
            onValueChange: linkDescriptionState.set,
            singleLine: true
          }),
          ctx.Row({ spacing: 8 }, [
            ctx.Button({ text: "确认连接", onClick: submitLink }),
            ctx.Button({
              text: "取消",
              onClick: () => {
                linkDialogOpenState.set(false);
                linkSourceState.set("");
                linkTargetState.set("");
              }
            })
          ])
        ])
      ])
    );
  }

  if (importDialogOpenState.value) {
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "secondaryContainer", contentColor: "onSecondaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
            ctx.Text({ text: "导入文档", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
            ctx.IconButton({ icon: "close", onClick: () => importDialogOpenState.set(false) })
          ]),
          ctx.TextField({
            label: "文件路径（read_file_full）",
            value: importPathState.value,
            onValueChange: importPathState.set,
            singleLine: true
          }),
          ctx.TextField({
            label: "文档标题",
            value: importTitleState.value,
            onValueChange: importTitleState.set,
            singleLine: true
          }),
          ctx.TextField({
            label: "文档内容（可直接粘贴）",
            value: importContentState.value,
            onValueChange: importContentState.set,
            minLines: 4
          }),
          ctx.Row({ spacing: 8 }, [
            ctx.Button({ text: "从路径导入", onClick: importDocumentFromPath }),
            ctx.Button({ text: "导入文本", onClick: importDocumentText })
          ])
        ])
      ])
    );
  }

  if (settingsDialogOpenState.value) {
    const usage = dimensionUsageState.value;
    const rebuildJob = rebuildJobState.value;
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "secondaryContainer", contentColor: "onSecondaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
            ctx.Text({ text: "检索设置", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
            ctx.IconButton({ icon: "refresh", onClick: refreshSettingsData }),
            ctx.IconButton({ icon: "close", onClick: () => settingsDialogOpenState.set(false) })
          ]),
          settingsLoadingState.value
            ? ctx.Row({ spacing: 8, verticalAlignment: "center" }, [
                ctx.CircularProgressIndicator({ width: 16, height: 16, strokeWidth: 2 }),
                ctx.Text({ text: "处理设置中...", style: "bodySmall" })
              ])
            : ctx.Spacer({ height: 0 }),
          ctx.Row({ spacing: 8, fillMaxWidth: true }, [
            ctx.TextField({
              label: "阈值",
              value: semanticThresholdState.value,
              onValueChange: semanticThresholdState.set,
              singleLine: true,
              width: 90
            }),
            ctx.TextField({
              label: "关键词权重",
              value: keywordWeightState.value,
              onValueChange: keywordWeightState.set,
              singleLine: true,
              width: 110
            }),
            ctx.TextField({
              label: "向量权重",
              value: vectorWeightState.value,
              onValueChange: vectorWeightState.set,
              singleLine: true,
              width: 110
            }),
            ctx.TextField({
              label: "边权重",
              value: edgeWeightSettingState.value,
              onValueChange: edgeWeightSettingState.set,
              singleLine: true,
              width: 90
            })
          ]),
          ctx.TextField({
            label: "融合模式 (balanced / keyword_first / vector_first)",
            value: scoreModeState.value,
            onValueChange: scoreModeState.set,
            singleLine: true
          }),
          ctx.Row({ spacing: 8, verticalAlignment: "center" }, [
            ctx.Switch({ checked: cloudEnabledState.value, onCheckedChange: cloudEnabledState.set }),
            ctx.Text({ text: "启用云向量模型", style: "bodyMedium" })
          ]),
          cloudEnabledState.value
            ? ctx.Column({ spacing: 8 }, [
                ctx.TextField({
                  label: "Endpoint",
                  value: cloudEndpointState.value,
                  onValueChange: cloudEndpointState.set,
                  singleLine: true
                }),
                ctx.TextField({
                  label: "API Key",
                  value: cloudApiKeyState.value,
                  onValueChange: cloudApiKeyState.set,
                  singleLine: true
                }),
                ctx.Row({ spacing: 8, fillMaxWidth: true }, [
                  ctx.TextField({
                    label: "Model",
                    value: cloudModelState.value,
                    onValueChange: cloudModelState.set,
                    singleLine: true,
                    weight: 1
                  }),
                  ctx.TextField({
                    label: "Provider",
                    value: cloudProviderState.value,
                    onValueChange: cloudProviderState.set,
                    singleLine: true,
                    width: 120
                  })
                ])
              ])
            : ctx.Spacer({ height: 0 }),
          ctx.Text({
            text: `记忆向量: ${usage.memoryTotal} (缺失 ${usage.memoryMissing}) · ${compactDimensionList(usage.memoryDimensions)}`,
            style: "bodySmall",
            color: "onSurfaceVariant"
          }),
          ctx.Text({
            text: `文档块向量: ${usage.chunkTotal} (缺失 ${usage.chunkMissing}) · ${compactDimensionList(usage.chunkDimensions)}`,
            style: "bodySmall",
            color: "onSurfaceVariant"
          }),
          rebuildJob
            ? ctx.Column({ spacing: 4 }, [
                ctx.LinearProgressIndicator({ progress: rebuildJob.fraction || 0 }),
                ctx.Text({
                  text: `${formatPercent(rebuildJob.fraction || 0)} · ${rebuildJob.status} · ${rebuildJob.currentStage}`,
                  style: "bodySmall",
                  color: "onSurfaceVariant"
                })
              ])
            : ctx.Text({ text: "暂无重建任务", style: "bodySmall", color: "onSurfaceVariant" }),
          ctx.Row({ spacing: 8 }, [
            ctx.Button({ text: "保存设置", onClick: saveSettingsAction }),
            ctx.Button({ text: "重建向量索引", onClick: startRebuildAction }),
            ctx.Button({ text: "刷新重建进度", onClick: refreshRebuildProgressAction })
          ])
        ])
      ])
    );
  }

  if (editorOpenState.value) {
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "secondaryContainer", contentColor: "onSecondaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Text({ text: editorIdState.value ? "编辑记忆" : "新建记忆", style: "titleMedium", fontWeight: "semiBold" }),
          ctx.Row({ spacing: 8 }, [
            ctx.Switch({
              checked: editorIsDocumentState.value,
              onCheckedChange: editorIsDocumentState.set
            }),
            ctx.Text({ text: "文档节点", style: "bodyMedium", color: "onSecondaryContainer" })
          ]),
          ctx.TextField({
            label: "标题",
            value: editorTitleState.value,
            onValueChange: editorTitleState.set,
            singleLine: true
          }),
          ctx.TextField({
            label: "内容",
            value: editorContentState.value,
            onValueChange: editorContentState.set,
            minLines: 4
          }),
          ctx.Row({ spacing: 8 }, [
            ctx.TextField({
              label: "文件夹",
              value: editorFolderState.value,
              onValueChange: editorFolderState.set,
              singleLine: true,
              weight: 1
            }),
            ctx.TextField({
              label: "来源",
              value: editorSourceState.value,
              onValueChange: editorSourceState.set,
              singleLine: true,
              weight: 1
            })
          ]),
          ctx.TextField({
            label: "Content-Type",
            value: editorContentTypeState.value,
            onValueChange: editorContentTypeState.set,
            singleLine: true
          }),
          ctx.Row({ spacing: 8 }, [
            ctx.Button({ text: "保存", onClick: saveEditor }),
            ctx.Button({
              text: "取消",
              onClick: () => editorOpenState.set(false)
            })
          ])
        ])
      ])
    );
  }

  if (documentOpenState.value) {
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "secondaryContainer", contentColor: "onSecondaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
            ctx.Text({ text: "文档分块编辑", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
            ctx.IconButton({ icon: "close", onClick: closeDocumentView })
          ]),
          ctx.TextField({
            label: "文档标题",
            value: documentTitleState.value,
            onValueChange: documentTitleState.set,
            singleLine: true
          }),
          ctx.TextField({
            label: "文件夹",
            value: documentFolderState.value,
            onValueChange: documentFolderState.set,
            singleLine: true
          }),
          ctx.TextField({
            label: "文档内搜索",
            value: documentSearchState.value,
            onValueChange: documentSearchState.set,
            singleLine: true
          }),
          ctx.Text({
            text: `匹配分块 ${visibleDocumentChunkIndexes.length}/${documentChunks.length}`,
            style: "bodySmall",
            color: "onSurfaceVariant"
          }),
          ctx.LazyColumn({ spacing: 8, fillMaxWidth: true, height: 280 }, [
            ...visibleDocumentChunkIndexes.map(chunkIndex =>
              ctx.Card({ fillMaxWidth: true }, [
                ctx.Column({ padding: 8, spacing: 6 }, [
                  ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
                    ctx.Text({ text: `分块 #${chunkIndex + 1}`, style: "labelLarge", weight: 1 }),
                    ctx.Button({ text: "删除分块", onClick: () => removeDocumentChunk(chunkIndex) })
                  ]),
                  ctx.TextField({
                    label: `内容 #${chunkIndex + 1}`,
                    value: documentChunks[chunkIndex] || "",
                    onValueChange: value => updateDocumentChunk(chunkIndex, value),
                    minLines: 2
                  })
                ])
              ])
            )
          ]),
          ctx.Row({ spacing: 8 }, [
            ctx.Button({ text: "新增分块", onClick: addDocumentChunk }),
            ctx.Button({ text: "保存文档", onClick: saveDocumentView }),
            ctx.Button({ text: "关闭", onClick: closeDocumentView })
          ])
        ])
      ])
    );
  }

  if (edgeDetailOpenState.value) {
    rootChildren.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "secondaryContainer", contentColor: "onSecondaryContainer" }, [
        ctx.Column({ padding: 12, spacing: 8 }, [
          ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
            ctx.Text({ text: "边详情", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
            ctx.IconButton({ icon: "close", onClick: closeEdgeDetail })
          ]),
          ctx.Text({ text: `边ID: ${edgeIdState.value}`, style: "bodySmall", color: "onSurfaceVariant" }),
          ctx.Text({ text: `源节点: ${edgeSourceState.value}`, style: "bodySmall", color: "onSurfaceVariant" }),
          ctx.Text({ text: `目标节点: ${edgeTargetState.value}`, style: "bodySmall", color: "onSurfaceVariant" }),
          edgeEditModeState.value
            ? ctx.Column({ spacing: 8 }, [
                ctx.TextField({
                  label: "连接类型",
                  value: edgeTypeState.value,
                  onValueChange: edgeTypeState.set,
                  singleLine: true
                }),
                ctx.TextField({
                  label: "权重",
                  value: toNumberInput(edgeWeightState.value, "1"),
                  onValueChange: edgeWeightState.set,
                  singleLine: true
                }),
                ctx.TextField({
                  label: "连接描述",
                  value: edgeDescriptionState.value,
                  onValueChange: edgeDescriptionState.set,
                  minLines: 2
                }),
                ctx.Row({ spacing: 8 }, [
                  ctx.Button({ text: "保存边编辑", onClick: saveEdgeDetail }),
                  ctx.Button({
                    text: "取消编辑",
                    onClick: () => edgeEditModeState.set(false)
                  })
                ])
              ])
            : ctx.Column({ spacing: 6 }, [
                ctx.Text({ text: `类型: ${edgeTypeState.value || "related"}`, style: "bodyMedium" }),
                ctx.Text({ text: `权重: ${edgeWeightState.value || "1"}`, style: "bodyMedium" }),
                ctx.Text({
                  text: `描述: ${edgeDescriptionState.value || "-"}`,
                  style: "bodySmall",
                  color: "onSurfaceVariant"
                }),
                ctx.Row({ spacing: 8 }, [
                  ctx.Button({ text: "编辑边", onClick: () => edgeEditModeState.set(true) }),
                  ctx.Button({
                    text: "删除边",
                    onClick: async () => {
                      await removeLink(edgeIdState.value);
                      closeEdgeDetail();
                    }
                  })
                ])
              ])
        ])
      ])
    );
  }

  return ctx.Box(
    {
      onLoad: async () => {
        if (!initializedState.value) {
          initializedState.set(true);
          await bootstrap();
        }
      },
      fillMaxSize: true,
      padding: 8
    },
    rootChildren
  );
}
