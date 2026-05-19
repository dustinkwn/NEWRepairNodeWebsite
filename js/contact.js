/* =========================
   CONTACT PAGE SCRIPT
   Repair Node
========================= */

(function () {
  "use strict";

  const scheduleRepairAnchor = document.getElementById("schedule-repair");

  if (window.location.hash === "#schedule-repair" && scheduleRepairAnchor) {
    window.requestAnimationFrame(() => {
      scheduleRepairAnchor.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* Schedule toggle */
  const scheduleToggle = document.getElementById("schedule-toggle");
  const repairDetails = document.getElementById("repair-details");

  if (scheduleToggle && repairDetails) {
    scheduleToggle.addEventListener("click", () => {
      const isExpanded = scheduleToggle.getAttribute("aria-expanded") === "true";
      const nextState = !isExpanded;

      scheduleToggle.setAttribute("aria-expanded", String(nextState));
      scheduleToggle.textContent = nextState ? "Remove Repair Details" : "Add Repair Details";
      repairDetails.hidden = !nextState;

      if (nextState) {
        repairDetails.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* Form submission */
  const form = document.getElementById("contact-form");
  const submitBtn = document.getElementById("submit-btn");
  const msgEl = document.getElementById("form-message");
  const formStartedAtInput = document.getElementById("form-started-at");
  const formStartedAt = Date.now();
  const minimumSubmitDelay = 4000;

  if (!form || !submitBtn || !msgEl) {
    return;
  }

  if (formStartedAtInput) {
    formStartedAtInput.value = String(formStartedAt);
  }

  function showFormError(message) {
    msgEl.textContent = message;
    msgEl.classList.add("form-message--error");
    msgEl.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    msgEl.hidden = true;
    msgEl.className = "form-message";

    const formData = new FormData(form);
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const startedAt = Number(formData.get("form_started_at"));
    const captchaResponse = String(formData.get("h-captcha-response") || "").trim();

    if (!phone && !email) {
      showFormError("Please enter a phone number or email so we can reach you.");
      return;
    }

    if (!captchaResponse) {
      showFormError("Please complete the captcha before sending the form.");
      return;
    }

    if (!Number.isFinite(startedAt) || Date.now() - startedAt < minimumSubmitDelay) {
      showFormError("Please wait a moment before sending the form.");
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

        if (repairDetails) {
          repairDetails.hidden = true;
        }

        if (scheduleToggle) {
          scheduleToggle.setAttribute("aria-expanded", "false");
          scheduleToggle.textContent = "Add Repair Details";
        }
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch {
      msgEl.textContent = "Something went wrong - please call us or try again.";
      msgEl.classList.add("form-message--error");
      msgEl.hidden = false;
    } finally {
      submitBtn.textContent = "Send Request";
      submitBtn.disabled = false;
    }
  });
})();
