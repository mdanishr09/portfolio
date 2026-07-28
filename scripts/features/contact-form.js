// File: scripts/features/contact-form.js
// Used by: scripts/main.js
// Uses: scripts/data/data-loader.js, data/messages.json (fetched at runtime)
//
// Handles the "send a message" form in the Contacts section. The
// form's action/method attributes in index.html already point at
// the Formspree endpoint, so a plain HTML submit would work even
// with JavaScript disabled — this module intercepts that submit to
// do it via fetch() instead, so the page can show inline
// success/error state instead of a full-page redirect.
//
// This talks to Formspree directly with fetch() rather than pulling
// in the @formspree/ajax CDN library, to keep the site dependency-
// free and match the hand-rolled style of the rest of scripts/*.js.
//
// Both outcomes (success and failure) go through the same closeable
// #formNotification banner, distinguished by a data-state attribute
// for styling. Whenever it's shown, the page scrolls it into view
// if it isn't already fully visible (instantly rather than smoothly
// for visitors with prefers-reduced-motion set).

import { loadMessages } from "../data/data-loader.js";

const FORMSPREE_HEADERS = { Accept: "application/json" };
const SUBMIT_TIMEOUT_MS = 15000;

// Used only if data/messages.json fails to load, so the form still
// has something to say rather than showing a blank notification.
const FALLBACK_MESSAGES = {
    success: "Thanks — your message has been sent.",
    errors: {
        generic: "Your message failed to send. Please try again.",
        cooldown: "Please wait a moment before sending another message.",
        timeout: "That's taking longer than expected. Please check your connection and try again."
    }
};

function buildFormspreeErrorMessage(responseBody) {
    if (responseBody && Array.isArray(responseBody.errors) && responseBody.errors.length) {
        return responseBody.errors.map(e => e.message).filter(Boolean).join(" ");
    }
    return "";
}

// Wraps fetch() with a hard timeout via AbortController, so a hung
// connection shows the error notification after SUBMIT_TIMEOUT_MS
// instead of leaving the "Sending…" button spinning indefinitely.
async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// Scrolls an element into view only if it isn't already fully
// within the viewport — avoids yanking the page around when the
// notification is already visible (e.g. a wide/short viewport).
// Falls back to an instant (non-smooth) scroll for visitors who
// have asked their OS/browser to reduce motion.
function scrollIntoViewIfNeeded(el) {
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const fullyVisible = rect.top >= 0 && rect.left >= 0 &&
        rect.bottom <= viewportHeight && rect.right <= viewportWidth;
    if (fullyVisible) return;

    const prefersReducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
}

// Live "N / max" counter for the message textarea. Reads the limit
// from the field's own maxlength attribute rather than hardcoding
// it, so the two never drift out of sync. Turns amber (via
// data-near-limit) inside the last 10% of the limit.
//
// aria-live starts "off" and only flips to "polite" for the single
// moment the limit is reached — announcing the count on every
// keystroke is a common screen-reader anti-pattern that would make
// typing unbearable for anyone on assistive tech.
//
// Returns { update, reset }: update() re-reads the field's current
// value (called on every keystroke). reset() force-renders "0 / max"
// directly instead of re-reading field.value — it's what the caller
// uses right after form.reset(), so it can't be thrown off by any
// timing quirk in when the browser actually clears the field.
function setupCharacterCounter(field, counter) {
    const noop = { update: () => {}, reset: () => {} };
    if (!field || !counter) return noop;
    const max = Number(field.getAttribute("maxlength")) || 0;
    if (!max) return noop;

    let wasAtLimit = false;

    const render = (length) => {
        counter.textContent = `${length} / ${max}`;
        counter.dataset.nearLimit = String(length >= max * 0.9);

        const atLimit = length >= max;
        if (atLimit && !wasAtLimit) {
            // Just reached the cap this keystroke — announce it once.
            counter.setAttribute("aria-live", "polite");
        } else if (!atLimit) {
            counter.setAttribute("aria-live", "off");
        }
        wasAtLimit = atLimit;
    };

    const update = () => render(field.value.length);
    const reset = () => render(0);

    field.addEventListener("input", update);
    update();
    return { update, reset };
}

