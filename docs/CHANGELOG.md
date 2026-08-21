# Changelog

All notable changes to the Wombat Home Loans website project.

Format: most recent at top. Each entry: date, phase, summary, files touched.

---

## 2026-08-21 — Visual lift for the which-door quiz

Navy progress band with five door marks that fill as you answer, solid navy answer chips, a gold-stamp result reveal (320ms fade/slide), dimmed closed doors, and a navy homepage Tools card so the quiz does not look like the newsletter tile. Brand tokens only. No stock photos. Generic door names unchanged.

**Files changed:** `src/which-door.njk`, `src/assets/js/which-door.js`, `src/index.njk`, `src/_includes/css/styles.css`

---

## 2026-08-21 — De-brand which-door quiz and put it on the homepage

Quiz results, assumptions and on-page copy now name solution types, not products or lenders: standard 20% deposit loan, occupation LMI waiver at about 90%, government 5% first-home scheme, shared-equity / second-mortgage deposit help, and borrowed-deposit / deposit-boost second loan. Housing Australia stays as the scheme operator. Homepage Tools adds a quiz card; the hero “Get started in 2 minutes” link now goes to `/which-door/` instead of the Middle fact-find. Article pages left alone.

**Files changed:** `src/which-door.njk`, `src/assets/js/which-door.js`, `src/index.njk`

---

## 2026-08-20 — Tool: Which door can you actually walk?

Client-side deposit-path quiz at `/which-door/`. Five questions, one primary door (20% loan, 90% LMI waiver, government 5% scheme, or HAS/OwnHome), `/book/` CTA, no email capture. Listed first on `/calculators/`, added to `llms.txt`, linked from the two deposit articles.

**Files added:** `src/which-door.njk`, `src/assets/js/which-door.js`
**Files changed:** `src/_includes/css/styles.css`, `src/calculators/index.njk`, `src/llms.txt.njk`, `src/articles/high-income-small-deposit.njk`, `src/articles/kiwisaver-australian-deposit.njk`

---

## 2026-08-20 — Article: KiwiSaver as an Australian deposit

New Gemini-citable article answering whether KiwiSaver can be used as an Australian house deposit. Covers the closed New Zealand first-home withdrawal, the transfer-plus-FHSS path, the $15,000 yearly cap, FAQ, sources, and `/book/` CTA. Lives at `/articles/kiwisaver-australian-deposit/`. Date-sorted onto `/articles/`, the homepage scroller, `llms.txt`, and the sitemap.

**Files added:** `src/articles/kiwisaver-australian-deposit.njk`

---

## 2026-08-20 — Article: high income, almost no deposit

New Gemini-citable article for high earners with almost no Australian deposit. Four real 2026 paths (5% scheme, 90% LMI waiver, HAS SmartShare, OwnHome Deposit Boost), worked $1 million comparison, FAQ, sources, and `/book/` CTA. Lives at `/articles/high-income-small-deposit/`. Date-sorted onto `/articles/`, the homepage scroller, `llms.txt`, and the sitemap.

**Files added:** `src/articles/high-income-small-deposit.njk`

---

## 2026-08-19 — Demand path: /book/ plus first-home, investor and refinance landings

Chrome CTAs now go to `/book/` in the same tab (no Calendly profile links). `/book/` embeds the live Strategy Session event (30 minutes, Google Meet). New top-level landings at `/first-home-buyers/`, `/investors/` and `/refinance/` (not under `src/landing/`). `{% cta %}` points at `/book/`; outline variant maps to `btn--ghost`. `site.json` sets `calendly` to `/book/` and `calendlyEvent` to the live URL. Homepage drops SMSF from title/meta, Middle CTA is `btn--text`, process/closing copy is 30 minutes on Google Meet. Footer adds Instagram. `llms.txt` repositioned for corporate professionals; FIRB articles dropped from that file.

