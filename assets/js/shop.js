(function () {
  "use strict";

  const PAGE_SIZE = 24;
  const searchInput = document.getElementById("shop-search");
  const categorySelect = document.getElementById("category-filter");
  const brandSelect = document.getElementById("brand-filter");
  const minimumPriceInput = document.getElementById("minimum-price");
  const maximumPriceInput = document.getElementById("maximum-price");
  const includeUnpricedInput = document.getElementById("include-unpriced");
  const sortSelect = document.getElementById("sort-products");
  const productGrid = document.getElementById("shop-products");
  const resultCount = document.getElementById("results-count");
  const emptyState = document.getElementById("shop-empty");
  const loadMoreButton = document.getElementById("load-more");
  let visibleCount = PAGE_SIZE;

  window.NEXORA_CATEGORIES.forEach(function (category) {
    categorySelect.add(new Option(category.name, category.id));
  });

  Array.from(new Set(window.NEXORA_PRODUCTS.map(function (product) {
    return product.brand;
  }))).sort().forEach(function (brand) {
    brandSelect.add(new Option(brand, brand));
  });

  function applyUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const brand = params.get("brand");
    const search = params.get("search");
    if (category && window.NEXORA_CATEGORIES.some(function (item) { return item.id === category; })) categorySelect.value = category;
    if (brand && Array.from(brandSelect.options).some(function (option) { return option.value === brand; })) brandSelect.value = brand;
    if (search) searchInput.value = search;
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (categorySelect.value !== "all") params.set("category", categorySelect.value);
    if (brandSelect.value !== "all") params.set("brand", brandSelect.value);
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    const query = params.toString();
    window.history.replaceState({}, "", query ? "shop.html?" + query : "shop.html");
  }

  function numericValue(input) {
    if (!input.value.trim()) return null;
    const value = Number(input.value);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function filteredProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const minimumPrice = numericValue(minimumPriceInput);
    const maximumPrice = numericValue(maximumPriceInput);

    const products = window.NEXORA_PRODUCTS.filter(function (product) {
      const searchText = [product.name, product.brand, product.modelNumber, product.category, product.description, Object.values(product.specs).join(" ")].join(" ").toLowerCase();
      const priceMatches = product.price === null
        ? includeUnpricedInput.checked
        : (minimumPrice === null || product.price >= minimumPrice) && (maximumPrice === null || product.price <= maximumPrice);
      return (!query || searchText.includes(query)) &&
        (categorySelect.value === "all" || product.category === categorySelect.value) &&
        (brandSelect.value === "all" || product.brand === brandSelect.value) &&
        priceMatches;
    });

    if (sortSelect.value === "price-low") products.sort(function (a, b) { return (a.price ?? Infinity) - (b.price ?? Infinity); });
    if (sortSelect.value === "price-high") products.sort(function (a, b) { return (b.price ?? -Infinity) - (a.price ?? -Infinity); });
    if (sortSelect.value === "name") products.sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (sortSelect.value === "featured") products.sort(function (a, b) { return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name); });
    return products;
  }

  function renderProducts(resetVisibleCount) {
    if (resetVisibleCount) visibleCount = PAGE_SIZE;
    const products = filteredProducts();
    const visibleProducts = products.slice(0, visibleCount);
    productGrid.innerHTML = visibleProducts.map(window.Nexora.productCard).join("");
    productGrid.hidden = products.length === 0;
    emptyState.hidden = products.length !== 0;
    resultCount.textContent = products.length + (products.length === 1 ? " matching product" : " matching products") + " · showing " + visibleProducts.length;
    loadMoreButton.hidden = visibleProducts.length >= products.length;
    updateUrl();
  }

  function clearFilters() {
    searchInput.value = "";
    categorySelect.value = "all";
    brandSelect.value = "all";
    minimumPriceInput.value = "";
    maximumPriceInput.value = "";
    includeUnpricedInput.checked = true;
    sortSelect.value = "featured";
    renderProducts(true);
  }

  [searchInput, minimumPriceInput, maximumPriceInput].forEach(function (control) {
    control.addEventListener("input", function () { renderProducts(true); });
  });
  [categorySelect, brandSelect, includeUnpricedInput, sortSelect].forEach(function (control) {
    control.addEventListener("change", function () { renderProducts(true); });
  });
  document.getElementById("clear-filters").addEventListener("click", clearFilters);
  document.querySelector("[data-clear-filters]").addEventListener("click", clearFilters);
  loadMoreButton.addEventListener("click", function () {
    visibleCount += PAGE_SIZE;
    renderProducts(false);
  });

  applyUrlFilters();
  renderProducts(true);
})();
