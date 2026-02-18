"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateTime = formatDateTime;
exports.formatPercent = formatPercent;
exports.clampNumber = clampNumber;
exports.toNumberInput = toNumberInput;
exports.compactText = compactText;
exports.parseJsonArray = parseJsonArray;
function formatDateTime(timestamp) {
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
    }
    catch (_a) {
        return "-";
    }
}
function formatPercent(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
        return "0%";
    }
    return `${Math.round(numberValue * 100)}%`;
}
function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
}
function toNumberInput(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return String(parsed);
}
function compactText(value, maxLength = 120) {
    const text = String(value == null ? "" : value).trim();
    if (!text) {
        return "";
    }
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
function parseJsonArray(raw) {
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
    }
    catch (_a) {
        return [];
    }
}
