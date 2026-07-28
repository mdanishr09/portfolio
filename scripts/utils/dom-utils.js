// File: scripts/utils/dom-utils.js
// Used by: scripts/ui/header.js, scripts/ui/render.js
// Uses: (none)
//
// portfolio-data.json is hand-edited, so any field can legitimately
// be null, missing, or the wrong type. These two helpers coerce
// that into something safe to drop into the DOM: text() never
// returns anything but a string, list() never returns anything but
// a (nullish-entry-free) array.

export function text(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

export function list(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(item => item !== null && item !== undefined);
}

// Coerces to a string (via text()) and escapes the five HTML-special
// characters. Use this — not text() — for any value interpolated
// into a template string that gets assigned to innerHTML, so that
// portfolio-data.json content can never be interpreted as markup or
// break out of an attribute value.
export function escapeHtml(value) {
    return text(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
