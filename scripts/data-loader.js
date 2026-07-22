/**
 * File: scripts/data-loader.js
 * 
 * Used by: scripts/main.js
 * Uses: None
 */
const DATA_PATH = "data/portfolio.json";
const FETCH_TIMEOUT_MS = 5000; // 5 second timeout

export async function loadPortfolioData() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    
    try {
        const res = await fetch(DATA_PATH, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`Failed to load ${DATA_PATH} (${res.status})`);
        return await res.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error(`Request timeout: ${DATA_PATH} took longer than ${FETCH_TIMEOUT_MS}ms`);
        }
        throw err;
    }
}

export function showFatalError() {
    document.getElementById("pageContainer").hidden = true;
    document.getElementById("fatalErrorScreen").hidden = false;
}

export function setupFatalErrorRetry() {
    const btn = document.getElementById("fatalErrorRetry");
    if (!btn) return;
    btn.addEventListener("click", () => window.location.reload());
}