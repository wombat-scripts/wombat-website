const fs = require("fs");
const path = require("path");

// Intrinsic pixel size for an article thumbnail, so the hero img can reserve
// its real ratio. Falls back to 16:9 if the file cannot be read.
function imageSize(src) {
  const fallback = { width: 1280, height: 720 };
  const rel = String(src || "").replace(/^\//, "");
  if (!rel) return fallback;
  const file = path.join(__dirname, "src", rel);
  let data;
  try {
    data = fs.readFileSync(file);
  } catch {
    return fallback;
  }

  if (data[0] === 0x89 && data[1] === 0x50) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }

  if (data[0] === 0xff && data[1] === 0xd8) {
    let i = 2;
    while (i < data.length - 8) {
      if (data[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = data[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { height: data.readUInt16BE(i + 5), width: data.readUInt16BE(i + 7) };
      }
      if (marker === 0xd8 || marker === 0x01) {
        i += 2;
        continue;
      }
      const seglen = data.readUInt16BE(i + 2);
      if (seglen < 2) break;
      i += 2 + seglen;
    }
  }

  if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") {
    const chunk = data.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + data.readUIntLE(24, 3),
        height: 1 + data.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8 ") {
      const start = data.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
      if (start !== -1 && start + 7 < data.length) {
        return {
          width: data.readUInt16LE(start + 3) & 0x3fff,
          height: data.readUInt16LE(start + 5) & 0x3fff,
        };
      }
    }
    if (chunk === "VP8L" && data.length >= 25) {
      const b0 = data[21];
      const b1 = data[22];
      const b2 = data[23];
      const b3 = data[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }
  }

  return fallback;
}

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

  eleventyConfig.addFilter("imageWidth", (src) => imageSize(src).width);
  eleventyConfig.addFilter("imageHeight", (src) => imageSize(src).height);

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

  // One line for llms feeds. Also folds em and en dashes so the brief stays hyphen-only.
  eleventyConfig.addFilter("oneLine", (value) =>
    String(value || "")
      .replace(/\u2014|\u2013/g, "-")
      .replace(/\s+/g, " ")
      .trim()
  );

  // --- Collections ---

  // All articles, newest first
  eleventyConfig.addCollection("articles", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/articles/*.{md,njk}")
      .filter((item) => !item.filePathStem.endsWith("/index"))
      .sort((a, b) => b.date - a.date);
  });

  // --- Shortcodes ---

  // CTA button → /book/ (same tab). "outline" maps to ghost — btn--outline is unused.
  eleventyConfig.addShortcode("cta", function (text, variant) {
    const cls = (variant === "outline" || variant === "ghost") ? "btn btn--ghost" : "btn btn--primary";
    return `<a href="/book/" class="${cls}">${text || "Book a Strategy Session"}</a>`;
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
