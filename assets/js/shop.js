(function () {
  "use strict";

  const products = Array.isArray(window.NEXORA_PRODUCTS) ? window.NEXORA_PRODUCTS : [];
  const ordering = window.NEXORA_ORDERING;
  const catalogCore = window.NEXORA_CATALOG_CORE;
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
  const categoryShortcuts = document.getElementById("category-shortcuts");

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
  addOptions(tierFilter, ["Budget", "Midrange", "Premium"]);

  function categoryCount(category) {
    return products.filter(function (product) { return product.category === category; }).length;
  }

  function renderCategoryShortcuts() {
    if (!categoryShortcuts) return;
    const fragment = document.createDocumentFragment();
    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.dataset.category = "all";
    allButton.innerHTML = "<span>All parts</span><strong>" + products.length + "</strong>";
    fragment.appendChild(allButton);
    uniqueValues("category").forEach(function (category) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.category = category;
      const label = document.createElement("span");
      label.textContent = category;
      const total = document.createElement("strong");
      total.textContent = categoryCount(category);
      button.append(label, total);
      fragment.appendChild(button);
    });
    categoryShortcuts.replaceChildren(fragment);
  }

  renderCategoryShortcuts();

  function filteredProducts() {
    return catalogCore.filterAndSort(products, { query: search.value, category: categoryFilter.value, brand: brandFilter.value, tier: tierFilter.value, sort: sort.value });
  }

  function productInitials(category) {
    return category.split(" ").map(function (word) { return word[0]; }).join("").slice(0, 3);
  }

  function createCard(product) {
    const article = document.createElement("article");
    article.className = "product-card";
    article.tabIndex = 0;
    article.dataset.productId = product.id;
    article.setAttribute("aria-label", "View details for " + product.name);

    const remaining = ordering ? ordering.remainingInventory(product) : Number(product.inventory || 0);
    if (remaining === 0) article.classList.add("unavailable");

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
    const stock = document.createElement("span");
    stock.className = "stock-badge " + (remaining > 0 ? "available" : "unavailable");
    stock.textContent = remaining > 0 ? remaining + " available" : "Unavailable";
    media.append(placeholder, image, stock);

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
    price.className = "product-price";
    price.textContent = typeof product.price === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency || "USD" }).format(product.price) : "Check retailer";
    const note = document.createElement("p");
    note.className = "product-status";
    note.textContent = product.priceStatus === "verified_reference"
      ? product.priceSource + " · checked " + product.lastPriceChecked
      : "Price unavailable · click for retailer and product details";
    const button = document.createElement("button");
    button.className = "product-order-button";
    button.type = "button";
    const cartQuantity = ordering ? ordering.cartQuantity(product.id) : 0;
    button.disabled = remaining <= cartQuantity;
    button.textContent = remaining === 0 ? "Unavailable" : remaining <= cartQuantity ? "Inventory limit reached" : "Add to cart";
    button.setAttribute("aria-label", button.textContent + ": " + product.name);
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      if (ordering && ordering.addToCart(product.id)) renderProducts();
    });

    copy.append(meta, name, brand, description, price, note);
    copy.appendChild(button);
    article.append(media, copy);
    article.addEventListener("click", function (event) {
      if (event.target.closest("button, a, input, select, textarea")) return;
      if (ordering) ordering.openProduct(product.id);
    });
    article.addEventListener("keydown", function (event) {
      if (event.target !== article || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      if (ordering) ordering.openProduct(product.id);
    });
    return article;
  }

  function renderProducts() {
    grid.setAttribute("aria-busy", "true");
    const matches = filteredProducts();
    const shown = matches.slice(0, visibleCount);
    const fragment = document.createDocumentFragment();
    shown.forEach(function (product) { fragment.appendChild(createCard(product)); });
    grid.replaceChildren(fragment);
    grid.removeAttribute("aria-busy");
    count.textContent = matches.length;
    empty.hidden = matches.length > 0;
    loadMore.hidden = shown.length >= matches.length || matches.length === 0;
    loadMore.textContent = "Load more products (" + shown.length + " of " + matches.length + ")";
    if (categoryShortcuts) {
      categoryShortcuts.querySelectorAll("button").forEach(function (button) {
        const active = button.dataset.category === categoryFilter.value;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
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

  if (categoryShortcuts) {
    categoryShortcuts.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      categoryFilter.value = button.dataset.category;
      filtersChanged();
      document.getElementById("catalog-title").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  loadMore.addEventListener("click", function () {
    visibleCount += pageSize;
    renderProducts();
  });

  window.addEventListener("nexora:cart-changed", renderProducts);
  window.addEventListener("nexora:inventory-changed", renderProducts);

  renderProducts();
})();
