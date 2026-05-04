# Wombat Home Loans — Migration to Eleventy (11ty)

## What this is

A migration from your current static HTML site to [Eleventy](https://www.11ty.dev/), a simple static site generator. The output is still plain HTML/CSS/JS served by Netlify — no runtime, no React, no Node server. The difference is how you *author* content.

---

## Why 11ty (not Next.js)

| | Static HTML (now) | Eleventy (recommended) | Next.js |
|---|---|---|---|
| **Learning curve** | None | Low — templates + Markdown | High — React, Node, build config |
| **Landing pages** | Copy full HTML file, edit | Drop a `.njk` file, write content | Create React component |
| **Articles** | 28KB HTML each (with full head/nav/footer) | Markdown file with 5-line frontmatter | MDX, import components |
| **Shared nav/footer** | Copy-paste (currently unused components/) | Single partial, auto-included | React components |
| **SEO/schema** | Manual per page | Templated from frontmatter | Templated, but more complex |
| **Build time** | None | ~0.25 seconds | 10-30 seconds |
| **Netlify deploy** | Instant | Instant (after ~1s build) | Slower, needs Node runtime |
| **Your CSS/JS** | Carries over as-is | Carries over as-is | Would need restructuring |
| **Interactive tools** | Embed JS widgets | Embed JS widgets (same) | React components |
| **Debugging at 9pm** | View source | View source (output is identical) | React dev tools, build errors |

**Bottom line**: Next.js solves problems you don't have (server-side rendering, dynamic data, API routes) and creates problems you don't need (React knowledge, build complexity, debugging). 11ty gives you the structure without the overhead.

---

## What you gain

### 1. Single source of truth for nav, footer, head
Your nav and footer live in `src/_includes/nav.njk` and `footer.njk`. Change once, every page updates. No more 23 article files each with their own copy.

### 2. Articles in Markdown
Instead of 28KB HTML files with embedded CSS, your articles become clean Markdown with a few lines of frontmatter:

```markdown
---
title: "Fixed vs Variable Rate"
description: "How to choose..."
date: 2026-03-15
category: "Interest Rates"
layout: article.njk
---

Your article content here. **Bold**, *italic*, [links](https://...) — just Markdown.
```

The layout handles the `<head>`, schema markup, nav, footer, and CTA automatically.

### 3. Landing pages in minutes
For paid campaigns, create `src/landing/expat-home-loans.njk` — it inherits the base layout (or a stripped-down landing layout) and you just write the content. No copy-pasting 300 lines of boilerplate.

### 4. Data files for reviews, episodes, etc.
Your Google reviews live in `src/_data/reviews.json`. Add a new review? Edit one JSON file. The homepage template loops through them automatically. Same for podcast episodes.

### 5. Same deployment, same speed
Netlify still serves plain HTML. The only change to `netlify.toml` is adding a build command: `npm install && npm run build`. Deploy previews still work on every PR.

---

## Project structure

```
wombat-website/
├── src/
│   ├── _data/             ← Structured data (reviews, episodes, site config)
│   │   ├── site.json      ← Phone, email, Calendly, ACL — used everywhere
│   │   ├── reviews.json   ← Google reviews — edit once, homepage updates
│   │   └── episodes.json  ← Podcast episodes
│   │
│   ├── _includes/         ← Partial templates (shared components)
│   │   ├── nav.njk        ← Navigation bar
│   │   └── footer.njk     ← Footer
│   │
│   ├── _layouts/          ← Page layouts (wrappers)
│   │   ├── base.njk       ← Full HTML shell: head, nav, footer, schema
│   │   ├── article.njk    ← Extends base, adds article schema + CTA
│   │   └── landing.njk    ← Extends base, for campaign pages
│   │
│   ├── articles/          ← Blog/guide content
│   │   ├── index.njk      ← Article listing page
│   │   └── *.md           ← Individual articles in Markdown
│   │
│   ├── landing/           ← Paid campaign landing pages
│   │   └── *.njk          ← Each campaign gets its own file
│   │
│   ├── assets/            ← Static assets (passed through unchanged)
│   │   ├── css/styles.css ← Your existing shared stylesheet
│   │   ├── js/scripts.js  ← Your existing shared scripts
│   │   ├── logo.svg
│   │   └── og-image.jpg
│   │
│   ├── images/            ← Photos (passed through unchanged)
│   │
│   ├── index.njk          ← Homepage
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── llms.txt
│   └── llms-full.txt
│
├── _site/                 ← BUILD OUTPUT (Netlify serves this)
├── docs/                  ← Briefing, changelog, etc.
├── .eleventy.js           ← Build config
├── netlify.toml           ← Deploy config
└── package.json           ← Dependencies (just @11ty/eleventy)
```

---

## Migration steps (in order)

### Phase 1: Set up and verify (30 mins)
1. Create a new branch: `git checkout -b eleventy-migration`
2. Copy the 11ty starter files into your repo (everything from this package)
3. Run `npm install` then `npm start` locally to verify it builds
4. Push to GitHub — Netlify will build a preview automatically

### Phase 2: Migrate articles (1-2 hours with Claude)
For each of your 23 articles:
1. Extract the article body text from the existing HTML
2. Convert to Markdown
3. Add frontmatter (title, description, date, category)
4. Save as `src/articles/article-slug.md`

This is a perfect job for Claude — give it the HTML file and ask it to convert to Markdown with frontmatter.

### Phase 3: Port homepage content (1 hour)
The starter `index.njk` has placeholder content. Replace with your real copy from the v3 prototype:
- Real reviews → `src/_data/reviews.json`
- Real podcast episodes → `src/_data/episodes.json`
- Real copy for each section

### Phase 4: Add remaining pages
- Privacy policy → `src/privacy-policy.njk` (or `.md`)
- Terms → `src/terms.njk`
- Podcast page → `src/podcast.njk`
- 404 → `src/404.njk`

### Phase 5: Domain and go-live
1. Update canonical URLs (already set to wombathomeloans.com.au in the starter)
2. Point wombathomeloans.com.au at the Netlify site
3. Set up redirects for wombatloans.com.au → wombathomeloans.com.au
4. Delete old `public/` folder from the repo

---

## Day-to-day workflow (after migration)

### Add a new article
1. Create `src/articles/my-new-article.md`
2. Add frontmatter (title, description, date, category)
3. Write in Markdown
4. Commit → Netlify deploys in ~30 seconds
5. Article automatically appears on the homepage (latest 6) and the articles index

### Create a campaign landing page
1. Create `src/landing/campaign-name.njk`
2. Set frontmatter (title, description)
3. Write the page content using your existing CSS classes
4. Commit → live at `wombathomeloans.com.au/landing/campaign-name/`

### Update a review or podcast episode
1. Edit `src/_data/reviews.json` or `episodes.json`
2. Commit → homepage updates automatically

### Change the nav or footer
1. Edit `src/_includes/nav.njk` or `footer.njk`
2. Commit → every page on the site updates

---

## Adding interactive tools later

For calculators, property search widgets, etc.:
- Create the tool as a standalone JS widget
- Embed it in any page with a `<div id="calculator"></div>` and a `<script>` tag
- The Pifi property search already works this way (it's an iframe embed)
- No framework needed — vanilla JS or a lightweight library like Alpine.js

---

## What stays the same

- **Your CSS** — `styles.css` carries over unchanged. Same design tokens, same components.
- **Your JS** — `scripts.js` carries over unchanged. Same nav toggle, reveal animations.
- **Your images** — same folder, same paths.
- **Netlify** — same host, same branch deploys, same preview URLs.
- **GitHub workflow** — same pencil-icon editing, same PRs.
- **SEO** — same schema markup, same meta tags, same canonical URLs (templated now instead of manual).

---

## Local development (optional but useful)

```bash
# Install Node.js if you don't have it (one-time)
# Download from https://nodejs.org/

# Clone and run
git clone https://github.com/wombat-scripts/wombat-website.git
cd wombat-website
npm install
npm start

# Opens http://localhost:8080 with live reload
# Edit a file → browser updates instantly
```

You don't *need* to run locally — the GitHub pencil-icon workflow still works. But local dev with live reload is much faster for bigger changes.
