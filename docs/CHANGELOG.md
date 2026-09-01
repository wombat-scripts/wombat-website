# Changelog

All notable changes to the Wombat Home Loans website project.

Format: most recent at top. Each entry: date, phase, summary, files touched.

---

## 2026-09-01. Footer drops the extra Strategy button

The shared footer brand block no longer has a Book a Strategy Session clay button. The homepage book band and the header/nav CTA stay. Phone, email, and Suite 1, 86 Mann St, Gosford NSW 2250 stay in Get in touch. No virtual-office line.

**Files changed:** `src/_includes/footer.njk`, `tests/homepage.test.js`

---

## 2026-09-01. Homepage layout A (two-up Why Wombat)

Layout-only pass on the Kitchen table homepage. Why Wombat is a 36/64 two-column grid with one taped running Polaroid kept fully in frame (sticky inside the section on desktop, stacked above the bio on small screens). Reviews sit on a warmer paper band with paper-white cards. Articles stay cream, with a 1px oak hairline and extra space above the heading. Live copy, type, logo, hero, notebook, tools, book band, and footer are unchanged.

**Files changed:** `src/index.njk`, `src/_includes/css/styles.css`, `tests/homepage.test.js`

---

## 2026-09-01 — Article: Help to Buy, what it is and what it is not

Gemini-citable explainer on Help to Buy as government shared equity, not a cash grant and not the 5% deposit scheme. Income caps from 1 July 2026, 10,000 places a year, NSW price caps. Lives at `/articles/help-to-buy-what-it-is/`. Date-sorted onto `/articles/`, the homepage scroller, `llms.txt`, and the sitemap.

**Files added:** `src/articles/help-to-buy-what-it-is.md`, `tests/help-to-buy-article.test.js`

---

## 2026-08-28 — Article: deposit bonds for first home buyers

New first-home explainer on deposit bonds at auction. A House Hunting Bond can stand in at exchange. It is not cash at settlement, not a home loan, and not genuine savings. Lives at `/articles/deposit-bond-first-home/`. Date-sorted onto `/articles/`, the homepage scroller, `llms.txt`, and the sitemap.

**Files added:** `src/articles/deposit-bond-first-home.md`, `tests/deposit-bond-article.test.js`

---

## 2026-08-26 — Tools scroller + quiz in Tools; footer address

Homepage Tools reuses the Articles/Reviews horizontal scroller (snap, prev/next). The Which door quiz card moves into that row as the third card, with its existing copy and “Get started in 2 minutes” CTA. The standalone quiz block under Book is gone. Footer keeps Suite 1, 86 Mann St, Gosford NSW 2250 and drops the virtual-office / postal disclaimer. Podcast, Wrap, and LinkedIn stay off the homepage.

**Files changed:** `src/index.njk`, `src/_includes/css/styles.css`, `src/_includes/footer.njk`, `tests/homepage.test.js`

---

## 2026-08-26 — Calculators hub is calculators only, with hover previews

`/calculators/` drops the quiz and Building vs buying cards (those stay on the homepage Tools row and their own URLs). Seven calculator cards remain, each led by a real UI crop in the existing Polaroid/index-card treatment that scales on hover. Nav label is Calculators. The eyebrow rule prefix is gone site-wide so CALCULATORS / REPAYMENTS / OFFSET no longer read as an em dash.

**Files changed:** `src/calculators/index.njk`, `src/_includes/nav.njk`, `src/_includes/css/styles.css`, `src/images/calc-previews/*.webp`, `tests/calculators-hub.test.js`, `tests/construction-hub.test.js`, `tests/homepage.test.js`

---

## 2026-08-26 — Kitchen table visual system

Signed-off Type C skin shipped on a branch so main stays navy until merge. Homepage rebuilt to the Kitchen table mockups (Polaroid hero, stamped tickets, index cards, one Why Wombat Polaroid, lined notebook, taped article Polaroids, two static tool cards, quiz after the book band). Global tokens, header, footer, buttons, cards, forms, tools and article templates now use cream / ink / oak / dusty clay with Zilla Slab and IBM Plex Sans. Em dashes stripped from visible copy. Podcast section and Wombat Wrap stay off the homepage (footer still links both). Inner-page carousels restyled only.

**Files changed:** `src/_includes/css/styles.css`, `src/index.njk`, `src/_includes/nav.njk`, `src/_includes/footer.njk`, `src/_layouts/base.njk`, `src/_layouts/article.njk`, fonts under `src/assets/fonts/`, plus inner pages, calculators, and `tests/homepage.test.js`

---

## 2026-08-25 — Who I help: payslips, first home, next move

Who I help H2 is now “Complicated payslips. A first home. The next move.” First-home card leads on base-plus-bonus and lender policy, not RSUs or ESS. Other three cards, FAQ bonus/RSU question, and the RSU article left as-is.

**Files changed:** `src/index.njk`, `tests/homepage.test.js`

---

## 2026-08-25 — Business address on contact/legal only

Registered/postal address (Foundry Cowork virtual office) added in the footer Get in touch line, the terms Contact block, and the existing JSON-LD PostalAddress. No homepage visit-us or map. Sydney based / Sydney local / Beecroft story unchanged. Privacy has no Contact block, so it was left alone.

**Files changed:** `src/_data/site.json`, `src/_includes/footer.njk`, `src/terms.md`, `src/_layouts/base.njk`

---