export async function setupContactForm(messagesPromise) {
    const wrapper = document.querySelector(".contact-form-wrapper");
    const form = document.getElementById("contactForm");
    const submitBtn = form ? form.querySelector(".form-submit") : null;
    const notification = document.getElementById("formNotification");
    const notificationText = document.getElementById("formNotificationText");
    const notificationClose = document.getElementById("formNotificationClose");
    const messageField = document.getElementById("cf-message");
    const messageCount = document.getElementById("cf-message-count");
    if (!wrapper || !form || !submitBtn || !notification || !notificationText || !notificationClose) return;

    const messageCounter = setupCharacterCounter(messageField, messageCount);

    let messages;
    try {
        // If the caller already kicked off the messages.json fetch
        // (see main.js, which starts it in parallel with
        // portfolio-data.json rather than waiting for this function
        // to run), reuse that in-flight request instead of starting
        // a second one.
        messages = await (messagesPromise || loadMessages());
    } catch (err) {
        console.error("Could not load data/messages.json, using fallback text:", err);
        messages = FALLBACK_MESSAGES;
    }
    const SUCCESS_MESSAGE = messages?.success || FALLBACK_MESSAGES.success;
    const GENERIC_ERROR_MESSAGE = messages?.errors?.generic || FALLBACK_MESSAGES.errors.generic;
    const COOLDOWN_MESSAGE = messages?.errors?.cooldown || FALLBACK_MESSAGES.errors.cooldown;
    const TIMEOUT_MESSAGE = messages?.errors?.timeout || FALLBACK_MESSAGES.errors.timeout;

    // --- Spam prevention -------------------------------------------------
    // Formspree has its own spam filtering server-side, but these two
    // client-side checks cut down on obviously-scripted submissions
    // before they even hit the network:
    // 1. Honeypot: a field real visitors never see or fill in.
    // 2. Minimum fill time: forms submitted within a couple seconds of
    //    the page loading are almost always scripted, not human.
    // 3. Cooldown: blocks rapid repeat submissions from the same session.
    const MIN_FILL_TIME_MS = 3000;
    const SUBMIT_COOLDOWN_MS = 20000;
    const formRenderedAt = Date.now();
    let lastSubmitAt = 0;

    const isLikelySpam = () => {
        const honeypot = form.querySelector("#cf-website");
        if (honeypot && honeypot.value.trim() !== "") return true;
        if (Date.now() - formRenderedAt < MIN_FILL_TIME_MS) return true;
        return false;
    };
    // ----------------------------------------------------------------------

    const hideNotification = () => {
        notification.hidden = true;
        notification.removeAttribute("data-state");
        notificationText.textContent = "";
    };

    // state is "success" or "error" — controls the banner's color
    // via CSS (see .form-notification[data-state] in sections/contacts.css).
    const showNotification = (message, state) => {
        notificationText.textContent = message;
        notification.dataset.state = state;
        notification.hidden = false;
        scrollIntoViewIfNeeded(notification);
    };

    const resetSubmitState = () => {
        submitBtn.classList.remove("is-success", "is-error");
    };

    notificationClose.addEventListener("click", hideNotification);

    form.addEventListener("input", () => {
        if (submitBtn.classList.contains("is-error") || submitBtn.classList.contains("is-success")) {
            resetSubmitState();
            hideNotification();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        resetSubmitState();
        hideNotification();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (Date.now() - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
            submitBtn.classList.add("is-error");
            showNotification(COOLDOWN_MESSAGE, "error");
            return;
        }

        if (isLikelySpam()) {
            // Silently "succeed" for likely-bot submissions instead of
            // hitting the network — this keeps scripted submitters from
            // learning that a honeypot / timing check exists at all.
            console.warn("Blocked a suspected spam submission.");
            lastSubmitAt = Date.now();
            submitBtn.classList.add("is-success");
            showNotification(SUCCESS_MESSAGE, "success");
            form.reset();
            messageCounter.reset();
            return;
        }

        const originalLabel = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
        submitBtn.textContent = "Sending…";

        try {
            const response = await fetchWithTimeout(form.action, {
                method: "POST",
                body: new FormData(form),
                headers: FORMSPREE_HEADERS
            }, SUBMIT_TIMEOUT_MS);

            if (response.ok) {
                lastSubmitAt = Date.now();
                submitBtn.classList.add("is-success");
                showNotification(SUCCESS_MESSAGE, "success");
                form.reset();
                messageCounter.reset();
            } else {
                const body = await response.json().catch(() => null);
                throw new Error(buildFormspreeErrorMessage(body) || "Formspree submission failed.");
            }
        } catch (err) {
            const isTimeout = err && err.name === "AbortError";
            console.error(isTimeout ? "Contact message submission timed out:" : "Failed to send contact message:", err);
            submitBtn.classList.add("is-error");
            showNotification(isTimeout ? TIMEOUT_MESSAGE : GENERIC_ERROR_MESSAGE, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove("is-loading");
            submitBtn.textContent = originalLabel;
        }
    });
}
