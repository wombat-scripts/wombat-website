# Components

Static HTML snippets for shared site furniture (header, footer). No framework, no build step — these are reference files you paste into each page.

## Files

- `header.html` — Sticky top navigation. Goes immediately after `<body>`.
- `footer.html` — Site footer with brand, links, contact, legal. Goes immediately before `</body>`.

## How to add these to a new page

Every page should follow the structure below. The shared `<head>` block lives in this file too — copy it from the section below the page template.

```html
<!doctype html>
<html lang="en-AU">
<head>
  <!-- Paste the standard <head> block from the section below -->
</head>
<body>

  <!-- Paste contents of header.html here -->

  <main>
    <!-- Page-specific content -->
  </main>

  <!-- Paste contents of footer.html here -->

  <script src="/assets/scripts.js" defer></script>
</body>
</html>
```

## Standard `<head>` block

This is the baseline. Per-page overrides (`<title>`, meta description, OG title, canonical URL, schema) are layered on top in Phase 2.

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Page-specific: override these per page -->
<title>Wombat Home Loans — Sydney mortgage broker</title>
<meta name="description" content="Sydney mortgage broker for expats, professionals, and complex finance. 20+ years banking. 40+ lenders. Book a no-obligation chat.">
<link rel="canonical" href="https://wombatloans.com.au/">

<!-- Open Graph / social -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Wombat Home Loans">
<meta property="og:title" content="Wombat Home Loans — Sydney mortgage broker">
<meta property="og:description" content="Your mortgage shouldn’t feel like your problem to solve.">
<meta property="og:image" content="https://wombatloans.com.au/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://wombatloans.com.au/">
<meta name="twitter:card" content="summary_large_image">

<!-- Favicon (logo doubles as a favicon — works at small sizes) -->
<link rel="icon" type="image/svg+xml" href="/assets/logo.svg">

<!-- Fonts: Fraunces display + Plus Jakarta Sans body -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..600,0..100;1,9..144,300..600,0..100&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap">

<!-- Site styles -->
<link rel="stylesheet" href="/assets/styles.css">

<!-- Schema.org — full structured data is added in Phase 2 -->
```

> **Note on the Fraunces request URL:** It pulls italic + roman, optical-size axis (9–144), weight axis (300–600), and the SOFT axis (0–100). This unlocks the design tokens in `styles.css` that use `font-variation-settings`. If you want to slim the request down later, you can drop `SOFT` — the styles will still work, the headings just won't get the soft-edge variant.

## Why snippets, not a framework

The build plan deliberately keeps this as static HTML so it can be edited via the GitHub web UI from anywhere, deploys instantly via Netlify, and has no framework lock-in. The duplication cost is low — there are only ~6 pages — and the consistency is enforced by `styles.css` rather than by component code.

If duplication ever does become painful, the natural next step is a tiny static-site generator (Eleventy, Astro) with these snippets converted to includes. Not before.

## When updating

If you change `header.html` or `footer.html`, you need to update every page that uses them. The pages currently using them are listed in `docs/CHANGELOG.md`. Keep that list current.
