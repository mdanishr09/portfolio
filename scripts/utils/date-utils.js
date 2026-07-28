// File: scripts/utils/date-utils.js
// Used by: scripts/ui/render.js
// Uses: (none)
//
// Dates in portfolio-data.json are stored as partial-precision ISO
// strings — "" (unknown / present), "YYYY", "YYYY-MM", or
// "YYYY-MM-DD". These helpers turn that into a human-readable label
// or range, e.g. "Jun 2023", "Jun 2023 – Present".

export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function parsePartialDate(iso) {
    if (!iso || (typeof iso !== "string" && typeof iso !== "number")) {
        return { year: "", month: "", day: "" };
    }
    const parts = String(iso).split("-");
    return {
        year: parts[0] || "",
        month: parts[1] || "",
        day: parts[2] || ""
    };
}

// Human-readable label for display, e.g. "Jun 2023", "2023",
// "Jun 15, 2023", or "" for an unset date.
function formatPartialDate(iso) {
    const { year, month, day } = parsePartialDate(iso);
    if (!year) return "";
    if (!month) return year;
    const monthName = (MONTH_NAMES[Number(month) - 1] || "").slice(0, 3) || month;
    if (!day) return `${monthName} ${year}`;
    return `${monthName} ${Number(day)}, ${year}`;
}

// "Jan 2023 – Present" / "Jan 2023 – Jun 2024" / "2023" style range,
// used by the Experience and Projects cards. An empty dateTo with a
// non-empty dateFrom reads as "Present".
export function formatDateRange(dateFrom, dateTo) {
    const from = formatPartialDate(dateFrom);
    const to = formatPartialDate(dateTo);
    if (!from && !to) return "";
    if (!to) return `${from} – Present`;
    if (!from) return to;
    return `${from} – ${to}`;
}
