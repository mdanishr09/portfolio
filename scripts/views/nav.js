/**
 * File: scripts/views/nav.js
 * 
 * Used by: scripts/main.js
 * Uses: None
 */
export function setupNavAutoExpand() {
    const nav = document.getElementById("site-nav");
    if (!nav) return;
    
    nav.addEventListener("click", (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;
        
        const targetId = link.getAttribute("href").slice(1);
        const targetSection = document.getElementById(targetId);
        const details = targetSection ? targetSection.querySelector("details") : null;
        
        if (details) {
            details.open = true;
        }
    });
}

export function setupBackToTop() {
    const link = document.getElementById("backToTop");
    if (!link) return;
    
    link.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}