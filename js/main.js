/* =========================
   MAIN SITE SCRIPT
   Repair Node
========================= */

(function () {
  "use strict";

  /* -------------------------
     CONFIG
  ------------------------- */
  const HERO_SCROLL_OFFSET = 80; // px before socials appear
  const SCROLL_THRESHOLDS = [25, 50, 75, 100]; // %

  let scrollTracked = {
    25: false,
    50: false,
    75: false,
    100: false
  };

  /* -------------------------
     HELPERS
  ------------------------- */
  function trackEvent(name, props = {}) {
    if (typeof window.plausible === "function") {
      window.plausible(name, { props });
    }
  }

  function getScrollPercent() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / docHeight) * 100);
  }

  /* -------------------------
     SCROLL HANDLER
  ------------------------- */
  function onScroll() {
    // Toggle social icons
    if (window.scrollY > HERO_SCROLL_OFFSET) {
      document.body.classList.add("show-socials");
    } else {
      document.body.classList.remove("show-socials");
    }

    // Scroll depth tracking
    const percent = getScrollPercent();

    SCROLL_THRESHOLDS.forEach((threshold) => {
      if (percent >= threshold && !scrollTracked[threshold]) {
        scrollTracked[threshold] = true;
        trackEvent("ScrollDepth", { depth: threshold + "%" });
      }
    });
  }

  /* -------------------------
     INIT
  ------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const hamburger = document.getElementById("hamburger");
    const nav = document.getElementById("main-nav");

    if (header && hamburger && nav) {
      const closeMenu = () => {
        header.classList.remove("menu-open");
        hamburger.setAttribute("aria-expanded", "false");
      };

      hamburger.addEventListener("click", () => {
        const isOpen = header.classList.toggle("menu-open");
        hamburger.setAttribute("aria-expanded", String(isOpen));
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
          closeMenu();
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  });

})();
