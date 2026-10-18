(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const product = window.Nexora.getProduct(params.get("id"));
  const detailMount = document.getElementById("product-detail");

  if (!product) {
    document.title = "Product Not Found | Nexora";
    detailMount.innerHTML = `<div class="empty-state"><span class="eyebrow">Invalid product</span><h1>That component could not be found.</h1><p>The link may be old or the product ID may be incorrect.</p><a class="button button-primary" href="shop.html">Back to the shop</a></div>`;
    return;
  }

  document.title = product.name + " | Nexora";
  const specifications = Object.entries(product.specs).map(function (entry) {
    return `<tr><th scope="row">${entry[0]}</th><td>${entry[1]}</td></tr>`;
  }).join("");

  detailMount.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-image">
        <img src="${product.image}" alt="${product.imageAlt}">
        <span class="image-note">Representative category photo · see credits</span>
      </div>
      <div class="product-detail-copy">
        <span class="eyebrow">${product.brand} · ${product.category}</span>
        <h1>${product.name}</h1>
        <p>${product.description}</p>
        <div class="detail-price"><small>Demonstration price</small>${window.Nexora.formatMoney(product.price)}</div>
        <p class="notice"><strong>Availability:</strong> ${product.availability}. This is sample catalog data and does not represent live inventory.</p>
        <table class="spec-table"><caption class="sr-only">Product specifications</caption><tbody>${specifications}</tbody></table>
        <div class="purchase-row">
          <div class="field"><label for="product-quantity">Quantity</label><input class="quantity-input" id="product-quantity" type="number" min="1" max="10" value="1"></div>
          <button class="button button-primary" id="detail-add-cart" type="button">Add to cart</button>
        </div>
      </div>
    </div>`;

  document.getElementById("detail-add-cart").addEventListener("click", function () {
    const quantity = Math.min(10, Math.max(1, Number(document.getElementById("product-quantity").value) || 1));
    window.Nexora.addToCart(product.id, quantity);
  });

  const related = window.NEXORA_PRODUCTS.filter(function (item) {
    return item.category === product.category && item.id !== product.id;
  }).slice(0, 3);

  if (related.length) {
    document.getElementById("related-section").hidden = false;
    document.getElementById("related-products").innerHTML = related.map(window.Nexora.productCard).join("");
  }
})();
