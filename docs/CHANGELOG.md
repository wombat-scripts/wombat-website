# Changelog

All notable changes to the Wombat Home Loans website project.

Format: most recent at top. Each entry: date, phase, summary, files touched.

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
