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

})();