**Files added:** `src/book.njk`, `src/first-home-buyers.njk`, `src/investors.njk`, `src/refinance.njk`
**Files changed:** `.eleventy.js`, `src/_data/site.json`, `src/_includes/nav.njk`, `src/_includes/footer.njk`, `src/_includes/calc-cta.njk`, `src/index.njk`, `src/llms.txt.njk`, `src/podcast.njk`, `src/404.njk`, `src/just4fun.njk`, `CLAUDE.md`

---

## 2026-07-08 — Calculators v2: buying costs, LVR, offset vs basic

Three new calculators. (1) **Stamp duty & cost of buying** (`/calculators/buying-costs/`) — duty for all 8 states/territories with FHB exemptions/concessions, owner-occupier vs investor rates (QLD home concession, VIC PPR, ACT owner-occ tables, NT formula, NSW premium duty), plus government fees, legals and inspections. All rates live in `src/_data/stampduty.json` with per-state `lastReviewed` dates and official-calculator links shown on the page — review the file annually after state budgets. Rates verified against official sources 8 July 2026 (incl. NSW 2026–27 CPI-indexed brackets, TAS FHB exemption ending 30 June 2026, ACT HBCS cap removal from 1 July 2026). (2) **LVR** (`/calculators/lvr/`) — buy/refinance modes, pricing-band ladder, LMI flag, distance-to-next-band nudge, link to the bank-employee LMI waiver article. (3) **Offset vs basic** (`/calculators/offset-vs-basic/`) — models the offset rate premium + fee against a savings account (after tax) or redraw, with a bisection-solved break-even offset balance.

**Files added:** `src/calculators/buying-costs.njk`, `lvr.njk`, `offset-vs-basic.njk`, `src/_data/stampduty.json`
**Files changed:** `src/assets/js/calculators.js` (three new modules + duty engine), `src/assets/css/styles.css` (LVR ladder, wrapping seg control), `src/calculators/index.njk` (three new hub cards), `src/llms.txt.njk`, `src/_layouts/base.njk` + all calculator pages (asset version bump to ?v=20260709)

---

## 2026-07-08 — Calculator fixes: segmented buttons + accelerated repayments (follow-up 2)

(1) Segmented-control buttons (Weekly/Fortnightly/Monthly etc.) were rendering as unstyled browser buttons — the CSS targeted a `.seg__btn` class the markup didn't have. Selectors now also cover `.seg > button`, with hover and pressed states. (2) The repayments calculator now offers two fortnightly/weekly calculation methods: **Standard** (monthly amount split pro-rata — annual total unchanged, no savings) and **Accelerated** (half the monthly repayment per fortnight / quarter per week — 13 monthly repayments a year). Accelerated mode shows interest saved + payoff-sooner stats and a comparison line on the balance chart, with a call-out that not all lenders calculate it this way. Verified against reference figures ($650k @ 5.75%/30y: accelerated fortnightly $1,897, total interest $567,874, $147,686 saved vs monthly). `calculators.js` is now also version-tagged (`?v=20260708-2`) in all calculator pages, and `styles.css` bumped to the same version in `base.njk`.

**Files changed:** `src/assets/css/styles.css`, `src/assets/js/calculators.js`, `src/calculators/*.njk`, `src/_layouts/base.njk`

---

## 2026-07-08 — Cache-busting + fact find CTA (follow-up)

Two changes after the calculators launch. (1) `/assets/*` is served with a one-year immutable cache (netlify.toml), so returning visitors were getting the old `styles.css` and seeing unstyled calculators. `base.njk` now versions the stylesheet and script URLs (`?v=20260708`) — bump this whenever either file changes. (2) The homepage hero's "Read my story" text link is replaced with a "Get started in 2 minutes" button linking to the Middle fact find portal (umami event: `start-fact-find`).

**Files changed:** `src/_layouts/base.njk`, `src/index.njk`

---

## 2026-07-08 — Calculators section (v1)

