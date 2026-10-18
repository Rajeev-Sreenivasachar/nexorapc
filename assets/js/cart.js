(function () {
  "use strict";

  const cartMount = document.getElementById("cart-items");
  const summaryMount = document.getElementById("cart-summary");
  const estimatedTaxRate = 0.07;

  function validCart() {
    const cart = window.Nexora.getCart().filter(function (item) {
      return window.Nexora.getProduct(item.id) && Number(item.quantity) > 0;
    });
    window.Nexora.saveCart(cart);
    return cart;
  }

  function updateQuantity(productId, change) {
    const cart = window.Nexora.getCart();
    const item = cart.find(function (entry) { return entry.id === productId; });
    if (!item) return;
    item.quantity = Math.min(10, Math.max(1, Number(item.quantity) + change));
    window.Nexora.saveCart(cart);
    renderCart();
  }

  function removeItem(productId) {
    const cart = window.Nexora.getCart().filter(function (item) { return item.id !== productId; });
    window.Nexora.saveCart(cart);
    renderCart();
  }

  function renderCart() {
    const cart = validCart();
    if (!cart.length) {
      cartMount.innerHTML = `<div class="empty-state"><h2>Your cart is empty.</h2><p>Add a component from the catalog. It will stay saved after a refresh on this device.</p><a class="button button-primary" href="shop.html">Shop components</a></div>`;
      summaryMount.innerHTML = `<h2>Estimated total</h2><div class="summary-line"><span>Subtotal</span><strong>$0.00</strong></div><div class="summary-line total"><span>Total</span><strong>$0.00</strong></div><p class="notice">Checkout is unavailable because Nexora is a student demonstration.</p>`;
      return;
    }

    cartMount.innerHTML = cart.map(function (item) {
      const product = window.Nexora.getProduct(item.id);
      return `
        <article class="cart-item">
          <div class="cart-image"><span class="image-placeholder" aria-hidden="true"><strong>${product.category.toUpperCase()}</strong></span><img data-product-image src="${product.image}" alt="${product.imageAlt}"></div>
          <div>
            <h2><a href="product.html?id=${product.id}">${product.name}</a></h2>
            <p>${window.Nexora.formatMoney(product.price)} each · dated reference</p>
            <div class="quantity-control" aria-label="Quantity for ${product.name}">
              <button type="button" data-cart-decrease="${product.id}" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-increase="${product.id}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="cart-item-total">
            <strong>${product.price === null ? "Price unavailable" : window.Nexora.formatMoney(product.price * item.quantity)}</strong>
            <button class="remove-button" type="button" data-cart-remove="${product.id}">Remove</button>
          </div>
        </article>`;
    }).join("");

    const unavailableCount = cart.filter(function (item) {
      return window.Nexora.getProduct(item.id).price === null;
    }).length;
    const subtotal = cart.reduce(function (total, item) {
      const price = window.Nexora.getProduct(item.id).price;
      return total + (price === null ? 0 : price * item.quantity);
    }, 0);
    const tax = subtotal * estimatedTaxRate;
    const total = subtotal + tax;

    summaryMount.innerHTML = `
      <h2>Estimated total</h2>
      <div class="summary-line"><span>Subtotal</span><strong>${window.Nexora.formatMoney(subtotal)}</strong></div>
      <div class="summary-line"><span>Estimated tax (7%)</span><strong>${window.Nexora.formatMoney(tax)}</strong></div>
      <div class="summary-line total"><span>Estimated total</span><strong>${window.Nexora.formatMoney(total)}</strong></div>
      ${unavailableCount ? `<p class="notice"><strong>Incomplete total:</strong> ${unavailableCount} cart ${unavailableCount === 1 ? "item has" : "items have"} no confirmed reference price and ${unavailableCount === 1 ? "is" : "are"} excluded.</p>` : ""}
      <p class="notice">Reference prices may have changed. This estimate does not create an order; checkout and payment are intentionally unavailable.</p>
      <button class="button button-secondary button-wide" id="clear-cart" type="button">Clear cart</button>`;

    document.getElementById("clear-cart").addEventListener("click", function () {
      window.Nexora.saveCart([]);
      renderCart();
      window.Nexora.showToast("Cart cleared.");
    });
  }

  cartMount.addEventListener("click", function (event) {
    const increase = event.target.closest("[data-cart-increase]");
    const decrease = event.target.closest("[data-cart-decrease]");
    const remove = event.target.closest("[data-cart-remove]");
    if (increase) updateQuantity(increase.dataset.cartIncrease, 1);
    if (decrease) updateQuantity(decrease.dataset.cartDecrease, -1);
    if (remove) removeItem(remove.dataset.cartRemove);
  });

  renderCart();
})();
