// File: scripts/main.js
// Used by: index.html (script tag)
// Uses: scripts/data/data-loader.js, scripts/ui/header.js, scripts/ui/render.js,
//        scripts/ui/theme-toggle.js, scripts/ui/nav.js, scripts/ui/footer.js,
//        scripts/features/contact-form.js
//
// Entry point for index.html, loaded as <script type="module">. It
// stays at the scripts/ root (rather than in one of the subfolders)
// since it's the one file every other script is reached through.
// This file only orchestrates — data fetching lives in data/, header
// chrome and section rendering live in ui/, and the contact form
// lives in features/.

import { loadPortfolioData, loadMessages } from "./data/data-loader.js";
import { renderHeader, renderHeaderContacts } from "./ui/header.js";
import {
    renderNav, renderSummary,
    renderServices, renderExperience, renderSkills, renderProjects, renderContacts,
    computeEmptySections, applySectionVisibility, filterVisibleNav
} from "./ui/render.js";
import { setupThemeToggle } from "./ui/theme-toggle.js";
import {
    setupNavAutoExpand, setupScrollSpy, setupStickyNavState, setupBackToTop, setupProjectDeepLink
} from "./ui/nav.js";
import { renderFooter } from "./ui/footer.js";
import { setupContactForm } from "./features/contact-form.js";

function showFatalError() {
    document.getElementById("pageContainer").hidden = true;
    document.getElementById("fatalErrorScreen").hidden = false;
}

function setupFatalErrorRetry() {
    const btn = document.getElementById("fatalErrorRetry");
    if (!btn) return;
    btn.addEventListener("click", () => window.location.reload());
}

async function init() {
    setupFatalErrorRetry();

    // Defensive reset — in case of a stale state from a prior failed
    // attempt (e.g. the retry button), always start from a clean slate.
    document.getElementById("fatalErrorScreen").hidden = true;
    document.getElementById("pageContainer").hidden = false;

    // Both JSON files are independent of each other, so both fetches
    // start immediately rather than waiting for one another — the
    // messages.json request (only actually needed once the contact
    // form is wired up, later in this function) happens in the
    // background while portfolio-data.json is loaded and rendered.
    // A failure here is handled where the promise is eventually
    // awaited (setupContactForm falls back to built-in default text).
    const messagesPromise = loadMessages();
    // This no-op .catch() doesn't change what happens when
    // messagesPromise is awaited later — each consumer of a promise
    // sees its own resolution independently. It just stops the
    // browser from logging a spurious "unhandled rejection" warning
    // before setupContactForm gets around to awaiting this promise.
    messagesPromise.catch(() => {});

    try {
        let data;

        try {
            data = await loadPortfolioData();
        } catch (err) {
            // Nothing to render without the data file — show a clean
            // full-page error instead of a half-built page.
            console.error("Could not load data/portfolio-data.json:", err);
            showFatalError();
            return;
        }

        // The fetch can succeed with a response body that isn't a
        // usable object (null, an array, a string, etc). Treat that
        // the same as "no data" rather than letting every field
        // access below throw.
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            console.error("data/portfolio-data.json did not contain a valid object:", data);
            showFatalError();
            return;
        }

        // Only visible contacts are ever shown publicly — visible:false
        // (or missing, for older data) hides one without deleting it.
        // Null/non-object entries in the array are dropped defensively.
        const visibleContacts = Array.isArray(data.contacts)
            ? data.contacts.filter(c => c && typeof c === "object" && c.visible !== false)
            : [];
        const emptySections = computeEmptySections({ ...data, contacts: visibleContacts });

        renderHeader(data.personalInfo);
        renderNav(filterVisibleNav(data.nav, emptySections));
        renderHeaderContacts(visibleContacts);
        renderSummary(data.summary);
        renderServices(data.services);
        renderExperience(data.experience);
        renderSkills(data.skills);
        renderProjects(data.projects);
        renderContacts(visibleContacts);
        renderFooter(data.personalInfo ? data.personalInfo.name : "");

        applySectionVisibility(emptySections);

        setupThemeToggle();
        setupNavAutoExpand();
        setupScrollSpy();
        setupStickyNavState();
        setupBackToTop();
        setupProjectDeepLink();
        await setupContactForm(messagesPromise);
    } finally {
        document.getElementById("pageLoader").hidden = true;
    }
}

document.addEventListener("DOMContentLoaded", init);
