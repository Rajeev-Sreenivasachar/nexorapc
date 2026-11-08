(function () {
  "use strict";

  const products = Array.isArray(window.NEXORA_PRODUCTS) ? window.NEXORA_PRODUCTS : [];
  const pageSize = 24;
  let visibleCount = pageSize;

  const grid = document.getElementById("product-grid");
  const count = document.getElementById("product-count");
  const empty = document.getElementById("empty-products");
  const loadMore = document.getElementById("load-more-products");
  const search = document.getElementById("product-search");
  const categoryFilter = document.getElementById("category-filter");
  const brandFilter = document.getElementById("brand-filter");
  const tierFilter = document.getElementById("tier-filter");
  const sort = document.getElementById("sort-products");
  const clear = document.getElementById("clear-filters");

  if (!grid) return;

  function uniqueValues(key) {
    return Array.from(new Set(products.map(function (product) { return product[key]; }))).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function addOptions(select, values) {
    values.forEach(function (value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  addOptions(categoryFilter, uniqueValues("category"));
  addOptions(brandFilter, uniqueValues("brand"));
  addOptions(tierFilter, ["Budget", "Midrange", "High-end"]);

  function tierOrder(tier) {
    return { Budget: 1, Midrange: 2, "High-end": 3 }[tier] || 4;
  }

  function filteredProducts() {
    const query = search.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const brand = brandFilter.value;
    const tier = tierFilter.value;

    const matches = products.filter(function (product) {
      const matchesQuery = !query || (product.name + " " + product.brand + " " + product.category).toLowerCase().includes(query);
      return matchesQuery &&
        (category === "all" || product.category === category) &&
        (brand === "all" || product.brand === brand) &&
        (tier === "all" || product.tier === tier);
    });

    return matches.sort(function (a, b) {
      if (sort.value === "name-desc") return b.name.localeCompare(a.name);
      if (sort.value === "price-asc") return (a.referencePrice === null ? Infinity : a.referencePrice) - (b.referencePrice === null ? Infinity : b.referencePrice) || a.name.localeCompare(b.name);
      if (sort.value === "price-desc") return (b.referencePrice === null ? -Infinity : b.referencePrice) - (a.referencePrice === null ? -Infinity : a.referencePrice) || a.name.localeCompare(b.name);
      if (sort.value === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (sort.value === "tier") return tierOrder(a.tier) - tierOrder(b.tier) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }

  function productInitials(category) {
    return category.split(" ").map(function (word) { return word[0]; }).join("").slice(0, 3);
  }

  function createCard(product) {
    const article = document.createElement("article");
    article.className = "product-card";

    const media = document.createElement("div");
    media.className = "product-media";
    const placeholder = document.createElement("span");
    placeholder.className = "product-placeholder";
    placeholder.textContent = productInitials(product.category);
    placeholder.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.hidden = true;
    image.addEventListener("load", function () {
      image.hidden = false;
      placeholder.hidden = true;
    });
    image.addEventListener("error", function () { image.remove(); });
    media.append(placeholder, image);

    const copy = document.createElement("div");
    copy.className = "product-card-copy";
    const meta = document.createElement("div");
    meta.className = "product-meta";
    const category = document.createElement("span");
    category.textContent = product.category;
    const tier = document.createElement("span");
    tier.textContent = product.tier;
    meta.append(category, tier);

    const name = document.createElement("h3");
    name.textContent = product.name;
    const brand = document.createElement("p");
    brand.className = "product-brand";
    brand.textContent = product.brand;
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;

    const price = document.createElement("strong");
    price.className = "product-price" + (product.referencePrice === null ? " unavailable" : "");
    price.textContent = product.referencePrice === null ? "Price unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.referencePrice);
    const note = document.createElement("p");
    note.className = "product-status";
    note.textContent = product.referencePrice === null ? "Exact SKU, price, and local stock require verification." : "Observed at " + product.referencePriceSource + " on Nov. 7, 2026 — reference only.";
    const source = product.referencePriceUrl ? document.createElement("a") : null;
    if (source) {
      source.className = "product-source-link";
      source.href = product.referencePriceUrl;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = "View supplied retailer listing ↗";
    }
    const button = document.createElement("button");
    button.className = "product-order-button";
    button.type = "button";
    button.disabled = true;
    button.textContent = "Local ordering unavailable";
    button.setAttribute("aria-label", product.name + " is not available to order until its listing is verified");

    copy.append(meta, name, brand, description, price, note);
    if (source) copy.appendChild(source);
    copy.appendChild(button);
    article.append(media, copy);
    return article;
  }

  function renderProducts() {
    const matches = filteredProducts();
    const shown = matches.slice(0, visibleCount);
    const fragment = document.createDocumentFragment();
    shown.forEach(function (product) { fragment.appendChild(createCard(product)); });
    grid.replaceChildren(fragment);
    count.textContent = matches.length;
    empty.hidden = matches.length > 0;
    loadMore.hidden = shown.length >= matches.length || matches.length === 0;
    loadMore.textContent = "Load more products (" + shown.length + " of " + matches.length + ")";
  }

  function filtersChanged() {
    visibleCount = pageSize;
    renderProducts();
  }

  [search, categoryFilter, brandFilter, tierFilter, sort].forEach(function (control) {
    control.addEventListener(control === search ? "input" : "change", filtersChanged);
  });

  clear.addEventListener("click", function () {
    search.value = "";
    categoryFilter.value = "all";
    brandFilter.value = "all";
    tierFilter.value = "all";
    sort.value = "name-asc";
    filtersChanged();
    search.focus();
  });

  loadMore.addEventListener("click", function () {
    visibleCount += pageSize;
    renderProducts();
  });

  renderProducts();
})();
