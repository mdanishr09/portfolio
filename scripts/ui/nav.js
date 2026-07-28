// File: scripts/ui/nav.js
// Used by: scripts/main.js
// Uses: (none)
//
// Nav-related interactivity: expanding a collapsed section when its
// nav link is clicked, highlighting the current section in the nav
// as the page scrolls (in both directions) or the hash changes
// directly, tracking whether the sticky nav is currently pinned to
// the viewport, the "back to top" footer link, and scrolling to +
// highlighting a project when arriving via a #project-<id> link.

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

// Keeps the nav in sync with which section is "current", two ways:
//
// 1. Scroll-driven (IntersectionObserver): as sections cross a band
//    near the top of the viewport — just below the sticky nav — the
//    matching link's text turns accent-colored via aria-current.
//    Works identically whether scrolling up or down, since it just
//    reacts to intersection state rather than tracking direction.
//
// 2. Hash-driven: if the URL's hash changes by any means other than
//    scrolling (typing a new hash into the address bar, or setting
//    location.hash from code) the browser's native fragment
//    navigation already does the scrolling (scroll-behavior: smooth
//    and scroll-padding-top are set globally in base.css/layout.css)
//    — what's missing without this is the nav highlight itself,
//    which this syncs on the "hashchange" event. This also covers
//    the reverse case explicitly asked for: changing the hash
//    without clicking a nav link still scrolls to and highlights the
//    right section.
//
// No history.pushState/replaceState calls here — plain <a href="#…">
// navigation already updates the URL and history on its own, and
// nothing about this feature needs to change that default behavior.
export function setupScrollSpy() {
    const nav = document.getElementById("site-nav");
    if (!nav) return;

    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    // Resolve each link's target element up front. Built from the
    // links' own href values rather than a separate id scheme, so
    // there's exactly one source of truth for "which link goes with
    // which section."
    const linkByTargetId = new Map();
    const sections = [];
    links.forEach(link => {
        const targetId = link.getAttribute("href").slice(1);
        const target = targetId ? document.getElementById(targetId) : null;
        if (target && !linkByTargetId.has(targetId)) {
            linkByTargetId.set(targetId, link);
            sections.push(target);
        }
    });
    if (!sections.length) return;

    // Always clears every link first, then sets the one matching
    // targetId (if any) — clearing unconditionally, not only when a
    // new match is found, avoids ever leaving a stale highlight on
    // an old link with nothing currently matching.
    const setActive = (targetId) => {
        links.forEach(link => link.removeAttribute("aria-current"));
        const activeLink = targetId ? linkByTargetId.get(targetId) : null;
        if (activeLink) activeLink.setAttribute("aria-current", "true");
    };

    const openDetailsFor = (target) => {
        const details = target.querySelector("details");
        if (details) details.open = true;
    };

    if (typeof IntersectionObserver !== "undefined") {
        const visibleIds = new Set();
        const lastSectionId = sections[sections.length - 1].id;

        // A short final section can be too small to ever reach the
        // observer's reading band once the page can't scroll any
        // further — the band position assumes there's room below it
        // to scroll into. Treat "scrolled to the very bottom of the
        // page" as its own signal that the last section is current.
        const isAtBottomOfPage = () => {
            const doc = document.documentElement;
            return window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
        };

        const updateFromScroll = () => {
            if (isAtBottomOfPage()) {
                setActive(lastSectionId);
                return;
            }
            // If multiple sections are in the band at once (short
            // sections, fast scrolling), prefer whichever comes
            // first in document order rather than flickering.
            const current = sections.find(section => visibleIds.has(section.id));
            if (current) {
                setActive(current.id);
            } else if (window.scrollY < 10) {
                // At the very top of the page, before the first
                // section has reached the active band yet — default
                // to it being current rather than showing nothing.
                setActive(sections[0].id);
            } else {
                setActive(null);
            }
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibleIds.add(entry.target.id);
                } else {
                    visibleIds.delete(entry.target.id);
                }
            });
            updateFromScroll();
        }, {
            // The active band starts ~88px down (clearing the sticky
            // nav's own height, roughly 72px, plus a little slack)
            // and runs to 40% of the viewport height — matches how
            // people read top-to-bottom rather than requiring a
            // whole section to fill the screen.
            rootMargin: "-88px 0px -60% 0px",
            threshold: 0
        });

        sections.forEach(section => observer.observe(section));
        // The IntersectionObserver callback alone can miss the
        // "scrolled to the very bottom" case on some browsers/scroll
        // speeds, so a plain scroll listener backs it up for that
        // one check specifically.
        window.addEventListener("scroll", updateFromScroll, { passive: true });
    }

    const syncToHash = () => {
        const targetId = location.hash.slice(1);
        const target = targetId ? document.getElementById(targetId) : null;
        if (!target || !linkByTargetId.has(targetId)) return;
        openDetailsFor(target);
        setActive(targetId);
    };

    window.addEventListener("hashchange", syncToHash);

    // Content is fetched and rendered asynchronously, so if the page
    // was opened with a hash already in the URL (e.g. a shared link
    // to .../#skills), the browser's native scroll-to-fragment may
    // have already run and found nothing, since the section didn't
    // exist yet at that point. Handle it explicitly now that
    // rendering has finished. Instant rather than smooth — this is
    // the initial paint, not an animated response to a click.
    if (location.hash) {
        const targetId = location.hash.slice(1);
        const target = document.getElementById(targetId);
        if (target && linkByTargetId.has(targetId)) {
            openDetailsFor(target);
            target.scrollIntoView({ behavior: "auto", block: "start" });
            setActive(targetId);
        }
    }
}

// Toggles an "is-stuck" class on the nav for exactly as long as
// position: sticky has it pinned to the top of the viewport. CSS has
// no selector for "currently stuck", so this uses the standard
// sentinel technique: a zero-height marker (#navStickySentinel) sits
// immediately above the nav in the document; once scrolling carries
// that marker above the viewport's top edge, the nav (which follows
// right after it) must be the thing pinned there. Scrolling back up
// past the marker reverses it automatically, since IntersectionObserver
// reports both directions. Used by ui/theme-toggle.js's nav-appended
// button, which is only shown while this class is present (see
// .nav-theme-toggle in styles/layout/layout.css).
export function setupStickyNavState() {
    const nav = document.getElementById("site-nav");
    const sentinel = document.getElementById("navStickySentinel");
    if (!nav || !sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
        ([entry]) => nav.classList.toggle("is-stuck", !entry.isIntersecting),
        { threshold: 0 }
    );
    observer.observe(sentinel);
}

export function setupBackToTop() {
    const link = document.getElementById("backToTop");
    if (!link) return;
    link.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// If the page was loaded with a #project-<id> hash (see the
// project.id-based ids set in ui/render.js), opens that project's
// collapsible section if needed, scrolls to it, and gives it a
// brief highlight flash so it's easy to spot — lets a project be
// shared/linked directly rather than only reachable by scrolling.
export function setupProjectDeepLink() {
    if (!location.hash) return;

    const target = document.getElementById(location.hash.slice(1));
    if (!target || !target.classList.contains("project-item")) return;

    const details = target.closest("details");
    if (details) details.open = true;

    const prefersReducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });

    target.classList.add("deep-link-highlight");
    // Two-step class toggle so the outline transition (defined in
    // sections/sections.css) actually animates: it fades from
    // opaque to transparent once "deep-link-fade" is added on the
    // next frame, then both classes are cleaned up after it finishes.
    requestAnimationFrame(() => target.classList.add("deep-link-fade"));
    setTimeout(() => target.classList.remove("deep-link-highlight", "deep-link-fade"), 2200);
}
