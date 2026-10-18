(function () {
  "use strict";

  const categoryMount = document.getElementById("home-categories");
  const featuredMount = document.getElementById("featured-products");
  const productCount = document.getElementById("catalog-product-count");
  if (productCount) productCount.textContent = window.NEXORA_PRODUCTS.length + " parts";

  categoryMount.innerHTML = window.NEXORA_CATEGORIES.map(function (category) {
    const count = window.NEXORA_PRODUCTS.filter(function (product) {
      return product.category === category.id;
    }).length;

    return `
      <a class="category-card" href="shop.html?category=${category.id}">
        <span class="category-code">${category.shortName}</span>
        <div><h3>${category.name}</h3><p>${count} products →</p></div>
      </a>`;
  }).join("");

  featuredMount.innerHTML = window.NEXORA_PRODUCTS.filter(function (product) {
    return product.featured;
  }).slice(0, 6).map(window.Nexora.productCard).join("");
})();
