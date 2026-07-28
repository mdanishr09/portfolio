# Danish Riaz — Portfolio

A static, dependency-free single-page portfolio. Everything on the
page is driven from a couple of JSON files, so editing the site
almost never means touching HTML, CSS, or JS.

## Quick start

Plain HTML/CSS/JS, no build step. To preview it locally, serve the
folder with any static file server — opening `index.html` directly
via `file://` won't work, since the page fetches JSON with `fetch()`,
and most browsers block that on the `file://` scheme:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing your content

Everything visible on the page — name, summary, services,
experience, skills, projects, contact links — lives in
**`data/portfolio-data.json`**. Open it in any text editor, change
the values, done. A few things worth knowing:

- **Dates** (`dateFrom` / `dateTo`) use partial-precision ISO
  strings: `"2023"`, `"2023-06"`, or `"2023-06-15"`. Leave a field
  `null` for "unknown," and an empty `dateTo` reads as "Present."
- **Empty sections auto-hide.** If `services`, `experience`,
  `skills`, or `projects` is an empty array (or `summary` is blank),
  that section — and its nav link — just disappears instead of
  rendering empty.
- **Contacts** support a `"visible": false` flag, so you can hide an
  entry without deleting it.
- Any field can safely be left `null` or omitted. The site treats
  missing or malformed data as "nothing to show" rather than
  breaking (see `scripts/utils/dom-utils.js` if you're curious how).

The contact form's notification text — success, error, cooldown
messages — lives separately, in **`data/messages.json`**.

## Contact form

The "send a message" form posts to a [Formspree](https://formspree.io)
endpoint (`scripts/features/contact-form.js`, form `action` set in
`index.html`). To point it at a different Formspree form, just update
the `action` attribute on `<form id="contactForm">` in `index.html`.

## Folder structure

```
index.html
404.html               Themed 404 page (see "404 page" below)
robots.txt
sitemap.xml
manifest.json          PWA manifest (name, icons, theme color)

data/
  portfolio-data.json   Page content (see above)
  messages.json          Contact form notification text

styles/
  base/        variables.css, base.css, loader.css
               Design tokens, resets, and the loading/fatal-error screens
  layout/      layout.css
               Page shell: container, sticky nav, header, footer
  sections/    sections.css, contacts.css
               Content section styling + the contact form
  print.css    Print-only overrides (media="print")
  404.css      Standalone styling for 404.html

scripts/
  main.js               Entry point — orchestrates everything below
  404.js                404 page logic (see "404 page" below)
  data/        data-loader.js
               Fetches the two JSON files
  ui/          header.js, render.js, nav.js, theme-toggle.js, footer.js
               DOM rendering and page interactivity
  features/    contact-form.js
               Formspree submission, validation, spam prevention
  utils/       icons.js, date-utils.js, dom-utils.js
               Pure helper functions, no DOM section logic

assets/
  images/og-image.png    Social-share preview image
  icons/                 apple-touch-icon.png, icon-192.png, icon-512.png,
                          icon-512-maskable.png (referenced by manifest.json)
```

Every file starts with a header comment saying what it uses and what
uses it, so you can trace dependencies by eye without needing a
build tool to do it for you.

## Nav: sticky + scrollspy

The section nav (`nav.site-nav`) uses `position: sticky` — it pins
to the top of the viewport once you scroll past it, and drops back
into place once you scroll back above it. That's native CSS
behavior, not JS, so it never gets out of sync or janks on fast or
inertial scrolling.

Deciding which link counts as "current" is handled by
`setupScrollSpy()` in `scripts/ui/nav.js`, in two ways:
- **While scrolling** (either direction): an `IntersectionObserver`
  watches each section and colors the matching nav link (via
  `aria-current="true"`) as it crosses a band near the top of the
  viewport, just below the sticky nav.
- **On a direct hash change** (typing a new `#section-id` into the
  address bar, or setting `location.hash` from code): a
  `hashchange` listener scrolls to and highlights the right section.
  The browser handles the actual scrolling itself — smooth-scrolling
  (`scroll-behavior: smooth` in `base.css`) and offset (via
  `scroll-padding-top` in `layout.css`, sized for the sticky nav's
  height) — the listener just keeps the highlight in sync.

If you resize the nav (longer name, more contacts, whatever) and it
visibly grows or shrinks, update the two `72px`/`88px` estimates in
`layout.css`'s `scroll-padding-top` and `nav.js`'s `rootMargin` to
match.

## 404 page

`404.html` is a themed, standalone error page. GitHub Pages (and
most static hosts) will serve it automatically for any URL under the
site that doesn't match a real file. Two things worth knowing before
you touch it:

- **Every asset reference uses a root-relative absolute path**
  (`/portfolio/styles/...`), never a relative one. This file can get
  served for a broken URL at *any* depth (`/portfolio/some/deep/bad/path`,
  say), and a relative path would resolve against that broken URL
  instead of the site root — 404ing itself. If you ever move the
  site to a different subpath or domain, update these paths (and
  the "Go to Homepage" link) to match.
- **`scripts/404.js`** shows the path that wasn't found and runs a
  12-second countdown that auto-redirects to the homepage, with a
  visible "Cancel" control — auto-redirecting content needs a way to
  stop it to stay accessible (WCAG's Timing Adjustable requirement).

## Deployment

Fully static, so it deploys anywhere that serves plain files — no
build step:

- **GitHub Pages**: push this folder to a repo and enable Pages
  (Settings → Pages → deploy from branch). The included `.nojekyll`
  file tells Pages to skip its default Jekyll build, since the site
  is already static and doesn't need it.
- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the folder,
  or connect the repo with an empty build command and `/` as the
  publish directory.

If you deploy somewhere other than
`https://mdanishr09.github.io/portfolio/`, update the `href`/`content`
URLs in `index.html`'s `<link rel="canonical">`, the Open Graph and
Twitter tags (`og:image`/`twitter:image` need to stay absolute URLs —
social crawlers often can't resolve relative ones), the JSON-LD
`"url"` field, and the URLs in `robots.txt` and `sitemap.xml`.

**Two things are hand-maintained and won't auto-update from
`data/portfolio-data.json`:**
- The JSON-LD `sameAs` array in `index.html` — keep it in sync with
  the profile links in `data.contacts` (not email or the personal
  site) whenever contacts change. It's duplicated here rather than
  read from the JSON because some crawlers don't run JavaScript and
  need this tag correct in the raw HTML.
- `sitemap.xml`'s `<lastmod>` date — bump it whenever you make a
  meaningful content update.

## Security

Since this is a static site with no server to set real HTTP response
headers, `index.html` uses the closest meta-tag equivalents: a
`Content-Security-Policy` (self only, plus Formspree for the contact
form) and a `Referrer-Policy`. Two common headers —
`X-Frame-Options` and `X-Content-Type-Options` — are deliberately
left out as meta tags, because browsers silently ignore both that
way; they only do anything as real HTTP headers. If you deploy
somewhere that lets you set response headers (Netlify's `_headers`
file, Cloudflare Pages, etc.), add those two there instead.

## Theming / color variables

All colors live in `styles/base/variables.css` as custom properties,
defined once per theme (light by default, dark via
`prefers-color-scheme` and via the manual `body.light-theme` /
`body.dark-theme` override classes). Two naming patterns worth
knowing if you add more colors:

- **`--btn-*`** (`--btn-success`, `--btn-error`, `--btn-pending`) are
  tuned for text sitting on a **button background** — `var(--text)`
  used as a background, i.e. near-black in light mode, near-white in
  dark mode.
- **`--text-*`** (`--text-warning`, `--text-error`) are tuned for
  text sitting on the **page background** (`var(--bg)`) instead. The
  near-white/near-black relationship flips between the two contexts,
  so reusing a `--btn-*` color directly as page text (or vice versa)
  can fail contrast in one theme even though it looks fine in the
  other. Both sets were picked to clear 4.5:1 contrast (WCAG AA for
  normal text) against their intended background in both themes — if
  you add a new status color, check contrast against whichever
  background it'll actually render on, not just whichever theme
  you're looking at while picking it.

## Browser support notes

- Uses native ES modules (`<script type="module">`), CSS custom
  properties, and `fetch()` — no transpilation, so it's aimed at
  modern evergreen browsers.
- Respects `prefers-color-scheme` (with a manual override toggle)
  and `prefers-reduced-motion`.
- Keyboard/screen-reader friendly: skip-to-content link and a
  visible focus outline throughout, including form fields.
- Installable as a PWA (`manifest.json` + `apple-touch-icon`) and has
  a dedicated print stylesheet (`styles/print.css`) that hides
  interactive-only chrome and forces collapsed sections open.
- Each project card gets a stable `#project-<id>` anchor for direct
  linking — arriving via that hash auto-expands its section, scrolls
  to it, and briefly highlights it.
- The contact form's Formspree submission has a 15-second timeout
  (via `AbortController`) with its own "timed out" message, separate
  from the generic failure message.
