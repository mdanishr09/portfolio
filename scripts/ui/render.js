// File: scripts/ui/render.js
// Used by: scripts/main.js
// Uses: scripts/utils/icons.js, scripts/utils/date-utils.js, scripts/utils/dom-utils.js
//
// Renders the main content sections (About, Services, Experience,
// Skills, Projects, Contacts) plus the nav and empty-section
// visibility logic. Header chrome (name/title/header icons) lives
// in ui/header.js instead — this file only handles what's inside
// <main> and the full Contacts list.
//
// portfolio-data.json is hand-edited, so any field can legitimately
// be null, missing, or the wrong type (an object where an array was
// expected, etc). Every render function below treats that as "no
// content" rather than letting it throw or print "null"/"undefined"
// into the page. See utils/dom-utils.js for the text()/list()
// coercion helpers used throughout.
//
// Every value below that ends up inside an innerHTML template string
// goes through escapeHtml() (also from dom-utils.js) rather than
// text(), so nothing in the data file can inject markup or break out
// of an attribute. text() is used only for textContent/property
// assignments, which the browser already treats as plain text.

import { iconSvg } from "../utils/icons.js";
import { formatDateRange } from "../utils/date-utils.js";
import { text, list, escapeHtml } from "../utils/dom-utils.js";

export function renderNav(navItems) {
    const container = document.getElementById("site-nav");
    container.innerHTML = list(navItems)
        // A nav entry with nowhere to go and nothing to say isn't
        // worth showing as a blank, unclickable-feeling link.
        .filter(item => item.href && item.label)
        .map(item => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
        .join("");
}

export function renderSummary(summary) {
    document.getElementById("summary").textContent = text(summary);
}

export function renderServices(services) {
    const container = document.getElementById("services-container");
    container.innerHTML = "";

    list(services).forEach(skill => {
        const skillDiv = document.createElement("div");
        skillDiv.className = "entry-item";
        skillDiv.dataset.serviceId = text(skill.id);

        const tagsHTML = list(skill.tech)
            .filter(t => t.name)
            .map(t => t.url
                ? `<a href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.name)}</a>`
                : `<span>${escapeHtml(t.name)}</span>`)
            .join("");

        skillDiv.innerHTML = `
            <h3 class="entry-title">${escapeHtml(skill.title)}</h3>
            <p class="entry-description">${escapeHtml(skill.description)}</p>
            <div class="project-tech">${tagsHTML}</div>
        `;
        container.appendChild(skillDiv);
    });
}

export function renderExperience(experience) {
    const container = document.getElementById("experience-container");
    container.innerHTML = "";

    list(experience).forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "entry-item";
        jobDiv.dataset.experienceId = text(job.id);

        const highlightsHTML = list(job.highlights)
            .filter(h => h.title || h.description)
            .map(h => `<p class="entry-highlight"><strong>${escapeHtml(h.title)}:</strong> ${escapeHtml(h.description)}</p>`)
            .join("");

        const companyName = escapeHtml(job.company);
        const companyHTML = (job.url && companyName)
            ? `<a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer">${companyName}</a>`
            : companyName;
        const dateRange = formatDateRange(job.dateFrom, job.dateTo);
        const metaHTML = (dateRange && companyHTML)
            ? `${companyHTML} · ${dateRange}`
            : (companyHTML || dateRange);

        jobDiv.innerHTML = `
            <h3 class="entry-title">${escapeHtml(job.role)}</h3>
            <span class="entry-meta">${metaHTML}</span>
            <div class="entry-highlights">${highlightsHTML}</div>
        `;
        container.appendChild(jobDiv);
    });
}

