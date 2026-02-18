import type { ComposeDslContext, ComposeNode } from "../../../types/compose-dsl";
import {
  getRebuildProgress,
  loadDimensionUsage,
  loadSettings,
  saveSettings,
  startRebuild,
  type CloudSettings,
  type DimensionUsage,
  type RebuildJob,
  type SearchSettings
} from "./service";
import { asErrorText } from "../shared/runtime_tool";
import { clampNumber, compactText, formatPercent } from "../shared/format";

const DEFAULT_SEARCH: SearchSettings = {
  semanticThreshold: 0.6,
  scoreMode: "balanced",
  keywordWeight: 10,
  vectorWeight: 0,
  edgeWeight: 0.4
};

const DEFAULT_CLOUD: CloudSettings = {
  enabled: false,
  endpoint: "",
  apiKey: "",
  model: "",
  provider: "cloud",
  ready: false
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

function compactDimensionList(items: Array<{ dimension: number; count: number }>): string {
  if (!Array.isArray(items) || items.length === 0) {
    return "无";
  }
  return items
    .slice(0, 8)
    .map(item => `${item.dimension}D×${item.count}`)
    .join(" · ");
}

function applySearchDefaults(
  thresholdState: { set: (v: string) => void },
  scoreModeState: { set: (v: string) => void },
  keywordState: { set: (v: string) => void },
  vectorState: { set: (v: string) => void },
  edgeState: { set: (v: string) => void }
): void {
  thresholdState.set(String(DEFAULT_SEARCH.semanticThreshold));
  scoreModeState.set(DEFAULT_SEARCH.scoreMode);
  keywordState.set(String(DEFAULT_SEARCH.keywordWeight));
  vectorState.set(String(DEFAULT_SEARCH.vectorWeight));
  edgeState.set(String(DEFAULT_SEARCH.edgeWeight));
}

export function buildMemorySettingsScreen(ctx: ComposeDslContext): ComposeNode {
  const initializedState = useValueState(ctx, "ms_initialized", false);
  const loadingState = useValueState(ctx, "ms_loading", false);
  const errorState = useValueState(ctx, "ms_error", "");

  const semanticThresholdState = useValueState(ctx, "ms_semantic_threshold", String(DEFAULT_SEARCH.semanticThreshold));
  const scoreModeState = useValueState(ctx, "ms_score_mode", DEFAULT_SEARCH.scoreMode);
  const keywordWeightState = useValueState(ctx, "ms_keyword_weight", String(DEFAULT_SEARCH.keywordWeight));
  const vectorWeightState = useValueState(ctx, "ms_vector_weight", String(DEFAULT_SEARCH.vectorWeight));
  const edgeWeightState = useValueState(ctx, "ms_edge_weight", String(DEFAULT_SEARCH.edgeWeight));

  const cloudEnabledState = useValueState(ctx, "ms_cloud_enabled", DEFAULT_CLOUD.enabled);
  const cloudEndpointState = useValueState(ctx, "ms_cloud_endpoint", DEFAULT_CLOUD.endpoint);
  const cloudApiKeyState = useValueState(ctx, "ms_cloud_api_key", DEFAULT_CLOUD.apiKey);
  const cloudModelState = useValueState(ctx, "ms_cloud_model", DEFAULT_CLOUD.model);
  const cloudProviderState = useValueState(ctx, "ms_cloud_provider", DEFAULT_CLOUD.provider);

  const dimensionUsageState = useValueState<DimensionUsage>(ctx, "ms_dimension_usage", DEFAULT_DIMENSION_USAGE);
  const rebuildJobState = useValueState<RebuildJob | null>(ctx, "ms_rebuild_job", null);

  const setError = (message: string): void => {
    errorState.set(String(message || "").trim());
  };

  const clearError = (): void => {
    setError("");
  };

  const applyLoadedSettings = (search: SearchSettings, cloud: CloudSettings): void => {
    semanticThresholdState.set(String(search.semanticThreshold));
    scoreModeState.set(String(search.scoreMode || "balanced"));
    keywordWeightState.set(String(search.keywordWeight));
    vectorWeightState.set(String(search.vectorWeight));
    edgeWeightState.set(String(search.edgeWeight));

    cloudEnabledState.set(!!cloud.enabled);
    cloudEndpointState.set(cloud.endpoint || "");
    cloudApiKeyState.set(cloud.apiKey || "");
    cloudModelState.set(cloud.model || "");
    cloudProviderState.set(cloud.provider || "cloud");
  };

  const collectSettings = (): { search: SearchSettings; cloud: CloudSettings } => {
    return {
      search: {
        semanticThreshold: clampNumber(semanticThresholdState.value, 0, 1, DEFAULT_SEARCH.semanticThreshold),
        scoreMode: String(scoreModeState.value || "balanced").trim() || "balanced",
        keywordWeight: clampNumber(keywordWeightState.value, 0, 1000, DEFAULT_SEARCH.keywordWeight),
        vectorWeight: clampNumber(vectorWeightState.value, 0, 1000, DEFAULT_SEARCH.vectorWeight),
        edgeWeight: clampNumber(edgeWeightState.value, 0, 1000, DEFAULT_SEARCH.edgeWeight)
      },
      cloud: {
        enabled: !!cloudEnabledState.value,
        endpoint: String(cloudEndpointState.value || "").trim(),
        apiKey: String(cloudApiKeyState.value || "").trim(),
        model: String(cloudModelState.value || "").trim(),
        provider: String(cloudProviderState.value || "").trim() || "cloud"
      }
    };
  };

  const refreshAll = async (): Promise<void> => {
    loadingState.set(true);
    try {
      const settings = await loadSettings(ctx);
      const usage = await loadDimensionUsage(ctx);
      applyLoadedSettings(settings.search, settings.cloud);
      dimensionUsageState.set(usage);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      loadingState.set(false);
    }
  };

  const saveAction = async (): Promise<void> => {
    loadingState.set(true);
    try {
      const next = collectSettings();
      const saved = await saveSettings(ctx, next);
      applyLoadedSettings(saved.search, saved.cloud);
      const usage = await loadDimensionUsage(ctx);
      dimensionUsageState.set(usage);
      clearError();
      if (ctx.showToast) {
        await ctx.showToast("记忆设置已保存");
      }
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      loadingState.set(false);
    }
  };

  const startRebuildAction = async (): Promise<void> => {
    loadingState.set(true);
    try {
      const job = await startRebuild(ctx, 20);
      rebuildJobState.set(job);
      const usage = await loadDimensionUsage(ctx);
      dimensionUsageState.set(usage);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      loadingState.set(false);
    }
  };

  const refreshRebuildProgressAction = async (): Promise<void> => {
    const current = rebuildJobState.value;
    if (!current || !current.jobId) {
      setError("没有可刷新的重建任务");
      return;
    }

    loadingState.set(true);
    try {
      const next = await getRebuildProgress(ctx, current.jobId, 20);
      rebuildJobState.set(next);
      const usage = await loadDimensionUsage(ctx);
      dimensionUsageState.set(usage);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      loadingState.set(false);
    }
  };

  const usage = dimensionUsageState.value;
  const rebuildJob = rebuildJobState.value;

  const children: ComposeNode[] = [
    ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
      ctx.Column({ weight: 1, spacing: 2 }, [
        ctx.Text({ text: "记忆设置", style: "headlineSmall", fontWeight: "bold" }),
        ctx.Text({ text: "权重阈值、云向量接入、维数统计、向量重建", style: "bodySmall", color: "onSurfaceVariant" })
      ]),
      ctx.IconButton({ icon: "refresh", onClick: refreshAll }),
      ctx.IconButton({
        icon: "close",
        onClick: async () => {
          await ctx.navigate("memory_center");
        }
      })
    ]),

    loadingState.value
      ? ctx.Row({ spacing: 8, verticalAlignment: "center" }, [
          ctx.CircularProgressIndicator({ width: 16, height: 16, strokeWidth: 2 }),
          ctx.Text({ text: "处理中...", style: "bodyMedium" })
        ])
      : ctx.Spacer({ height: 0 }),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Text({ text: "检索融合参数", style: "titleMedium", fontWeight: "semiBold" }),
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
            value: edgeWeightState.value,
            onValueChange: edgeWeightState.set,
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
        ctx.Row({ spacing: 8 }, [
          ctx.Button({ text: "保存设置", onClick: saveAction }),
          ctx.Button({
            text: "重置默认",
            onClick: () =>
              applySearchDefaults(
                semanticThresholdState,
                scoreModeState,
                keywordWeightState,
                vectorWeightState,
                edgeWeightState
              )
          })
        ])
      ])
    ]),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
          ctx.Text({ text: "云向量模型", style: "titleMedium", fontWeight: "semiBold", weight: 1 }),
          ctx.Switch({
            checked: cloudEnabledState.value,
            onCheckedChange: cloudEnabledState.set
          })
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
          : ctx.Text({ text: "云向量未启用，输入框已隐藏。", style: "bodySmall", color: "onSurfaceVariant" })
      ])
    ]),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Text({ text: "维数使用统计", style: "titleMedium", fontWeight: "semiBold" }),
        ctx.Text({
          text: `记忆向量: ${usage.memoryTotal} (缺失 ${usage.memoryMissing})`,
          style: "bodyMedium"
        }),
        ctx.Text({
          text: compactDimensionList(usage.memoryDimensions),
          style: "bodySmall",
          color: "onSurfaceVariant"
        }),
        ctx.Text({
          text: `文档块向量: ${usage.chunkTotal} (缺失 ${usage.chunkMissing})`,
          style: "bodyMedium"
        }),
        ctx.Text({
          text: compactDimensionList(usage.chunkDimensions),
          style: "bodySmall",
          color: "onSurfaceVariant"
        }),
        ctx.Text({
          text: usage.grouped.length > 0
            ? compactText(
                usage.grouped
                  .slice(0, 6)
                  .map(item => `${item.provider}/${item.model}/${item.targetType}/${item.dimension}D×${item.count}`)
                  .join(" · "),
                220
              )
            : "无 provider/model 分组数据",
          style: "bodySmall",
          color: "onSurfaceVariant"
        })
      ])
    ]),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Text({ text: "向量索引重建", style: "titleMedium", fontWeight: "semiBold" }),
        ctx.Row({ spacing: 8 }, [
          ctx.Button({ text: "重建向量索引", onClick: startRebuildAction }),
          ctx.Button({ text: "刷新进度", onClick: refreshRebuildProgressAction })
        ]),
        rebuildJob
          ? ctx.Column({ spacing: 6 }, [
              ctx.Text({
                text: `任务: ${rebuildJob.jobId}`,
                style: "bodySmall",
                color: "onSurfaceVariant"
              }),
              ctx.LinearProgressIndicator({ progress: rebuildJob.fraction || 0 }),
              ctx.Text({
                text: `${formatPercent(rebuildJob.fraction || 0)} · ${rebuildJob.status} · stage=${rebuildJob.currentStage}`,
                style: "bodyMedium"
              }),
              ctx.Text({
                text: `processed ${rebuildJob.processed}/${rebuildJob.total} · failed ${rebuildJob.failed}`,
                style: "bodySmall",
                color: "onSurfaceVariant"
              }),
              rebuildJob.errorText
                ? ctx.Text({ text: rebuildJob.errorText, style: "bodySmall", color: "error" })
                : ctx.Spacer({ height: 0 })
            ])
          : ctx.Text({ text: "暂无重建任务", style: "bodySmall", color: "onSurfaceVariant" })
      ])
    ])
  ];

  if (errorState.value.trim()) {
    children.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "errorContainer", contentColor: "onErrorContainer" }, [
        ctx.Row({ padding: 10, spacing: 8, verticalAlignment: "center" }, [
          ctx.Icon({ name: "error", tint: "onErrorContainer" }),
          ctx.Text({ text: errorState.value, style: "bodyMedium", color: "onErrorContainer", weight: 1 }),
          ctx.IconButton({ icon: "close", onClick: clearError })
        ])
      ])
    );
  }

  return ctx.Column(
    {
      onLoad: async () => {
        if (!initializedState.value) {
          initializedState.set(true);
          await refreshAll();
        }
      },
      fillMaxSize: true,
      padding: 12,
      spacing: 10
    },
    children
  );
}
