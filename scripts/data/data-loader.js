// File: scripts/data/data-loader.js
// Used by: scripts/main.js, scripts/features/contact-form.js
// Uses: data/portfolio-data.json, data/messages.json (both fetched at runtime)
//
// This is a static site, so there is no live backend and no
// provider system — these two JSON files are the site's only data
// sources. This module just fetches and parses them.

const DATA_PATH = "data/portfolio-data.json";
const MESSAGES_PATH = "data/messages.json";

async function fetchJson(path) {
    // "no-cache" (despite the name) still lets the browser use a
    // cached response — it just forces a revalidation request first,
    // so an edited JSON file is picked up on the next load instead
    // of being served stale until the cache naturally expires.
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
    return res.json();
}

export async function loadPortfolioData() {
    return fetchJson(DATA_PATH);
}

export async function loadMessages() {
    return fetchJson(MESSAGES_PATH);
}
