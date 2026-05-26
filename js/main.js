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

  function trackLeadEvent(name, params = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, {
        event_category: "lead",
        page_path: window.location.pathname,
        ...params
      });
    }
  }

  window.trackLeadEvent = trackLeadEvent;

  function getLinkText(element) {
    const imageAlt = element.querySelector("img")?.alt;
    return (element.textContent.trim() || imageAlt || element.getAttribute("aria-label") || "Unlabeled link")
      .replace(/\s+/g, " ");
  }

  function onLeadLinkClick(event) {
    const link = event.target.closest("a[href]");
    if (!link) {
      return;
    }

    const href = link.getAttribute("href") || "";
    const params = {
      link_url: href,
      link_text: getLinkText(link),
      ...(link.dataset.location ? { location: link.dataset.location } : {})
    };

    if (href.startsWith("tel:")) {
      trackLeadEvent("phone_click", params);
      return;
    }

    if (href.startsWith("mailto:")) {
      trackLeadEvent("email_click", params);
      return;
    }

    if (link.dataset.socialPlatform) {
      if (typeof window.gtag === "function") {
        window.gtag("event", "social_click", {
          link_url: href,
          link_text: getLinkText(link),
          social_platform: link.dataset.socialPlatform,
          page_path: window.location.pathname,
          ...(link.dataset.location ? { location: link.dataset.location } : {})
        });
      }
      return;
    }

    if (link.dataset.leadEvent && link.dataset.leadEvent !== "directions") {
      trackLeadEvent(link.dataset.leadEvent, params);
      return;
    }

    if (
      link.dataset.leadEvent === "directions"
      || /google\.(com|[a-z.]+)\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(href)
    ) {
      trackLeadEvent("directions_click", params);
    }
  }

  function getScrollPercent() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / docHeight) * 100);
  }

  function loadMobileTikTokEmbed() {
    const mobileEmbed = document.querySelector(".featured-work-mobile-embed");
    if (!mobileEmbed || !window.matchMedia("(max-width: 600px)").matches) {
      return;
    }

    const userAgent = navigator.userAgent;
    const isSafari = /Safari/i.test(userAgent) && !/(Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Android)/i.test(userAgent);
    if (isSafari) {
      mobileEmbed.closest(".featured-work-video")?.classList.add("preview-fallback");
      return;
    }

    if (document.querySelector("script[data-tiktok-mobile-embed]")) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    script.dataset.tiktokMobileEmbed = "true";
    document.body.appendChild(script);
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
    const mobileViewport = window.matchMedia("(max-width: 600px)");

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

    loadMobileTikTokEmbed();
    mobileViewport.addEventListener?.("change", (event) => {
      if (event.matches) {
        loadMobileTikTokEmbed();
      }
    });

    document.addEventListener("click", onLeadLinkClick);
    window.addEventListener("scroll", onScroll, { passive: true });
  });

})();