## 2026-08-25 — Homepage: All tools control, drop quiet Wrap

Tools slider next/scroll-forward control now reads “All tools” (same slide behaviour, no new /tools page). Quiet Wombat Wrap text link under the book CTA is gone; the Wrap card stays in the Tools slider. Footer Wrap link now goes to the Kit newsletter.

**Files changed:** `src/index.njk`, `src/_includes/footer.njk`, `tests/homepage.test.js`

---

## 2026-08-25 — Homepage order + stop promoting SMSF property loans

Locked homepage order: hero (headline + two buttons), proof strip, lender row, video, Who I help, Why Wombat, How it works, Reviews, Articles, Tools slider, Podcast, FAQ, Book, then a quiet Wombat Wrap text link. Mid-page Wrap form is gone. Tools uses the same prev/next carousel as podcast (three cards visible, the rest on the next slide). SMSF lending offer removed from homepage, footer, default meta/OG, JSON-LD and the calculators hub. Reviews, guest bios, KiwiSaver transfer notes and older changelog entries left as-is.

**Files changed:** `src/index.njk`, `src/_includes/footer.njk`, `src/_layouts/base.njk`, `src/calculators/index.njk`

---

## 2026-08-24 — Copy: cash timeline, quiz door is open

Public name of the NSW house-and-land tool is now cash timeline, not cash walk or the walk. Quiz heading is “Which door is actually open?” URLs, duty math, LVR chips, and 6.5% default are unchanged.

**Files changed:** `src/construction/index.njk`, `src/construction/house-and-land-cash.njk`, `src/tools/house-and-land-cash.njk`, `src/which-door.njk`, `src/index.njk`, `src/calculators/index.njk`, `src/llms.txt.njk`, `src/assets/js/house-and-land-cash.js`, `src/assets/js/house-and-land-cash-math.js`, `src/assets/js/which-door.js`, `src/articles/high-income-small-deposit.njk`, `src/articles/kiwisaver-australian-deposit.njk`, `src/_includes/css/styles.css`, `tests/construction-hub.test.js`, `CLAUDE.md`

---

## 2026-08-24 — Cash walk: LVR bands, indicative 6.5%, no bare HIA

Walk LVR is now 70 / 80 / 90 / 95 (default still 90). Annual rate defaults to 6.5% and is labelled indicative only; clear the field to skip IO and P&I. UI copy says Housing Industry Association, not the bare acronym.

**Files changed:** `src/construction/house-and-land-cash.njk`, `src/assets/js/house-and-land-cash-math.js`, `src/assets/js/house-and-land-cash.js`, `tests/house-and-land-cash.test.js`, `tests/construction-hub.test.js`

---

## 2026-08-24 — Construction hub: building vs buying

Buyer-framed mini hub at `/construction/`. Finished home vs building, three build types, a visible comparison table, and the spec fixture as a labelled example. The NSW cash walk moves to `/construction/house-and-land-cash/`. `/tools/house-and-land-cash/` 301s to the walk. Homepage Tools, `/calculators/`, footer, and `llms.txt` now point at the hub. Extra walk inputs default open. Calculators closer says Strategy Session.

**Files added:** `src/construction/index.njk`, `src/construction/house-and-land-cash.njk`, `tests/construction-hub.test.js`
**Files changed:** `src/tools/house-and-land-cash.njk` (redirect stub), `src/_includes/css/styles.css`, `src/_includes/footer.njk`, `src/_includes/calc-cta.njk`, `src/calculators/index.njk`, `src/index.njk`, `src/llms.txt.njk`, `src/assets/js/house-and-land-cash.js`, `netlify.toml`, `package.json`, `CLAUDE.md`

---

## 2026-08-24 — Tool: NSW house and land cash walk

Client-side cash-timing estimator at `/tools/house-and-land-cash/`. Shows when a buyer writes a cheque on a two-contract NSW house-and-land package, and whether they run out of cash. Not an approval, not a max-loan, not a lender comparison. NSW 2026/27 duty on land only; FHBAS concessional band does not invent a dollar. Listed next to the which-door quiz on `/calculators/`, homepage Tools, footer Tools, and `llms.txt`. Not in the homepage hero.

**Files added:** `src/tools/house-and-land-cash.njk`, `src/assets/js/house-and-land-cash-math.js`, `src/assets/js/house-and-land-cash.js`, `tests/house-and-land-cash.test.js`
**Files changed:** `src/_includes/css/styles.css`, `src/_includes/footer.njk`, `src/calculators/index.njk`, `src/index.njk`, `src/llms.txt.njk`, `package.json`

---

## 2026-08-24 — Hug the Calendly iframe on /book/

The booking embed no longer uses a 1150px height floor. Official `widget.js` with `data-resize=true` sizes the iframe to the calendar and time slots. A 700px min-height keeps the month visible before the first resize so a date pick does not leave a dead white band above the Middle link.

**Files changed:** `src/book.njk`, `src/_includes/css/styles.css`

---

## 2026-08-24 — Point /book/ at the live Calendly event slug

Tom renamed the live Calendly event to `strategy-session`. The previous event slug 404s and Calendly does not redirect. `site.calendlyEvent` now uses `https://calendly.com/tom-wombathomeloans/strategy-session`. `/book/` still embeds it with `hide_event_type_details=1` and `hide_gdpr_banner=1`.

**Files changed:** `src/_data/site.json`, `CLAUDE.md`, `docs/briefing.md`

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
