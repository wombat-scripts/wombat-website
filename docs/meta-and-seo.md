# How to update meta when adding pages

**Status:** Phase 2 deliverable. Updated: 2026-05-03.

This is the practical reference for keeping SEO, GEO, and social meta correct as the site grows. Read it once, refer back when adding pages.

---

## The five files that matter

| File | Lives at | What it does | When to update |
|---|---|---|---|
| `head-template.html` | `public/_components/` | The reusable `<head>` block. Paste into each page. | Reference when building any new page |
| `sitemap.xml` | `public/` | Lists every public URL for search engines | Add an entry for every new page |
| `robots.txt` | `public/` | Tells crawlers what to index | Only update if blocking a new path |
| `llms.txt` | `public/` | Concise site overview for AI crawlers | Update when adding a major section |
| `llms-full.txt` | `public/` | Extended content (article bodies etc.) for AI ingestion | Update when articles publish or content shifts |

---

## Adding a new page — checklist

Every time a new page goes live:

1. **Paste the head template** into the page's `<head>`.
2. **Replace every `{{TOKEN}}`** in the head — search the file for `{{` to make sure none are missed. Unfilled tokens get crawled and look terrible in social previews.
3. **Choose the right schema block:**
   - Homepage → keep FAQ schema (Section 3 of the template)
   - Article page → keep Article schema (Section 4), drop FAQ schema
   - Other pages (podcast, legal, etc.) → drop both Section 3 and Section 4, keep Section 1 + 2 only
4. **Add to `sitemap.xml`.** Use the format shown in the existing entries. Set `<lastmod>` to today's date in YYYY-MM-DD.
5. **If it's a major page** (a new top-level section, not just an article), add a link to `llms.txt` under "Core pages."
6. **If it's an article**, append the full body to `llms-full.txt` under "## Articles" using the format in the placeholder comment.
7. **Test the social preview** before announcing the page anywhere — see "Validation" below.

---

## Token reference

When pasting the head template, these are the tokens to replace per page:

| Token | What it is | Example |
|---|---|---|
| `{{PAGE_TITLE}}` | Page title, max ~55 chars (Google truncates around 60) | `How expats get an Australian mortgage` |
| `{{PAGE_DESCRIPTION}}` | Meta description, 150–160 chars. Sells the click. | `A practical guide for Australians overseas and foreign-income earners buying property in Australia. Lender shortlists, income recognition, common pitfalls.` |
| `{{PAGE_PATH}}` | Path with leading slash. `/` for homepage. | `/articles/expat-mortgage-guide.html` |
| `{{PAGE_TYPE}}` | Open Graph type | `website` for most pages, `article` for articles |
| `{{OG_IMAGE}}` | Absolute URL of the OG image | `https://wombatloans.com.au/assets/og-image.jpg` (default) or article-specific |

For article pages, also replace:

| Token | What it is | Example |
|---|---|---|
| `{{ARTICLE_TITLE}}` | Same as `{{PAGE_TITLE}}` typically | `How expats get an Australian mortgage` |
| `{{ARTICLE_DESCRIPTION}}` | Same as `{{PAGE_DESCRIPTION}}` typically | (as above) |
| `{{ARTICLE_PUBLISHED}}` | ISO 8601 publish date | `2026-04-15` |
| `{{ARTICLE_MODIFIED}}` | ISO 8601 last-modified date | `2026-04-15` (same as published unless you've edited it) |
| `{{ARTICLE_IMAGE}}` | Absolute URL of article hero image | `https://wombatloans.com.au/images/articles/expat-guide-hero.jpg` |

---

## Title and description writing rules

Titles and descriptions are the single highest-leverage SEO copy on the site. They're what shows in Google results and social previews.

**Titles:**
- Max ~55 characters (Google truncates beyond this on desktop)
- Include the keyword the page is targeting, naturally
- The site name (`| Wombat Home Loans`) is appended automatically by the template — don't repeat it
- Sentence case, not Title Case ("How expats get an Australian mortgage", not "How Expats Get an Australian Mortgage")

**Descriptions:**
- 150–160 characters
- Read like ad copy, not summary copy. The job is to earn the click.
- Australian English. No em-dashes if you can help it (they render inconsistently in SERPs).
- Don't keyword-stuff. Google rewrites descriptions that look stuffed.

**Test your title length:** Paste into [SERP simulator](https://www.highervisibility.com/seo/tools/serp-snippet-optimizer/) before committing.

---

## Sitemap rules

Priority and changefreq guide:

| Page type | priority | changefreq |
|---|---|---|
| Homepage | 1.0 | weekly |
| Podcast page | 0.8 | weekly |
| Articles | 0.7 | monthly |
| Legal pages (privacy, terms) | 0.3 | yearly |

Update `<lastmod>` whenever the page's content materially changes — not for typo fixes.

---

## llms.txt rules

`llms.txt` is the short version. Keep it under ~2,000 words. Update when:
- Adding a major top-level page (new section, not a single article)
- Tom's positioning shifts (new specialty, new credential)
- Contact details change
- A new differentiator becomes worth foregrounding

Don't bloat it with every article — articles live in `llms-full.txt` and the sitemap.

## llms-full.txt rules

`llms-full.txt` is the long version. It can be much longer (~50k+ words). Update when:
- An article publishes (append full body under `## Articles`)
- FAQs change
- Major content shifts on the site

Format for adding articles (matches the placeholder in the file):

```markdown
### Article title
Published: YYYY-MM-DD | Category: [category] | URL: https://wombatloans.com.au/articles/SLUG.html

Full article body in markdown.

---
```

---

## Validation — do this before sharing any new page publicly

1. **Schema:** [Google Rich Results Test](https://search.google.com/test/rich-results) — paste the URL, check no errors
2. **Schema (deeper):** [Schema Markup Validator](https://validator.schema.org/) — paste the URL
3. **Social — Facebook/LinkedIn:** [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/) — paste the URL, click "Scrape Again"
4. **Social — Twitter/X:** [Twitter Card Validator](https://cards-dev.twitter.com/validator) — paste the URL
5. **Social — LinkedIn (separate):** [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — paste the URL
6. **Lighthouse:** Chrome DevTools → Lighthouse → Run. Target 95+ on SEO. 

If the OG image isn't showing in any of the social validators, the most likely cause is the image URL not being absolute (it must start with `https://`).

---

## After Phase 8 launch

Two manual jobs once the site is live on `wombatloans.com.au`:

1. **Submit sitemap to Google Search Console:** Property → Sitemaps → enter `sitemap.xml` → Submit
2. **Submit sitemap to Bing Webmaster Tools:** Sitemaps → Submit a sitemap → enter the full URL

Both will then re-crawl the sitemap automatically going forward.

---

## What I'm deliberately NOT doing

A few things this docs file intentionally skips, with reasoning:

- **No `hreflang` tags.** Single-language site (en-AU). Add later if a UK or US version is ever built.
- **No AMP.** Dead format. Google deprioritised it.
- **No `<meta name="keywords">`.** Ignored by Google since 2009.
- **No verbose `<meta>` tags** for things like `revisit-after`, `distribution`, `rating`. None of them do anything.
- **No JSON-LD `BreadcrumbList`** yet. Add when articles ship in Phase 4 if the site develops nested URL structure.
