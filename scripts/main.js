/**
 * File: scripts/main.js
 * 
 * Used by: index.html
 * Uses: 
 *   - scripts/data-loader.js
 *   - scripts/views/render.js
 *   - scripts/views/theme.js
 *   - scripts/views/nav.js
 *   - scripts/views/footer.js
 */
import { loadPortfolioData, showFatalError, setupFatalErrorRetry } from "./data-loader.js";
import {
    renderHeader, renderNav, renderHeaderContacts, renderSummary,
    renderServices, renderExperience, renderSkills, renderProjects, renderContacts,
    computeEmptySections, applySectionVisibility, filterVisibleNav
} from "./views/render.js";
import { setupThemeToggle } from "./views/theme.js";
import { setupNavAutoExpand, setupBackToTop } from "./views/nav.js";
import { renderFooter } from "./views/footer.js";

async function init() {
    setupFatalErrorRetry();
    
    // Defensive reset
    document.getElementById("fatalErrorScreen").hidden = true;
    document.getElementById("pageContainer").hidden = false;

    try {
        const data = await loadPortfolioData();
        
        const emptySections = computeEmptySections(data);
        
        // Render all sections
        renderHeader(data.personalInfo);
        renderNav(filterVisibleNav(data.nav, emptySections));
        renderHeaderContacts(data.contacts);
        renderSummary(data.summary);
        renderServices(data.services);
        renderExperience(data.experience);
        renderSkills(data.skills);
        renderProjects(data.projects);
        renderContacts(data.contacts);
        renderFooter(data.personalInfo.name);
        
        // This will show non-empty sections and keep empty ones hidden
        applySectionVisibility(emptySections);
        
        // Setup UI interactions
        setupThemeToggle();
        setupNavAutoExpand();
        setupBackToTop();
    } catch (err) {
        console.error("Failed to load portfolio data:", err);
        showFatalError();
    } finally {
        // Hide loader immediately after rendering completes or fails
        document.getElementById("pageLoader").hidden = true;
    }
}

document.addEventListener("DOMContentLoaded", init);