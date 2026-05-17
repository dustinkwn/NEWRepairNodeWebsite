/* =========================
   PRICING PAGE SCRIPT
   Repair Node
========================= */

(function () {
  "use strict";

  const catalogUrl = new URL("../data/pricing-catalog.json", document.currentScript.src).href;

  const form = document.getElementById("pricing-form");
  const typeSelect = document.getElementById("device-type");
  const makeSelect = document.getElementById("device-make");
  const modelSelect = document.getElementById("device-model");
  const subModelSelect = document.getElementById("device-submodel");
  const serviceSelect = document.getElementById("device-service");
  const typeLabel = document.getElementById("device-type-label");
  const makeLabel = document.getElementById("device-make-label");
  const modelLabel = document.getElementById("device-model-label");
  const subModelLabel = document.getElementById("device-submodel-label");
  const serviceLabel = document.getElementById("device-service-label");
  const estimateButton = document.getElementById("device-estimate");
  const result = document.getElementById("estimate-result");
  const pathPreview = document.getElementById("selection-path");
  const modelField = modelSelect?.closest(".field-group");
  const subModelField = subModelSelect?.closest(".field-group");

  let catalog = [];

  function setOptions(select, items, placeholder) {
    select.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);

    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = getOptionLabel(item);
      select.appendChild(option);
    });

    select.disabled = items.length === 0;
    select.value = "";
  }

  function resetSelect(select, placeholder) {
    setOptions(select, [], placeholder);
  }

  function getOptionLabel(item) {
    if (item?.priceLabel || typeof item?.price === "number") {
      return `${item.name} - ${formatPrice(item)}`;
    }

    return item.name;
  }

  function formatPrice(service) {
    if (service?.priceLabel) {
      return service.priceLabel;
    }

    if (typeof service?.price !== "number") {
      return "Call for pricing";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(service.price);
  }

  function getSelectedType() {
    return catalog.find((item) => item.name === typeSelect.value);
  }

  function getSelectedMake() {
    return getSelectedType()?.makes.find((item) => item.name === makeSelect.value);
  }

  function getSelectedModel() {
    return getSelectedMake()?.models?.find((item) => item.name === modelSelect.value);
  }

  function getSelectedSubModel() {
    return getSelectedModel()?.subModels?.find((item) => item.name === subModelSelect.value);
  }

  function getServiceSource() {
    const make = getSelectedMake();
    const model = getSelectedModel();

    if (model?.subModels?.length) {
      return getSelectedSubModel();
    }

    if (model?.services?.length) {
      return model;
    }

    if (make?.services?.length && !make.models?.length) {
      return make;
    }

    return null;
  }

  function shouldShowModel() {
    return Boolean(getSelectedMake()?.models?.length);
  }

  function shouldShowSubModel() {
    return Boolean(getSelectedModel()?.subModels?.length);
  }

  function updateStepLabels() {
    let step = 1;

    if (typeLabel) typeLabel.textContent = `${step++}. Device Type`;
    if (makeLabel) makeLabel.textContent = `${step++}. Make`;

    if (shouldShowModel()) {
      if (modelLabel) modelLabel.textContent = `${step++}. Model`;
    }

    if (shouldShowSubModel()) {
      if (subModelLabel) subModelLabel.textContent = `${step++}. Sub-Model`;
    }

    if (serviceLabel) {
      serviceLabel.textContent = `${step}. Service`;
    }
  }

  function setModelVisibility(isVisible) {
    modelField?.classList.toggle("is-hidden", !isVisible);
    if (!isVisible) {
      modelSelect.value = "";
    }
    updateStepLabels();
  }

  function setSubModelVisibility(isVisible) {
    subModelField?.classList.toggle("is-hidden", !isVisible);
    if (!isVisible) {
      subModelSelect.value = "";
    }
    updateStepLabels();
  }

  function getSelectedService() {
    return getAvailableServices().find((item) => item.name === serviceSelect.value);
  }

  function getAvailableServices() {
    const type = getSelectedType();
    const make = getSelectedMake();
    const model = getSelectedModel();
    const serviceSource = getServiceSource();

    if (!type || !serviceSource) {
      return [];
    }

    const configuredNames = serviceSource.serviceOptions?.length
      ? serviceSource.serviceOptions
      : model?.serviceOptions?.length
        ? model.serviceOptions
        : type.serviceOptions?.length
          ? type.serviceOptions
          : serviceSource.services.map((item) => item.name);

    return configuredNames.map((name) => {
      const matchedService = serviceSource.services.find((item) => item.name === name);

      if (matchedService) {
        return matchedService;
      }

      const fallbackSources = [
        model?.defaultServices ?? [],
        make?.defaultServices ?? [],
        type.defaultServices ?? []
      ];

      for (const services of fallbackSources) {
        const fallbackMatch = services.find((item) => item.name === name);
        if (fallbackMatch) {
          return fallbackMatch;
        }
      }

      return { name, price: null };
    });
  }

  function isComputerPath() {
    return typeSelect.value === "Computer";
  }

  function getPricingNote(selectedService) {
    if (!selectedService || !isComputerPath()) {
      return "";
    }

    if (selectedService.name === "Diagnostic") {
      return "Laptop and desktop diagnostics are paid upfront and fully applied to an approved repair.";
    }

    if (selectedService.priceLabel || typeof selectedService.price !== "number") {
      return "Call for Pricing";
    }

    return "If you already paid the $100 computer diagnosis fee, that amount is credited toward this repair total.";
  }

  function updatePathPreview() {
    const parts = [
      typeSelect.value,
      makeSelect.value,
      modelSelect.value,
      subModelSelect.value,
      serviceSelect.value
    ].filter(Boolean);

    pathPreview.textContent = parts.length ? parts.join(" > ") : "Choose a device path to see your estimate.";
  }

  function resetResult() {
    result.style.display = "none";
    result.innerHTML = "";
  }

  function updateEstimateState() {
    const hasFullSelection = Boolean(getSelectedService());
    estimateButton.disabled = !hasFullSelection;
    estimateButton.classList.toggle("btn-disabled", !hasFullSelection);
    estimateButton.classList.toggle("btn-primary", hasFullSelection);
    updatePathPreview();
  }

  function onTypeChange() {
    const type = getSelectedType();
    setOptions(makeSelect, type?.makes ?? [], "Select Make");
    setModelVisibility(false);
    setSubModelVisibility(false);
    resetSelect(modelSelect, "Select Model");
    resetSelect(subModelSelect, "Select Sub-Model");
    resetSelect(serviceSelect, "Select Service");
    resetResult();
    updateEstimateState();
  }

  function onMakeChange() {
    const make = getSelectedMake();
    const showModel = Boolean(make?.models?.length);

    setModelVisibility(showModel);
    setSubModelVisibility(false);

    if (showModel) {
      setOptions(modelSelect, make.models, "Select Model");
      resetSelect(subModelSelect, "Select Sub-Model");
      resetSelect(serviceSelect, "Select Service");
    } else {
      resetSelect(modelSelect, "Select Model");
      resetSelect(subModelSelect, "Select Sub-Model");
      setOptions(serviceSelect, getAvailableServices(), "Select Service");
    }

    resetResult();
    updateEstimateState();
  }

  function onModelChange() {
    const model = getSelectedModel();
    const showSubModel = Boolean(model?.subModels?.length);

    setSubModelVisibility(showSubModel);

    if (showSubModel) {
      setOptions(subModelSelect, model.subModels, "Select Sub-Model");
      resetSelect(serviceSelect, "Select Service");
    } else {
      resetSelect(subModelSelect, "Select Sub-Model");
      setOptions(serviceSelect, getAvailableServices(), "Select Service");
    }

    resetResult();
    updateEstimateState();
  }

  function onSubModelChange() {
    setOptions(serviceSelect, getAvailableServices(), "Select Service");
    resetResult();
    updateEstimateState();
  }

  function onServiceChange() {
    resetResult();
    updateEstimateState();
  }

  async function loadCatalog() {
    try {
      const response = await fetch(catalogUrl, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Pricing catalog could not be loaded.");
      }

      const data = await response.json();
      catalog = data.deviceTypes ?? [];
      setOptions(typeSelect, catalog, "Select Device Type");
    } catch (error) {
      result.innerHTML = '<p class="estimate-description">We could not load pricing right now. Please call for a quote.</p>';
      result.style.display = "block";
    }
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedService = getSelectedService();
    if (!selectedService) {
      return;
    }

    result.innerHTML = [
      "<p class=\"estimate-label\">Estimated Price</p>",
      `<p class="estimate-price">${formatPrice(selectedService)}</p>`,
      `<p class="estimate-description">${pathPreview.textContent}</p>`,
      getPricingNote(selectedService) ? `<p class="estimate-description">${getPricingNote(selectedService)}</p>` : ""
    ].join("");
    result.style.display = "block";
    result.scrollIntoView({ behavior: "smooth", block: "center" });

    if (typeof window.plausible === "function") {
      window.plausible("EstimateViewed", {
        props: {
          path: pathPreview.textContent,
          price: selectedService.priceLabel ?? String(selectedService.price)
        }
      });
    }
  });

  typeSelect?.addEventListener("change", onTypeChange);
  makeSelect?.addEventListener("change", onMakeChange);
  modelSelect?.addEventListener("change", onModelChange);
  subModelSelect?.addEventListener("change", onSubModelChange);
  serviceSelect?.addEventListener("change", onServiceChange);

  resetSelect(makeSelect, "Select Make");
  resetSelect(modelSelect, "Select Model");
  resetSelect(subModelSelect, "Select Sub-Model");
  resetSelect(serviceSelect, "Select Service");
  setModelVisibility(false);
  setSubModelVisibility(false);
  updateEstimateState();
  loadCatalog();
})();
