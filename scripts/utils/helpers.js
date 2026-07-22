/**
 * File: scripts/utils/helpers.js
 * 
 * Used by: scripts/views/render.js (and potentially others)
 * Uses: None
 */
export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function generateId(prefix = "item") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(text) {
    const slug = String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug || generateId("item");
}

export function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function moveInArray(arr, index, direction) {
    const target = index + direction;
    if (target < 0 || target >= arr.length) return;
    const [item] = arr.splice(index, 1);
    arr.splice(target, 0, item);
}