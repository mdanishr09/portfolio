/**
 * File: scripts/views/theme.js
 * 
 * Used by: scripts/main.js
 * Uses: scripts/utils/icons.js
 */
import { iconSvg } from "../utils/icons.js";

export function setupThemeToggle() {
    const toggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    if (!toggleBtn || !themeIcon) return;

    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const isDarkActive = () =>
        document.body.classList.contains("dark-theme") ||
        (!document.body.classList.contains("light-theme") && systemPrefersDark);

    const renderIcon = () => {
        const dark = isDarkActive();
        // Use iconSvg() to properly wrap the path data in an <svg> element
        themeIcon.innerHTML = dark ? iconSvg("sun") : iconSvg("moon");
        toggleBtn.setAttribute("aria-pressed", String(dark));
        toggleBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    };

    toggleBtn.addEventListener("click", () => {
        if (isDarkActive()) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
        }
        renderIcon();
    });

    renderIcon();
}