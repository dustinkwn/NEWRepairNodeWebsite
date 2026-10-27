(function () {
  'use strict';
  const core = window.RepairPricing;
  const categories = [
    { id: 'phones', title: 'Phone Repairs', types: ['Phone'], description: 'Screens, batteries, charging ports & more' },
    { id: 'tablets', title: 'Tablet Repairs', types: ['Tablet'], description: 'iPad screens, batteries & charging repairs' },
    { id: 'computers', title: 'Laptop & Computer Repairs', types: ['Computer'], description: 'Apple & Windows laptops and desktops' },
    { id: 'gaming', title: 'Game Console Repairs', types: ['Gaming', 'Controllers'], description: 'Xbox, PlayStation, Nintendo & controllers' }
  ];
  const host = document.getElementById('repair-categories');
  const status = document.getElementById('catalog-status');
  const controllers = [];
  let hasStartedEstimate = false;
  function track(name, params) {
    if (typeof window.trackLeadEvent === 'function') window.trackLeadEvent(name, params);
  }
  function options(select, items, placeholder) {
    // Use real option nodes for older iPhone Safari, matching the existing site fix.
    select.textContent = '';
    const initial = document.createElement('option');
    initial.value = ''; initial.textContent = placeholder; select.appendChild(initial);
    items.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = String(index); option.textContent = item.label || item.name;
      select.appendChild(option);
    });
    select.disabled = !items.length;
    select.value = '';
  }
  function createCategory(category, catalog, index) {
    const entries = catalog.deviceTypes.filter(t => category.types.includes(t.name))
      .flatMap(type => type.makes.map(make => ({ type, make, label: type.name === 'Controllers' ? `Controller · ${make.name}` : make.name })));
    const section = document.createElement('section');
    section.className = 'repair-category';
    section.innerHTML = `<h2><button type="button" id="${category.id}-toggle" class="category-toggle" aria-expanded="${index === 0}" aria-controls="${category.id}-panel"><span><span class="category-title">${category.title}</span><span class="category-description">${category.description}</span></span><span class="category-chevron" aria-hidden="true">+</span></button></h2>
      <div id="${category.id}-panel" class="category-panel" role="region" aria-labelledby="${category.id}-toggle" ${index ? 'hidden' : ''}>
        <form class="repair-form" aria-label="${category.title} estimate">
          <div class="repair-fields">
            <label class="repair-field">Brand<select name="brand" aria-label="${category.title}: Brand"></select></label>
            <label class="repair-field" hidden>Model<select name="model" disabled aria-label="${category.title}: Model"></select></label>
            <label class="repair-field" hidden>Sub-Model<select name="submodel" disabled aria-label="${category.title}: Sub-Model"></select></label>
            <label class="repair-field">Service<select name="service" disabled aria-label="${category.title}: Service"></select></label>
          </div>
          <div class="estimate-region" role="status" aria-live="polite" aria-atomic="true"><p class="estimate-prompt">Choose your device and service to see an estimate.</p></div>
        </form>
        ${category.id === 'phones' ? '<aside class="screen-quality"><h3>Why Screen Quality Matters</h3><p>Not all replacement screens are created equal. When your iPhone originally came with an OLED display, we replace it with OLED—not a cheaper LCD conversion. This helps preserve the display quality, contrast, and power efficiency your phone was designed to deliver.</p></aside>' : ''}
        <p class="custom-repair">Don’t see your repair? <a href="/contact/">Contact us for an estimate.</a></p>
      </div>`;
    host.append(section);
    const toggle = section.querySelector('button');
    const panel = section.querySelector('.category-panel');
    const form = section.querySelector('form');
    const [brand, model, submodel, service] = form.querySelectorAll('select');
    const result = section.querySelector('.estimate-region');
    let deviceList = [], serviceList = [];
    const entry = () => entries[brand.value];
    const device = () => deviceList[model.value];
    const source = () => {
      const selected = device(), current = entry();
      if (selected) return selected.source || (selected.model.subModels || [])[submodel.value] || null;
      return current && !(current.make.models && current.make.models.length) ? current.make : null;
    };
    const clearEstimate = () => { result.textContent = ''; const p = document.createElement('p'); p.className = 'estimate-prompt'; p.textContent = 'Choose your device and service to see an estimate.'; result.append(p); };
    function loadServices() {
      serviceList = entry() ? core.services(entry().type, entry().make, device() && device().model, source()) : [];
      options(service, serviceList.map(s => ({name: s.displayLabel || s.name})), 'Select service');
      clearEstimate();
    }
    function brandChanged() {
      deviceList = entry() ? core.devices(entry().make) : [];
      options(model, deviceList, 'Select model');
      model.parentElement.hidden = !deviceList.length;
      options(submodel, [], 'Select sub-model');
      submodel.parentElement.hidden = true;
      loadServices();
    }
    function reset() {
      options(brand, entries, 'Select brand');
      if (entries.length) brand.value = '0';
      brandChanged();
    }
    function render() {
      clearEstimate();
      const selected = serviceList[service.value];
      if (!selected) return;
      result.textContent = '';
      const title = document.createElement('h3');
      const selectedDevice = device();
      const selectedSubmodel = selectedDevice && (selectedDevice.model.subModels || [])[submodel.value];
      const deviceName = [selectedDevice && selectedDevice.name, selectedSubmodel && selectedSubmodel.name].filter(Boolean).join(' ') || entry().make.name;
      title.textContent = `${deviceName} — ${selected.displayLabel || selected.name}`;
      const amount = document.createElement('p'); amount.className = 'estimate-amount';
      amount.append('Estimated Price: ');
      const strong = document.createElement('strong'); strong.textContent = core.price(selected); amount.append(strong);
      const note = document.createElement('p'); note.className = 'estimate-note';
      const notes = [];
      if (selected.verificationRequired) notes.push('Contact the shop to confirm part availability and the current repair offering.');
      else if (selected.displayType) notes.push(`Quality ${selected.displayType} replacement.`);
      if (selected.name === 'Battery Replacement' && entry().type.name === 'Phone' && entry().make.name === 'Apple') notes.push('Quality aftermarket battery. Battery health reporting and pairing features depend on the model and component.');
      if (selected.name === 'Charging Port Replacement' && entry().make.name === 'Apple') notes.push('Normal port assembly replacement. Board-level charging faults require diagnosis and a confirmed quote.');
      if (selected.name === 'Diagnostic') notes.push('Diagnostic fee applied toward the repair when you proceed.');
      else if (entry().type.name === 'Computer') notes.push('The $100 computer diagnostic fee is credited toward an approved repair.');
      notes.push('Parts and labor included in listed repair prices, before applicable tax. Final price confirmed by the shop.');
      note.textContent = notes.join(' ');
      const actions = document.createElement('div'); actions.className = 'estimate-actions';
      // Preserve the contact page’s existing service aliases and hash-driven expansion.
      const params = new URLSearchParams({ make: entry().make.name, model: deviceName, service: selected.name, device: entry().type.name, estimate: core.price(selected) });
      const schedule = document.createElement('a'); schedule.className = 'btn-primary'; schedule.textContent = 'Schedule a Repair'; schedule.href = `/contact/?${params}#schedule-repair`;
      schedule.addEventListener('click', () => track('schedule_repair_click', { location: 'pricing_estimate', service_name: selected.name }));
      const call = document.createElement('a'); call.className = 'btn-secondary'; call.href = 'tel:+16166063304'; call.textContent = 'Call (616) 606-3304';
      actions.append(schedule, call); result.append(title, amount, note, actions);
      track('estimate_viewed', { device_type: entry().type.name, device_model: deviceName, service_name: selected.name, estimate_price: core.price(selected) });
      if (typeof window.plausible === 'function') window.plausible('EstimateViewed', { props: { path: title.textContent, price: core.price(selected) } });
    }
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      controllers.forEach(c => { c.toggle.setAttribute('aria-expanded', 'false'); c.panel.hidden = true; c.reset(); });
      toggle.setAttribute('aria-expanded', String(open)); panel.hidden = !open;
    });
    brand.addEventListener('change', brandChanged);
    model.addEventListener('change', () => {
      const selected = device();
      const subs = selected && selected.model.subModels;
      const show = Boolean(subs && subs.length && !selected.source);
      options(submodel, show ? subs : [], 'Select sub-model'); submodel.parentElement.hidden = !show;
      loadServices();
    });
    submodel.addEventListener('change', loadServices);
    service.addEventListener('change', render);
    form.addEventListener('change', () => {
      if (!hasStartedEstimate) { hasStartedEstimate = true; track('estimate_start', { device_type: entry() && entry().type.name }); }
    });
    form.addEventListener('submit', event => event.preventDefault());
    controllers.push({ toggle, panel, reset }); reset();
  }
  fetch('/data/pricing-catalog.json?v=20261027-1', { cache: 'no-store' }).then(response => {
    if (!response.ok) throw new Error('Catalog unavailable');
    return response.json();
  }).then(catalog => {
    if (!Array.isArray(catalog.deviceTypes) || !catalog.deviceTypes.length) throw new Error('Invalid catalog');
    categories.forEach((category, index) => createCategory(category, catalog, index));
    status.hidden = true;
  }).catch(() => { host.textContent = ''; status.textContent = 'We could not load pricing right now. Call (616) 606-3304 or contact us for an estimate.'; });
})();
