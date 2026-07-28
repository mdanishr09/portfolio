// File: scripts/404.js
// Used by: 404.html (plain <script defer>, not a module — this file
// is entirely self-contained, so there's nothing to import and no
// need for module syntax)
// Uses: (none)
//
// Two small pieces of "logic" for the 404 page: showing the path
// that wasn't found (for context), and a countdown that auto-
// redirects to the homepage — with a way to cancel it, since
// auto-redirecting content needs to be stoppable to stay accessible
// (WCAG 2.2.1, Timing Adjustable).

const HOME_URL = "https://mdanishr09.github.io/portfolio/";
const REDIRECT_SECONDS = 12;

function showAttemptedPath() {
    const el = document.getElementById("attemptedPath");
    if (!el) return;
    const path = window.location.pathname + window.location.search + window.location.hash;
    // Nothing meaningful to show for a bare "/" — the message above
    // it already covers that case.
    if (!path || path === "/") return;
    el.textContent = path;
    el.hidden = false;
}

function setupAutoRedirect() {
    const status = document.getElementById("redirectStatus");
    if (!status) return;

    let secondsLeft = REDIRECT_SECONDS;
    let timerId = null;

    const render = () => {
        status.textContent = "";
        status.append(`Redirecting to the homepage in ${secondsLeft}s… `);
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", cancel);
        status.append(cancelBtn);
    };

    const tick = () => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
            window.location.href = HOME_URL;
            return;
        }
        render();
    };

    function cancel() {
        clearInterval(timerId);
        status.textContent = "Redirect canceled — use the button above whenever you're ready.";
    }

    render();
    timerId = setInterval(tick, 1000);
}

showAttemptedPath();
setupAutoRedirect();
