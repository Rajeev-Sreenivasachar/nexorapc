(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NEXORA_CATALOG_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function tierOrder(tier) {
    return { Budget: 1, Midrange: 2, Premium: 3 }[tier] || 4;
  }

  function priceRank(product, direction) {
    return typeof product.price === "number" && Number.isFinite(product.price) ? product.price : direction === "asc" ? Infinity : -Infinity;
  }

  function filterAndSort(products, filters) {
    const options = filters || {};
    const query = String(options.query || "").trim().toLowerCase();
    const list = (Array.isArray(products) ? products : []).filter(function (product) {
      const searchable = [product.name, product.originalName, product.brand, product.category, product.tier, product.description].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) &&
        (!options.category || options.category === "all" || product.category === options.category) &&
        (!options.brand || options.brand === "all" || product.brand === options.brand) &&
        (!options.tier || options.tier === "all" || product.tier === options.tier);
    });
    return list.sort(function (a, b) {
      if (options.sort === "name-desc") return b.name.localeCompare(a.name);
      if (options.sort === "price-asc") return priceRank(a, "asc") - priceRank(b, "asc") || a.name.localeCompare(b.name);
      if (options.sort === "price-desc") return priceRank(b, "desc") - priceRank(a, "desc") || a.name.localeCompare(b.name);
      if (options.sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (options.sort === "tier") return tierOrder(a.tier) - tierOrder(b.tier) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }

  return { filterAndSort, tierOrder };
});
