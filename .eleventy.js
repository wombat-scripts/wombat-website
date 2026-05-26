module.exports = function (eleventyConfig) {

  // --- Pass-through copies (not processed, just copied to _site/) ---
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("src/llms.txt");
  eleventyConfig.addPassthroughCopy("src/llms-full.txt");

  // --- Filters ---

  // Format a date as "3 May 2026"
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    const d = new Date(dateObj);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });

  // ISO date for <time datetime="">
  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return new Date(dateObj).toISOString().split("T")[0];
  });

  // Limit a collection (for "latest 3 articles")
  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));

  // --- Collections ---

  // All articles, newest first
  eleventyConfig.addCollection("articles", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/articles/*.{md,njk}")
      .filter((item) => !item.filePathStem.endsWith("/index"))
      .sort((a, b) => b.date - a.date);
  });

  // --- Shortcodes ---

  // CTA button → Calendly
  eleventyConfig.addShortcode("cta", function (text, variant) {
    const cls = variant === "outline" ? "btn btn--outline" : "btn btn--primary";
    return `<a href="https://calendly.com/tom-wombathomeloans" class="${cls}">${text || "Book a free discovery call"}</a>`;
  });

  // Current year (for footer copyright)
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  // --- Config ---
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
