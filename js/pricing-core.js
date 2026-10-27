/* Catalog helpers shared by the page and browser checks. Internal names stay intact. */
(function (root) {
  'use strict';
  function services(type, make, model, source) {
    if (!source) return [];
    const actual = source.services || [];
    const defaults = [model, make, type].flatMap(node => node && node.defaultServices || []);
    // Include actual services even when legacy serviceOptions omitted them (e.g. Switch).
    const names = [...new Set([...(source.serviceOptions || model && model.serviceOptions || type.serviceOptions || []), ...actual.map(s => s.name)])];
    return names.map(name => actual.find(s => s.name === name) || defaults.find(s => s.name === name))
      .filter(Boolean);
  }
  function devices(make) {
    return (make.models || []).flatMap(model => {
      // A single product family is navigation overhead, not a separate device variant.
      if (make.models.length === 1 && model.subModels && model.subModels.length) {
        return model.subModels.map(sub => ({ name: `${model.name} ${sub.name}`.replace('Switch Switch', 'Switch'), model, source: sub }));
      }
      return [{ name: model.name, model, source: model.subModels && model.subModels.length ? null : model }];
    }).sort((a, b) => {
      const rank = name => {
        const n = name.replace(/^iPhone /, '');
        const generation = n === 'Air' ? 16.9 : n.startsWith('SE') ? 10.5 : n.startsWith('Xs') ? 10.2 : n === 'XR' ? 10.1 : n === 'X' ? 10 : parseInt(n, 10);
        return generation * 10 + (n.includes('Pro Max') ? 4 : n.includes('Pro') ? 3 : n.includes('Plus') ? 2 : n.includes('Mini') ? -1 : 0);
      };
      return a.name.startsWith('iPhone ') && b.name.startsWith('iPhone ')
        ? rank(b.name) - rank(a.name)
        : b.name.localeCompare(a.name, 'en', { numeric: true, sensitivity: 'base' });
    });
  }
  function price(service) {
    if (!service || service.verificationRequired) return 'Contact for current pricing';
    if (service.priceLabel) return /^call for pricing$/i.test(service.priceLabel) ? 'Contact for current pricing' : service.priceLabel;
    return typeof service.price === 'number' && Number.isFinite(service.price) && service.price > 0
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(service.price)
      : 'Contact for current pricing';
  }
  root.RepairPricing = { services, devices, price };
})(window);