New `/calculators/` section: hub page plus four interactive calculators, each with live charts (Chart.js via CDN, loaded only on calculator pages). Repayments (P&I / interest-only, weekly/fortnightly/monthly), borrowing power (2025–26 tax rates, HEM-style expense floor, 3.8%/mo credit card assessment, 3% APRA buffer, rate-sensitivity chart), extra repayments & offset (baseline vs boosted balance curves), and refinance savings (break-even and cumulative net position). Shared CTA + disclaimer include on every page.

**Files added:**

- `src/calculators/index.njk` — hub page with four cards
- `src/calculators/repayments.njk`, `borrowing-power.njk`, `extra-repayments.njk`, `refinance.njk`
- `src/assets/js/calculators.js` — shared calculation engine + Chart.js theme (vanilla JS)
- `src/_includes/calc-cta.njk` — shared "book a call" CTA + compliance disclaimer

**Files changed:**

- `src/assets/css/styles.css` — new section 8 (calculator layout, sliders, segmented controls, stats, hub cards)
- `src/_includes/nav.njk` — Calculators added to main nav (after Reviews)
- `src/_includes/footer.njk` — Calculators added to Tools list
- `src/llms.txt.njk` — Calculators section with URLs

Sitemap picks the new pages up automatically (generated from collections). Future candidates noted on the hub: stamp duty, first-home schemes, SMSF.

---

## 2026-05-03 — Phase 1: Foundation

Built the shared infrastructure that every page will hang off. No live-site changes; this is groundwork. New files only — nothing existing touched.

**Files added:**

- `public/assets/styles.css` (~20 KB) — Single source of truth for design tokens, typography, layout primitives, and shared components. CSS variables for the navy / steel / blue-pale palette, Fraunces + Plus Jakarta Sans typography with optical-size axis usage, fluid type scale via `clamp()`, button/card/badge/nav/footer/marquee components, reveal-on-scroll hooks, reduced-motion support, dark-mode hook (not enabled).
- `public/assets/scripts.js` (~5 KB) — Vanilla JS, no deps. Nav scroll state, mobile menu toggle (with Esc-to-close, click-outside, body-lock), marquee track auto-duplication, reveal-on-scroll via IntersectionObserver, smooth in-page anchors with sticky-nav offset, footer year auto-stamp.
- `public/assets/logo.svg` (~2 KB) — Standalone low-poly wombat. Uses `currentColor` so it inherits navy on light backgrounds and white on dark via CSS or inline styles. Reads cleanly down to ~24px.
- `public/assets/og-image.jpg` (~93 KB) — 1200×630 social preview. Deep-navy gradient with low-poly accents, brand wordmark, tagline ("Your mortgage shouldn't feel like your problem to solve"), trust strip, URL.
- `public/_components/header.html` — Sticky nav snippet. Brand mark, links, primary CTA, mobile-aware.
- `public/_components/footer.html` — Footer snippet. Brand block, link columns, ACL number (mandatory), auto-updating year.
- `public/_components/README.md` — How to use the snippets, the standard `<head>` block (incl. font URL), why we're not using a framework yet.

**Key decisions baked in:**

- Typography: Fraunces (display) + Plus Jakarta Sans (body) — the upgrade decision from 2026-05-03, supersedes the brand guide's DM Sans pairing.
- Variable fonts loaded with full axes (Fraunces opsz, wght, ital, SOFT) so the design tokens in `font-variation-settings` work.
- Paper background `#fdfcfa` rather than pure white — warmer, easier on the eye.
- Pill buttons; soft shadow stack tinted with brand navy rather than neutral grey.
- Reveal-on-scroll defaults are gentle (16px lift + fade, 600ms) and respect `prefers-reduced-motion`.

**What still hasn't been touched:** No page rebuilds. `index.html` and the rest of the live site are unchanged.

**Next:** Phase 2 — SEO/GEO/Social infrastructure (`sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, schema.org reusable head template).

**2026-05-03 — Phase 2 complete:**
- SEO/GEO/social infrastructure (sitemap, robots, llms.txt, llms-full.txt stub, head template, meta docs)

---
