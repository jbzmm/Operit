export function formatDateTime(timestamp: unknown): string {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }
  try {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch {
    return "-";
  }
}

export function formatPercent(value: unknown): string {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return "0%";
  }
  return `${Math.round(numberValue * 100)}%`;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

export function toNumberInput(value: unknown, fallback: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return String(parsed);
}

export function compactText(value: unknown, maxLength = 120): string {
  const text = String(value == null ? "" : value).trim();
  if (!text) {
    return "";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function parseJsonArray(raw: unknown): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  const text = String(raw == null ? "" : raw).trim();
  if (!text) {
    return [];
  }
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
