(function () {
  "use strict";

  const searchInput = document.getElementById("shop-search");
  const categorySelect = document.getElementById("category-filter");
  const brandSelect = document.getElementById("brand-filter");
  const priceInput = document.getElementById("price-filter");
  const priceOutput = document.getElementById("price-output");
  const sortSelect = document.getElementById("sort-products");
  const productGrid = document.getElementById("shop-products");
  const resultCount = document.getElementById("results-count");
  const emptyState = document.getElementById("shop-empty");

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
    const search = params.get("search");
    if (category && window.NEXORA_CATEGORIES.some(function (item) { return item.id === category; })) categorySelect.value = category;
    if (search) searchInput.value = search;
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (categorySelect.value !== "all") params.set("category", categorySelect.value);
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    const query = params.toString();
    window.history.replaceState({}, "", query ? "shop.html?" + query : "shop.html");
  }

  function renderProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const maximumPrice = Number(priceInput.value);

    let products = window.NEXORA_PRODUCTS.filter(function (product) {
      const searchText = [product.name, product.brand, product.category, product.description].join(" ").toLowerCase();
      return (!query || searchText.includes(query)) &&
        (categorySelect.value === "all" || product.category === categorySelect.value) &&
        (brandSelect.value === "all" || product.brand === brandSelect.value) &&
        product.price <= maximumPrice;
    });

    if (sortSelect.value === "price-low") products.sort(function (a, b) { return a.price - b.price; });
    if (sortSelect.value === "price-high") products.sort(function (a, b) { return b.price - a.price; });
    if (sortSelect.value === "name") products.sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (sortSelect.value === "featured") products.sort(function (a, b) { return Number(b.featured) - Number(a.featured); });

    productGrid.innerHTML = products.map(window.Nexora.productCard).join("");
    productGrid.hidden = products.length === 0;
    emptyState.hidden = products.length !== 0;
    resultCount.textContent = products.length + (products.length === 1 ? " product" : " products") + " shown";
    priceOutput.textContent = "Up to " + window.Nexora.formatMoney(maximumPrice);
    updateUrl();
  }

  function clearFilters() {
    searchInput.value = "";
    categorySelect.value = "all";
    brandSelect.value = "all";
    priceInput.value = "650";
    sortSelect.value = "featured";
    renderProducts();
  }

  [searchInput, categorySelect, brandSelect, priceInput, sortSelect].forEach(function (control) {
    control.addEventListener(control === searchInput ? "input" : "change", renderProducts);
  });
  priceInput.addEventListener("input", renderProducts);
  document.getElementById("clear-filters").addEventListener("click", clearFilters);
  document.querySelector("[data-clear-filters]").addEventListener("click", clearFilters);

  applyUrlFilters();
  renderProducts();
})();
