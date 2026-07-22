/**
 * File: scripts/views/footer.js
 * 
 * Used by: scripts/main.js
 * Uses: None
 */
export function renderFooter(name) {
    const yearEl = document.getElementById("footerYear");
    const nameEl = document.getElementById("footerName");
    
    if (yearEl) {
        const INITIAL_YEAR = 2026;
        const currentYear = new Date().getFullYear();
        
        // If the current year is greater than the initial year, show the range.
        // Otherwise, just show the initial year.
        yearEl.textContent = currentYear > INITIAL_YEAR 
            ? `${INITIAL_YEAR}-${currentYear}` 
            : String(INITIAL_YEAR);
    }
    
    if (nameEl) nameEl.textContent = name;
}