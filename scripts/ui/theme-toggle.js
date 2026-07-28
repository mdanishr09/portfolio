// File: scripts/ui/theme-toggle.js
// Used by: scripts/main.js
// Uses: scripts/utils/icons.js
//
// Wires up the light/dark theme toggle. There are two buttons that
// both control (and reflect) the same theme state: the always-present
// one in the header, and a second one appended to the sticky nav that
// only becomes visible once the nav has actually pinned to the top of
// the viewport (see setupStickyNavState in ui/nav.js, which toggles
// nav.site-nav's "is-stuck" class, and the .nav-theme-toggle CSS rule
// in styles/layout/layout.css that shows the button only then).

import { ICON_LIBRARY } from "../utils/icons.js";

// Builds the nav's own toggle button and appends it to #site-nav.
// Done here (in code) rather than as static markup in index.html
// because ui/render.js's renderNav() replaces #site-nav's innerHTML
// when it renders the section links — anything written there
// statically in the HTML would get wiped out.
function appendNavThemeToggleButton() {
    const nav = document.getElementById("site-nav");
    if (!nav || document.getElementById("navThemeToggle")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle nav-theme-toggle";
    button.id = "navThemeToggle";
    button.setAttribute("aria-label", "Toggle color theme");
    button.setAttribute("aria-pressed", "false");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.id = "navThemeIcon";
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    button.appendChild(icon);
    nav.appendChild(button);
}

export function setupThemeToggle() {
    appendNavThemeToggleButton();

    const toggles = [
        { btn: document.getElementById("themeToggle"), icon: document.getElementById("themeIcon") },
        { btn: document.getElementById("navThemeToggle"), icon: document.getElementById("navThemeIcon") }
    ].filter(t => t.btn && t.icon);
    if (!toggles.length) return;

    const themeColorLight = document.getElementById("themeColorLight");
    const themeColorDark = document.getElementById("themeColorDark");

    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkActive = () =>
        document.body.classList.contains("dark-theme") ||
        (!document.body.classList.contains("light-theme") && systemPrefersDark);

    // Once JS has resolved which theme is actually active (including
    // a manual override), pin the matching <meta name="theme-color">
    // tag on with media="all" and disable the other with
    // media="not all" — otherwise both tags' prefers-color-scheme
    // queries would keep following the OS setting even after the
    // person picks a theme by hand.
    const syncThemeColorMeta = (dark) => {
        if (!themeColorLight || !themeColorDark) return;
        themeColorDark.media = dark ? "all" : "not all";
        themeColorLight.media = dark ? "not all" : "all";
    };

    const renderIcon = () => {
        const dark = isDarkActive();
        toggles.forEach(({ btn, icon }) => {
            icon.innerHTML = dark ? ICON_LIBRARY.sun : ICON_LIBRARY.moon;
            btn.setAttribute("aria-pressed", String(dark));
        });
        syncThemeColorMeta(dark);
    };

    const toggleTheme = () => {
        if (isDarkActive()) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
        }
        renderIcon();
    };

    toggles.forEach(({ btn }) => btn.addEventListener("click", toggleTheme));

    renderIcon();
}
