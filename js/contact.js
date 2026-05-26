/* =========================
   CONTACT PAGE SCRIPT
   Repair Node
========================= */

(function () {
  "use strict";

  const scheduleRepairAnchor = document.getElementById("schedule-repair");

  /* Schedule toggle */
  const scheduleToggle = document.getElementById("schedule-toggle");
  const repairDetails = document.getElementById("repair-details");
  const contactMessageField = document.getElementById("contact-message-field");
  const repairMakeInput = document.getElementById("repair-make");
  const repairModelInput = document.getElementById("repair-model");

  function prefillRepairDetails() {
    const parameters = new URLSearchParams(window.location.search);
    const make = parameters.get("make");
    const model = parameters.get("model");
    const service = parameters.get("service");
    const serviceAliases = {
      "Screen Replacement": "Screen Repair",
      "Charging Port": "Charge Port",
      "Charging Port Replacement": "Charge Port",
      "Charge Port Replacement": "Charge Port",
      "HDMI Port Replacement": "HDMI Port",
      "Stick Replacement": "Stick Drift"
    };

    if (make && repairMakeInput) {
      repairMakeInput.value = make;
    }

    if (model && repairModelInput) {
      repairModelInput.value = model;
    }

    if (service) {
      const serviceValue = serviceAliases[service] || service;
      const serviceInput = Array.from(document.querySelectorAll('input[name="common-service"]'))
        .find((input) => input.value === serviceValue);

      if (serviceInput) {
        serviceInput.checked = true;
      }
    }
  }

  function setRepairDetailsExpanded(isExpanded) {
    if (!scheduleToggle || !repairDetails) {
      return;
    }

    scheduleToggle.setAttribute("aria-expanded", String(isExpanded));
    scheduleToggle.textContent = isExpanded ? "Remove Repair Details" : "Add Repair Details";
    repairDetails.hidden = !isExpanded;
    if (contactMessageField) {
      contactMessageField.hidden = isExpanded;
    }
  }

  if (scheduleToggle && repairDetails) {
    scheduleToggle.addEventListener("click", () => {
      const isExpanded = scheduleToggle.getAttribute("aria-expanded") === "true";
      const nextState = !isExpanded;

      setRepairDetailsExpanded(nextState);

      if (nextState) {
        repairDetails.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (window.location.hash === "#schedule-repair" && scheduleRepairAnchor) {
    prefillRepairDetails();
    setRepairDetailsExpanded(true);
    window.requestAnimationFrame(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

      scheduleRepairAnchor.scrollIntoView({ behavior, block: "start" });
    });
  }

  /* Form submission */
  const form = document.getElementById("contact-form");
  const submitBtn = document.getElementById("submit-btn");
  const msgEl = document.getElementById("form-message");
  const formStartedAtInput = document.getElementById("form-started-at");
  const formStartedAt = Date.now();
  const minimumSubmitDelay = 4000;
  let hasStartedForm = false;
  let isReportingInvalidSubmit = false;
  const formEventParams = {
    form_id: "contact-form",
    form_name: "contact_form"
  };

  if (!form || !submitBtn || !msgEl) {
    return;
  }

  if (formStartedAtInput) {
    formStartedAtInput.value = String(formStartedAt);
  }

  function trackLeadEvent(name, params = {}) {
    if (typeof window.trackLeadEvent === "function") {
      window.trackLeadEvent(name, params);
      return;
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", name, {
        event_category: "lead",
        page_path: window.location.pathname,
        ...params
      });
    }
  }

  if (window.location.hash === "#schedule-repair") {
    const scheduleParameters = new URLSearchParams(window.location.search);

    trackLeadEvent("schedule_form_open", {
      ...formEventParams,
      source: scheduleParameters.has("make") || scheduleParameters.has("model")
        ? "pricing_estimate"
        : "site_cta",
      repair_details_prefilled: scheduleParameters.has("make") || scheduleParameters.has("model")
    });
  }

  function showFormError(message, errorMessage, trackSubmissionError = true) {
    msgEl.textContent = message;
    msgEl.classList.add("form-message--error");
    msgEl.hidden = false;
    if (trackSubmissionError) {
      trackLeadEvent("form_submit_error", {
        ...formEventParams,
        error_message: errorMessage
      });
    }
  }

  function trackFormStart() {
    if (hasStartedForm) {
      return;
    }

    hasStartedForm = true;
    trackLeadEvent("contact_form_start", {
      ...formEventParams
    });
  }

  form.addEventListener("input", trackFormStart, { once: true });
  form.addEventListener("change", trackFormStart, { once: true });

  document.addEventListener("click", (event) => {
    if (!hasStartedForm) {
      return;
    }

    const contactLink = event.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!contactLink) {
      return;
    }

    trackLeadEvent("contact_form_switch_method", {
      ...formEventParams,
      contact_method: contactLink.href.startsWith("tel:")
        ? "phone"
        : "email"
    });
  });

  if (scheduleToggle) {
    scheduleToggle.addEventListener("click", () => {
      if (scheduleToggle.getAttribute("aria-expanded") === "true") {
        trackLeadEvent("contact_repair_details_open", {
          ...formEventParams
        });
      }
    });
  }

  window.onRepairNodeCaptchaLoaded = function () {
    trackLeadEvent("captcha_loaded", {
      ...formEventParams,
      captcha_provider: "hcaptcha"
    });
  };

  window.onRepairNodeCaptchaSuccess = function () {
    trackLeadEvent("captcha_success", {
      ...formEventParams,
      captcha_provider: "hcaptcha"
    });
  };

  window.onRepairNodeCaptchaError = function (captchaError) {
    const errorMessage = String(captchaError || "captcha_error");

    trackLeadEvent("captcha_error", {
      ...formEventParams,
      captcha_provider: "hcaptcha",
      error_message: errorMessage
    });
    showFormError("Captcha could not load. Please retry, or contact us directly.", errorMessage, false);
  };

  window.onRepairNodeCaptchaExpired = function () {
    trackLeadEvent("captcha_failed", {
      ...formEventParams,
      captcha_provider: "hcaptcha",
      error_message: "captcha_expired"
    });
  };

  form.addEventListener("invalid", () => {
    if (isReportingInvalidSubmit) {
      return;
    }

    isReportingInvalidSubmit = true;
    trackLeadEvent("form_submit_attempt", {
      ...formEventParams,
      captcha_provider: "hcaptcha"
    });
    trackLeadEvent("form_submit_error", {
      ...formEventParams,
      error_message: "browser_validation_failed",
      captcha_provider: "hcaptcha"
    });

    window.setTimeout(() => {
      isReportingInvalidSubmit = false;
    }, 0);
  }, true);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    trackLeadEvent("form_submit_attempt", {
      ...formEventParams,
      captcha_provider: "hcaptcha"
    });

    msgEl.hidden = true;
    msgEl.className = "form-message";

    const formData = new FormData(form);
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const startedAt = Number(formData.get("form_started_at"));
    const captchaResponse = String(formData.get("h-captcha-response") || "").trim();

    if (!phone || !email) {
      showFormError("Please enter both a phone number and email so we can reach you.", "missing_required_contact_information");
      return;
    }

    if (!captchaResponse) {
      showFormError("Please complete the captcha before sending the form.", "captcha_incomplete");
      return;
    }

    if (!Number.isFinite(startedAt) || Date.now() - startedAt < minimumSubmitDelay) {
      showFormError("Please wait a moment before sending the form.", "submitted_too_quickly");
      return;
    }

    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        msgEl.textContent = "Message sent! We'll be in touch soon.";
        msgEl.classList.add("form-message--success");
        msgEl.hidden = false;
        form.reset();

        trackLeadEvent("form_submit_success", {
          ...formEventParams,
          captcha_provider: "hcaptcha"
        });
        trackLeadEvent("generate_lead", {
          ...formEventParams
        });

        setRepairDetailsExpanded(false);
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch {
      msgEl.textContent = "Something went wrong - please call us or try again.";
      msgEl.classList.add("form-message--error");
      msgEl.hidden = false;
      trackLeadEvent("form_submit_error", {
        ...formEventParams,
        error_message: "provider_or_network_error",
        captcha_provider: "hcaptcha"
      });
    } finally {
      submitBtn.textContent = "Send Request";
      submitBtn.disabled = false;
    }
  });
})();
