/**
 * File: scripts/views/render.js
 * 
 * Used by: scripts/main.js
 * Uses: scripts/utils/icons.js
 */
import { iconSvg } from "../utils/icons.js";

const LOCAL_AVATAR_FALLBACK = "assets/images/profile.png";

export function renderHeader(personalInfo) {
    document.getElementById("name").textContent = personalInfo.name;
    document.getElementById("role").textContent = personalInfo.role;
    setupAvatarImage(personalInfo.avatar);
}

function setupAvatarImage(avatarSrc) {
    const avatarBox = document.querySelector(".avatar");
    const avatarImg = document.getElementById("avatarImg");
    if (!avatarBox || !avatarImg) return;

    let triedLocalFallback = false;
    avatarImg.onerror = () => {
        if (!triedLocalFallback) {
            triedLocalFallback = true;
            avatarImg.src = LOCAL_AVATAR_FALLBACK;
        } else {
            avatarBox.hidden = true;
        }
    };
    
    avatarBox.hidden = false;
    avatarImg.alt = document.getElementById("name").textContent;
    avatarImg.src = avatarSrc || LOCAL_AVATAR_FALLBACK;
}

export function renderNav(navItems) {
    const container = document.getElementById("site-nav");
    container.innerHTML = navItems
        .map(item => `<a href="${item.href}" data-nav-id="${item.id}">${item.label}</a>`)
        .join("");
}

export function renderSummary(summary) {
    document.getElementById("summary").textContent = summary;
}

export function renderServices(services) {
    const container = document.getElementById("services-container");
    container.innerHTML = "";
    services.forEach(skill => {
        const skillDiv = document.createElement("div");
        skillDiv.className = "entry-item";
        skillDiv.dataset.serviceId = skill.id;
        const tagsHTML = skill.tech.map(t => `<a href="${t.url}" target="_blank" rel="noopener">${t.name}</a>`).join("");
        skillDiv.innerHTML = `
            <h3 class="entry-title">${skill.title}</h3>
            <p class="entry-description">${skill.description}</p>
            <div class="project-tech">${tagsHTML}</div>
        `;
        container.appendChild(skillDiv);
    });
}

export function renderExperience(experience) {
    const container = document.getElementById("experience-container");
    container.innerHTML = "";
    experience.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "entry-item";
        jobDiv.dataset.experienceId = job.id;
        const highlightsHTML = job.highlights.map(h => `<p class="entry-highlight"><strong>${h.title}:</strong> ${h.description}</p>`).join("");
        jobDiv.innerHTML = `
            <h3 class="entry-title">${job.role}</h3>
            <span class="entry-meta">${job.company} · ${job.period}</span>
            <div class="entry-highlights">${highlightsHTML}</div>
        `;
        container.appendChild(jobDiv);
    });
}

export function renderSkills(skills) {
    const container = document.getElementById("skills-container");
    container.innerHTML = "";
    skills.forEach(skill => {
        const skillDiv = document.createElement("div");
        skillDiv.className = "skills-category";
        skillDiv.dataset.categoryId = skill.id;
        const tagsHTML = skill.items.map(item => item.url 
            ? `<a href="${item.url}" target="_blank" rel="noopener">${item.name}</a>` 
            : `<span>${item.name}</span>`).join("");
        skillDiv.innerHTML = `<strong>${skill.category}</strong><div class="skills-tags">${tagsHTML}</div>`;
        container.appendChild(skillDiv);
    });
}

export function renderProjects(projects) {
    const container = document.getElementById("projects-container");
    container.innerHTML = "";
    projects.forEach(project => {
        const projectDiv = document.createElement("div");
        projectDiv.className = "project-item";
        projectDiv.dataset.projectId = project.id;
        const techHTML = project.tech.map(t => `<a href="${t.url}" target="_blank" rel="noopener">${t.name}</a>`).join("");
        const typeHTML = project.link 
            ? `<a class="project-type" href="${project.link}" target="_blank" rel="noopener">${project.type}</a>` 
            : `<span class="project-type">${project.type}</span>`;
        projectDiv.innerHTML = `
            <h3 class="project-title">${project.title}</h3>
            ${typeHTML}
            <p class="project-info">${project.info}</p>
            <div class="project-tech">${techHTML}</div>
        `;
        container.appendChild(projectDiv);
    });
}

export function renderContacts(contacts) {
    const container = document.getElementById("links-container");
    container.innerHTML = "";
    contacts.forEach(contact => {
        const anchor = document.createElement("a");
        anchor.href = contact.url;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.dataset.contactId = contact.id;
        anchor.setAttribute("aria-label", contact.name);
        anchor.title = contact.name;
        anchor.innerHTML = `${iconSvg(contact.icon)}<span>${contact.name}</span>`;
        container.appendChild(anchor);
    });
}

export function renderHeaderContacts(contacts) {
    const container = document.getElementById("header-contacts");
    container.innerHTML = "";
    contacts.forEach(contact => {
        const anchor = document.createElement("a");
        anchor.href = contact.url;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.dataset.contactId = contact.id;
        anchor.setAttribute("aria-label", contact.name);
        anchor.title = contact.name;
        anchor.innerHTML = iconSvg(contact.icon);
        container.appendChild(anchor);
    });
}

/* Empty-section visibility */
function isEmptyValue(value) {
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "string") return value.trim() === "";
    return !value;
}

export function computeEmptySections(data) {
    return {
        about: isEmptyValue(data.summary),
        services: isEmptyValue(data.services),
        experience: isEmptyValue(data.experience),
        skills: isEmptyValue(data.skills),
        projects: isEmptyValue(data.projects),
        contacts: isEmptyValue(data.contacts)
    };
}

export function applySectionVisibility(emptyMap) {
    Object.entries(emptyMap).forEach(([id, isEmpty]) => {
        const section = document.getElementById(`${id}-section`);
        if (section) section.hidden = isEmpty;
    });
    const headerContacts = document.getElementById("header-contacts");
    if (headerContacts) headerContacts.hidden = emptyMap.contacts;
}

export function filterVisibleNav(navItems, emptyMap) {
    return navItems.filter(item => !emptyMap[item.id]);
}