// File: scripts/ui/footer.js
// Used by: scripts/main.js
// Uses: (none)
//
// Keeps the footer's copyright year current automatically and
// mirrors whatever name is shown in the header — no separate
// data source to keep in sync.

// The year this footer logic (and this site's current design) shipped.
// Once the real current year moves past this, the footer shows a
// range ("2026-2027") instead of just repeating 2026 forever.
const SITE_LAUNCH_YEAR = 2026;

export function renderFooter(name) {
    const yearEl = document.getElementById("footerYear");
    const nameEl = document.getElementById("footerName");
    const currentYear = new Date().getFullYear();
    const yearLabel = currentYear > SITE_LAUNCH_YEAR
        ? `${SITE_LAUNCH_YEAR}-${currentYear}`
        : String(SITE_LAUNCH_YEAR);
    if (yearEl) yearEl.textContent = yearLabel;
    if (nameEl) nameEl.textContent = name === null || name === undefined ? "" : String(name);
}
