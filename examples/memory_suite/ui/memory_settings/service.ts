import type { ComposeDslContext } from "../../../types/compose-dsl";
import { callMemoryRuntimeTool, parseObject } from "../shared/runtime_tool";

export interface SearchSettings {
  semanticThreshold: number;
  scoreMode: string;
  keywordWeight: number;
  vectorWeight: number;
  edgeWeight: number;
}

export interface CloudSettings {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  model: string;
  provider: string;
  ready?: boolean;
}

export interface SettingsPayload {
  search: SearchSettings;
  cloud: CloudSettings;
}

export interface DimensionUsage {
  memoryTotal: number;
  memoryMissing: number;
  memoryDimensions: Array<{ dimension: number; count: number }>;
  chunkTotal: number;
  chunkMissing: number;
  chunkDimensions: Array<{ dimension: number; count: number }>;
  grouped: Array<{ provider: string; model: string; targetType: string; dimension: number; count: number }>;
}

export interface RebuildJob {
  jobId: string;
  status: string;
  currentStage: string;
  total: number;
  processed: number;
  failed: number;
  fraction: number;
  errorText?: string;
}

const DEFAULT_SETTINGS: SettingsPayload = {
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

function normalizeSettings(raw: unknown): SettingsPayload {
  const parsed = parseObject(raw, { settings: DEFAULT_SETTINGS });
  const settings = parseObject(parsed.settings, DEFAULT_SETTINGS);
  return {
    search: {
      ...DEFAULT_SETTINGS.search,
      ...parseObject(settings.search, DEFAULT_SETTINGS.search)
    },
    cloud: {
      ...DEFAULT_SETTINGS.cloud,
      ...parseObject(settings.cloud, DEFAULT_SETTINGS.cloud)
    }
  };
}

export async function loadSettings(ctx: ComposeDslContext): Promise<SettingsPayload> {
  const result = await callMemoryRuntimeTool(ctx, "memory_get_settings", {});
  return normalizeSettings(result);
}

export async function saveSettings(ctx: ComposeDslContext, payload: SettingsPayload): Promise<SettingsPayload> {
  const result = await callMemoryRuntimeTool(ctx, "memory_save_settings", {
    settings_json: JSON.stringify(payload)
  });
  const parsed = parseObject(result, { settings: payload });
  const settings = parseObject(parsed.settings, payload);
  return {
    search: {
      ...DEFAULT_SETTINGS.search,
      ...parseObject(settings.search, payload.search)
    },
    cloud: {
      ...DEFAULT_SETTINGS.cloud,
      ...parseObject(settings.cloud, payload.cloud)
    }
  };
}

export async function loadDimensionUsage(ctx: ComposeDslContext): Promise<DimensionUsage> {
  const result = await callMemoryRuntimeTool(ctx, "memory_get_dimension_stats", {});
  const parsed = parseObject(result, { usage: DEFAULT_DIMENSION_USAGE });
  const usage = parseObject(parsed.usage, DEFAULT_DIMENSION_USAGE);
  return {
    ...DEFAULT_DIMENSION_USAGE,
    ...usage,
    memoryDimensions: Array.isArray(usage.memoryDimensions) ? usage.memoryDimensions : [],
    chunkDimensions: Array.isArray(usage.chunkDimensions) ? usage.chunkDimensions : [],
    grouped: Array.isArray(usage.grouped) ? usage.grouped : []
  };
}

export async function startRebuild(ctx: ComposeDslContext, batchSize = 20): Promise<RebuildJob | null> {
  const result = await callMemoryRuntimeTool(ctx, "memory_start_rebuild_embedding_job", {
    batch_size: batchSize
  });
  const parsed = parseObject(result, { job: null });
  const job = parsed.job;
  return job && typeof job === "object" ? (job as RebuildJob) : null;
}

export async function getRebuildProgress(
  ctx: ComposeDslContext,
  jobId: string,
  batchSize = 20
): Promise<RebuildJob | null> {
  const result = await callMemoryRuntimeTool(ctx, "memory_get_rebuild_job_progress", {
    job_id: jobId,
    batch_size: batchSize
  });
  const parsed = parseObject(result, { job: null });
  const job = parsed.job;
  return job && typeof job === "object" ? (job as RebuildJob) : null;
}
