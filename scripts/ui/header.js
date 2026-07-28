// File: scripts/ui/header.js
// Used by: scripts/main.js
// Uses: scripts/utils/icons.js, scripts/utils/dom-utils.js
//
// Renders the <header> chrome: the person's name, title, and the
// row of quick-access contact icons. Split out from render.js
// because this is page chrome that renders once, not repeating
// section content. There is no profile photo/avatar in this build —
// the header is text + icons only.

import { iconSvg } from "../utils/icons.js";
import { text, list } from "../utils/dom-utils.js";

export function renderHeader(personalInfo) {
    const info = personalInfo || {};
    document.getElementById("name").textContent = text(info.name);
    document.getElementById("role").textContent = text(info.role);
}

export function renderHeaderContacts(contacts) {
    const container = document.getElementById("header-contacts");
    container.innerHTML = "";

    // A contact with no URL has nothing to link to, so it's skipped
    // here rather than rendered as a dead link.
    list(contacts).filter(c => c.url).forEach(contact => {
        const anchor = document.createElement("a");
        anchor.href = text(contact.url);
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.dataset.contactId = text(contact.id);
        const name = text(contact.name);
        anchor.setAttribute("aria-label", name);
        anchor.title = name;
        anchor.innerHTML = iconSvg(contact.icon);
        container.appendChild(anchor);
    });
}