export function renderSkills(skills) {
    const container = document.getElementById("skills-container");
    container.innerHTML = "";

    list(skills).forEach(skill => {
        const skillDiv = document.createElement("div");
        skillDiv.className = "skills-category";
        skillDiv.dataset.categoryId = text(skill.id);

        const tagsHTML = list(skill.items)
            .filter(item => item.name)
            .map(item => item.url
                ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}</a>`
                : `<span>${escapeHtml(item.name)}</span>`)
            .join("");

        skillDiv.innerHTML = `<strong>${escapeHtml(skill.category)}</strong><div class="skills-tags">${tagsHTML}</div>`;
        container.appendChild(skillDiv);
    });
}

export function renderProjects(projects) {
    const container = document.getElementById("projects-container");
    container.innerHTML = "";

    list(projects).forEach(project => {
        const projectDiv = document.createElement("div");
        projectDiv.className = "project-item";
        const projectId = text(project.id);
        projectDiv.dataset.projectId = projectId;
        // Enables sharing a direct link to one project, e.g.
        // "index.html#project-my-app" — see ui/nav.js for the
        // scroll-to/highlight behavior on arrival.
        if (projectId) projectDiv.id = `project-${projectId}`;

        const techHTML = list(project.tech)
            .filter(t => t.name)
            .map(t => t.url
                ? `<a href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.name)}</a>`
                : `<span>${escapeHtml(t.name)}</span>`)
            .join("");

        const projectType = escapeHtml(project.type);
        const typeHTML = (project.link && projectType)
            ? `<a class="project-type" href="${escapeHtml(project.link)}" target="_blank" rel="noopener noreferrer">${projectType}</a>`
            : projectType
                ? `<span class="project-type">${projectType}</span>`
                : "";

        const dateRange = formatDateRange(project.dateFrom, project.dateTo);
        const dateHTML = dateRange ? `<span class="project-dates">${escapeHtml(dateRange)}</span>` : "";

        const infoText = escapeHtml(project.info);
        const infoHTML = infoText ? `<p class="project-info">${infoText}</p>` : "";

        projectDiv.innerHTML = `
            <h3 class="project-title">${escapeHtml(project.title)}</h3>
            ${typeHTML}
            ${dateHTML}
            ${infoHTML}
            <div class="project-tech">${techHTML}</div>
        `;

        container.appendChild(projectDiv);
    });
}

export function renderContacts(contacts) {
    const container = document.getElementById("links-container");
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
        // iconSvg() returns a fixed, trusted string from icons.js —
        // only the visitor-facing name needs escaping here.
        anchor.innerHTML = `${iconSvg(contact.icon)}<span>${escapeHtml(name)}</span>`;
        container.appendChild(anchor);
    });
}

/* ============================================================
   Empty-section visibility
   ------------------------------------------------------------
   Any section with no content (and its matching nav entry) is
   hidden rather than shown empty. Section ids below must match
   both the <section id="X"> elements in index.html and the nav
   item ids in portfolio-data.json.
   ============================================================ */

function isEmptyValue(value) {
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "string") return value.trim() === "";
    return value === null || value === undefined || value === false;
}

export function computeEmptySections(data) {
    const safeData = data || {};
    return {
        about: isEmptyValue(safeData.summary),
        services: isEmptyValue(list(safeData.services)),
        experience: isEmptyValue(list(safeData.experience)),
        skills: isEmptyValue(list(safeData.skills)),
        projects: isEmptyValue(list(safeData.projects)),
        contacts: isEmptyValue(list(safeData.contacts).filter(c => c.url))
    };
}

export function applySectionVisibility(emptyMap) {
    const safeMap = emptyMap || {};
    Object.entries(safeMap).forEach(([id, isEmpty]) => {
        const section = document.getElementById(id);
        if (section) section.hidden = isEmpty;
    });

    // The compact icon row in the header follows the same rule as
    // the full Contacts section.
    const headerContacts = document.getElementById("header-contacts");
    if (headerContacts) headerContacts.hidden = !!safeMap.contacts;
}

// Filters the nav array to drop links pointing at hidden sections.
export function filterVisibleNav(navItems, emptyMap) {
    const safeMap = emptyMap || {};
    return list(navItems).filter(item => !safeMap[item.id]);
}
