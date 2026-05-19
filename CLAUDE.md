# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # dev server with live reload (Eleventy --serve)
npm run build    # production build → outputs to _site/
No linter or test suite. There is no CI beyond Netlify's build step.
```

Architecture
Eleventy (11ty) v3 static site. Input: src/. Output: _site/. Deployed to Netlify on push to main (~30 seconds).

Template hierarchy
src/_layouts/base.njk        ← wraps all pages (nav, footer, head)
src/_layouts/landing.njk     ← extends base; for campaign/landing pages
src/_layouts/article.njk     ← extends base; adds schema + related sidebar
Pages are .njk files (Nunjucks) or .md files (Markdown with Nunjucks processing). Frontmatter controls layout, title, description, date, category, thumbnail.

Page types and where they live
Type	Location	URL pattern
Standard pages	src/*.njk	/page-name/
Blog articles	src/articles/*.md	/articles/slug/
Landing pages	src/landing/*.njk	/landing/slug/
Articles are collected via .eleventy.js → articles collection, sorted newest-first. Article frontmatter requires: title, description, date, category, layout: article.njk, thumbnail.

Shortcodes (defined in .eleventy.js)
{% cta "Button text" %} — renders the Calendly CTA button (primary style)
{% cta "Button text", "outline" %} — outline variant
{% year %} — current year (used in footer copyright)
Global data (src/_data/site.json)
Contains: name, url, phone, phoneLink, email, calendly, linkedin, youtube, newsletter, propertySearch, acl, crn, broker. Reference in templates as {{ site.acl }} etc.

CSS (src/assets/css/styles.css)
Single file — do not split. Key design tokens:

Colours: --navy (#1c476a), --steel (#507fa9), --blue-pale (#cadbe5), --paper (#fdfcfa)
Fonts: --font-display (Fraunces serif), --font-body (Plus Jakarta Sans)
Spacing scale: --space-1 (0.25rem) through --space-10 (8rem)
Section variants: .section--dark, .section--warm, .section--cool, .section--tight
Container variants: .container--narrow (720px), .container--wide (1400px)
Type classes: .eyebrow, .display, .lede, .muted
Reveal animations: add data-reveal attribute to any element for fade-in on scroll
JavaScript (src/assets/js/scripts.js)
Vanilla JS only. Five modules: nav scroll state, marquee duplication, reveal-on-scroll (IntersectionObserver), smooth anchor scrolling, year stamp. No build step.

Brand & voice
Australian English throughout (behaviour, colour, organise, etc.)
Voice: warm, conversational, jargon-free, confident but never salesy
Tom's background: 20+ years institutional banking (Citi, UBS, RBS → Commonwealth Bank), Sydney-based, moved from the UK
Niche: expats, international professionals, complex visa/income situations
Never change: ACL number (561324), Calendly link, phone (0456 255 409), email
When adding a new page
Add a <url> entry to src/sitemap.xml
If it's a major top-level page, add it to src/llms.txt
If it's an article, append the full body to src/llms-full.txt under ## Articles
SEO titles: max ~55 chars, sentence case, Australian English, no em-dashes in meta descriptions
Key docs (not deployed)
docs/briefing.md — Tom's full business context and positioning
docs/meta-and-seo.md — SEO/schema rules, sitemap priorities, social preview validation checklist
docs/CHANGELOG.md — log of meaningful changes
docs/pending-changes.md — upcoming work
