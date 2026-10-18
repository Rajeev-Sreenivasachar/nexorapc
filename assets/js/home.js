(function () {
  "use strict";

  const categoryMount = document.getElementById("home-categories");
  const featuredMount = document.getElementById("featured-products");

  categoryMount.innerHTML = window.NEXORA_CATEGORIES.map(function (category) {
    const count = window.NEXORA_PRODUCTS.filter(function (product) {
      return product.category === category.id;
    }).length;

    return `
      <a class="category-card reveal" href="shop.html?category=${category.id}">
        <span class="category-code">${category.shortName}</span>
        <div><h3>${category.name}</h3><p>${count} demo products →</p></div>
      </a>`;
  }).join("");

  featuredMount.innerHTML = window.NEXORA_PRODUCTS.filter(function (product) {
    return product.featured;
  }).slice(0, 6).map(window.Nexora.productCard).join("");
})();
