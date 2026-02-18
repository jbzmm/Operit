import type { ComposeDslContext } from "../../../types/compose-dsl";

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  const text = value.trim();
  if (!text) {
    return value;
  }
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "unknown error";
  }
  return String(error || "unknown error");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

async function resolveToolCandidates(ctx: ComposeDslContext, toolName: string): Promise<string[]> {
  const currentPackageName = String(ctx.getCurrentPackageName?.() || "").trim();
  const candidates: string[] = [];

  if (ctx.resolveToolName) {
    try {
      const resolvedBySubpackage = await ctx.resolveToolName({
        packageName: currentPackageName,
        subpackageId: "memory_runtime",
        toolName,
        preferImported: true
      });
      const normalized = String(resolvedBySubpackage || "").trim();
      if (normalized) {
        candidates.push(normalized);
      }
    } catch {
      // ignore resolve failure and use fallback candidates
    }

    try {
      const resolvedByPackage = await ctx.resolveToolName({
        packageName: currentPackageName,
        toolName,
        preferImported: true
      });
      const normalized = String(resolvedByPackage || "").trim();
      if (normalized) {
        candidates.push(normalized);
      }
    } catch {
      // ignore resolve failure and use fallback candidates
    }
  }

  candidates.push(`memory_runtime:${toolName}`);
  if (currentPackageName) {
    candidates.push(`${currentPackageName}:${toolName}`);
  }

  return unique(candidates);
}

export async function callMemoryRuntimeTool<T = any>(
  ctx: ComposeDslContext,
  toolName: string,
  params?: Record<string, unknown>
): Promise<T> {
  const candidates = await resolveToolCandidates(ctx, toolName);
  let lastError = "tool call failed";

  for (const candidate of candidates) {
    try {
      const result = await ctx.callTool(candidate, params || {});
      const parsed = parseMaybeJson(result) as T;
      return parsed;
    } catch (error) {
      lastError = normalizeError(error);
    }
  }

  throw new Error(`${toolName}: ${lastError}`);
}

export function asErrorText(error: unknown): string {
  return normalizeError(error);
}

export function parseObject<T>(value: unknown, fallback: T): T {
  const parsed = parseMaybeJson(value);
  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }
  return parsed as T;
}
