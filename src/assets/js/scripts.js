/* =============================================================================
   Wombat Home Loans — Shared scripts
   -----------------------------------------------------------------------------
   Vanilla JS. No build step, no dependencies. Loaded with `defer` so DOMContent
   is already available; we still guard for safety.

   Modules:
     1. Nav scroll state + mobile toggle
     2. Marquee track duplication (so the loop is seamless)
     3. Reveal-on-scroll via IntersectionObserver
     4. Smooth in-page anchors (header-aware)
     5. Year stamp helper for the footer
   ============================================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------------
     1. Nav: scrolled state + mobile toggle
     --------------------------------------------------------------------------- */

  const nav = document.querySelector("[data-nav]");

  if (nav) {
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const toggle = nav.querySelector("[data-nav-toggle]");
    const links  = nav.querySelector("[data-nav-links]");

    if (toggle && links) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", links.id || "nav-links");
      if (!links.id) links.id = "nav-links";

      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });

      // Close menu when a link is tapped on mobile
      links.addEventListener("click", (e) => {
        if (e.target.tagName === "A" && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        }
      });

      // Esc closes the menu
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
          toggle.focus();
        }
      });
    }
  }


  /* ---------------------------------------------------------------------------
     2. Marquee: duplicate the track so the CSS animation loops seamlessly
     --------------------------------------------------------------------------- */

  document.querySelectorAll("[data-marquee]").forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    if (!track || track.dataset.duplicated === "true") return;
    track.innerHTML += track.innerHTML;
    track.dataset.duplicated = "true";
  });


  /* ---------------------------------------------------------------------------
     3. Reveal-on-scroll
     --------------------------------------------------------------------------- */

  const revealTargets = document.querySelectorAll("[data-reveal]");

  if (revealTargets.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    revealTargets.forEach((el) => io.observe(el));
  } else {
    // Fallback: just show them
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }


  /* ---------------------------------------------------------------------------
     4. Smooth anchor scrolling, accounting for the sticky nav height
     --------------------------------------------------------------------------- */

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (href === "#" || href.length < 2) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const navHeight = nav ? nav.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
    window.scrollTo({ top, behavior: "smooth" });

    // Update URL without jumping
    history.pushState(null, "", href);
  });


  /* ---------------------------------------------------------------------------
     5. Footer year stamp — keeps copyright current with no maintenance
     --------------------------------------------------------------------------- */

  document.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

   /* ---------------------------------------------------------------------------
   6. Search overlay
   --------------------------------------------------------------------------- */

function initSearchOverlay() {
  const overlay   = document.querySelector("[data-search-overlay]");
  const openBtns  = document.querySelectorAll("[data-search-open]");
  const closeBtns = document.querySelectorAll("[data-search-close]");

  if (!overlay || !openBtns.length) return;

  let pagefindInitialised = false;

  function openSearch() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!pagefindInitialised && window.PagefindUI) {
      new window.PagefindUI({
        element: "#search-global",
        showImages: false,
        resetStyles: true,
        excerptLength: 20,
        showEmptyFilters: false,
      });
      pagefindInitialised = true;
    }

    setTimeout(() => {
      const input = overlay.querySelector(".pagefind-ui__search-input");
      if (input) input.focus();
    }, 120);
  }

  function closeSearch() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openBtns.forEach((btn) => btn.addEventListener("click", openSearch));
  closeBtns.forEach((btn) => btn.addEventListener("click", closeSearch));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closeSearch();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearchOverlay);
} else {
  initSearchOverlay();
}

})();
