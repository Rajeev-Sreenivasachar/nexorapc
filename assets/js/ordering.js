(function () {
  "use strict";

  const products = Array.isArray(window.NEXORA_PRODUCTS) ? window.NEXORA_PRODUCTS : [];
  if (!products.length) return;

  const CART_KEY = "nexora_cart_v1";
  const ORDERS_KEY = "nexora_orders_v1";
  const BUDGET_KEY = "nexora_budget_v1";
  const TAX_RATE = 0.075;
  const requiredBuildCategories = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "CPU Cooler"];
  let cart = readArray(CART_KEY);
  let orders = readArray(ORDERS_KEY);
  let budget = readNumber(BUDGET_KEY);
  let previousFocus = null;

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function readNumber(key) {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function saveState() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    if (budget === null) localStorage.removeItem(BUDGET_KEY);
    else localStorage.setItem(BUDGET_KEY, String(budget));
  }

  function productById(productId) {
    return products.find(function (product) { return product.id === productId; });
  }

  function money(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function committedQuantity(productId) {
    return orders.reduce(function (total, order) {
      if (order.status !== "Received") return total;
      const item = order.items.find(function (entry) { return entry.productId === productId; });
      return total + (item ? item.quantity : 0);
    }, 0);
  }

  function remainingInventory(productOrId) {
    const product = typeof productOrId === "string" ? productById(productOrId) : productOrId;
    if (!product) return 0;
    return Math.max(0, Number(product.inventory || 0) - committedQuantity(product.id));
  }

  function cartQuantity(productId) {
    const item = cart.find(function (entry) { return entry.productId === productId; });
    return item ? item.quantity : 0;
  }

  function cartSummary() {
    const items = cart.map(function (entry) {
      const product = productById(entry.productId);
      if (!product) return null;
      return {
        product,
        quantity: entry.quantity,
        lineTotal: product.price * entry.quantity
      };
    }).filter(Boolean);
    const subtotal = items.reduce(function (total, item) { return total + item.lineTotal; }, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    return { items, subtotal, tax, total: subtotal + tax };
  }

  function orderId() {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
    return "NXO-" + date + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  const app = document.createElement("div");
  app.id = "ordering-app";
  app.innerHTML = `
    <div class="app-backdrop" id="product-backdrop" hidden>
      <section class="product-dialog app-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <button class="dialog-close" type="button" data-close-dialog aria-label="Close product details">×</button>
        <div id="product-dialog-content"></div>
      </section>
    </div>
    <div class="app-backdrop drawer-backdrop" id="cart-backdrop" hidden>
      <aside class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header class="drawer-header">
          <div><span class="eyebrow">Digital order</span><h2 id="cart-title">Your cart</h2></div>
          <button class="dialog-close" type="button" data-close-dialog aria-label="Close cart">×</button>
        </header>
        <div class="drawer-scroll">
          <div id="cart-content"></div>
          <form class="checkout-form" id="checkout-form" novalidate>
            <div class="checkout-heading"><span class="eyebrow">Customer details</span><h3>Place your order</h3></div>
            <label>Full name<input id="customer-name" name="customerName" type="text" minlength="2" maxlength="60" autocomplete="name" required></label>
            <label>Email<input id="customer-email" name="customerEmail" type="email" maxlength="100" autocomplete="email" required></label>
            <label>Fulfillment<select id="fulfillment-method" name="fulfillment"><option value="Store pickup">Store pickup</option><option value="Local delivery">Local delivery</option></select></label>
            <label>Order notes<textarea id="order-notes" name="notes" maxlength="240" rows="3" placeholder="Optional build or pickup notes"></textarea></label>
            <p class="form-error" id="checkout-error" role="alert" hidden></p>
            <button class="button button-primary checkout-button" id="place-order" type="submit">Place demo order</button>
            <p class="checkout-disclaimer">This creates a saved prototype order in this browser. No payment is collected and nothing is shipped.</p>
          </form>
        </div>
      </aside>
    </div>
    <div class="app-backdrop" id="orders-backdrop" hidden>
      <section class="orders-dialog app-dialog" role="dialog" aria-modal="true" aria-labelledby="orders-title">
        <header class="drawer-header">
          <div><span class="eyebrow">Saved locally</span><h2 id="orders-title">Order center</h2></div>
          <button class="dialog-close" type="button" data-close-dialog aria-label="Close order center">×</button>
        </header>
        <div class="orders-list" id="orders-list"></div>
      </section>
    </div>
    <div class="app-toast" id="app-toast" role="status" aria-live="polite" hidden></div>`;
  document.body.appendChild(app);

  const productBackdrop = document.getElementById("product-backdrop");
  const productDialogContent = document.getElementById("product-dialog-content");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const cartContent = document.getElementById("cart-content");
  const ordersBackdrop = document.getElementById("orders-backdrop");
  const ordersList = document.getElementById("orders-list");
  const checkoutForm = document.getElementById("checkout-form");
  const checkoutError = document.getElementById("checkout-error");
  const cartCount = document.getElementById("cart-count");
  const toast = document.getElementById("app-toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  function activeBackdrop() {
    return [productBackdrop, cartBackdrop, ordersBackdrop].find(function (backdrop) { return !backdrop.hidden; });
  }

  function openDialog(backdrop) {
    previousFocus = document.activeElement;
    [productBackdrop, cartBackdrop, ordersBackdrop].forEach(function (item) { item.hidden = item !== backdrop; });
    document.body.classList.add("app-dialog-open");
    const focusTarget = backdrop.querySelector("button, input, select, textarea, [tabindex]");
    if (focusTarget) focusTarget.focus();
  }

  function closeDialogs() {
    [productBackdrop, cartBackdrop, ordersBackdrop].forEach(function (backdrop) { backdrop.hidden = true; });
    document.body.classList.remove("app-dialog-open");
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
  }

  function updateCartCount() {
    const quantity = cart.reduce(function (total, item) { return total + item.quantity; }, 0);
    if (cartCount) cartCount.textContent = quantity;
    document.querySelectorAll("[data-cart-count]").forEach(function (element) { element.textContent = quantity; });
  }

  function openProduct(productId) {
    const product = productById(productId);
    if (!product) return;
    const remaining = remainingInventory(product);
    const checks = product.compatibilityChecks.map(function (check) { return `<li>${escapeHtml(check)}</li>`; }).join("");
    productDialogContent.innerHTML = `
      <div class="product-dialog-layout">
        <div class="product-dialog-media"><span class="product-dialog-placeholder" hidden>${escapeHtml(product.category)}</span><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div>
        <div class="product-dialog-copy">
          <div class="product-meta"><span>${escapeHtml(product.category)}</span><span>${escapeHtml(product.tier)}</span></div>
          <h2 id="product-dialog-title">${escapeHtml(product.name)}</h2>
          <p class="product-dialog-model">${escapeHtml(product.brand)} · ${escapeHtml(product.id)}</p>
          <p>${escapeHtml(product.role)}</p>
          <div class="detail-price-row"><strong>${money(product.price)}</strong><span>Demo estimate</span></div>
          <div class="inventory-status ${remaining > 0 ? "available" : "unavailable"}">${remaining > 0 ? remaining + " available in demo inventory" : "Currently unavailable"}</div>
          <div class="detail-panel"><h3>Check before ordering</h3><ul>${checks}</ul></div>
          <div class="detail-panel"><h3>Catalog details</h3><dl><div><dt>Brand</dt><dd>${escapeHtml(product.brand)}</dd></div><div><dt>Category</dt><dd>${escapeHtml(product.category)}</dd></div><div><dt>Performance tier</dt><dd>${escapeHtml(product.tier)}</dd></div><div><dt>Model ID</dt><dd>${escapeHtml(product.id)}</dd></div></dl></div>
          <button class="button button-primary detail-add-button" type="button" data-add-product="${escapeHtml(product.id)}" ${remaining <= cartQuantity(product.id) ? "disabled" : ""}>${remaining === 0 ? "Unavailable" : "Add to cart"}</button>
          <p class="product-status">Prototype price and inventory only. Verify compatibility and current retail information before a real purchase.</p>
        </div>
      </div>`;
    const detailImage = productDialogContent.querySelector(".product-dialog-media img");
    const detailPlaceholder = productDialogContent.querySelector(".product-dialog-placeholder");
    function showDetailPlaceholder() {
      detailImage.hidden = true;
      detailPlaceholder.hidden = false;
    }
    detailImage.addEventListener("error", showDetailPlaceholder);
    if (detailImage.complete && detailImage.naturalWidth === 0) showDetailPlaceholder();
    openDialog(productBackdrop);
  }

  function addToCart(productId) {
    const product = productById(productId);
    if (!product) return false;
    const remaining = remainingInventory(product);
    const existing = cart.find(function (item) { return item.productId === productId; });
    const currentQuantity = existing ? existing.quantity : 0;
    if (remaining <= currentQuantity) {
      showToast(remaining === 0 ? "That item is unavailable." : "You reached the demo inventory limit.");
      return false;
    }
    if (existing) existing.quantity += 1;
    else cart.push({ productId, quantity: 1 });
    saveState();
    updateCartCount();
    renderCart();
    window.dispatchEvent(new CustomEvent("nexora:cart-changed"));
    showToast(product.name + " added to cart.");
    return true;
  }

  function changeQuantity(productId, change) {
    const item = cart.find(function (entry) { return entry.productId === productId; });
    const product = productById(productId);
    if (!item || !product) return;
    const nextQuantity = item.quantity + change;
    if (nextQuantity <= 0) cart = cart.filter(function (entry) { return entry.productId !== productId; });
    else if (nextQuantity <= remainingInventory(product)) item.quantity = nextQuantity;
    else showToast("Only " + remainingInventory(product) + " remain in demo inventory.");
    saveState();
    updateCartCount();
    renderCart();
    window.dispatchEvent(new CustomEvent("nexora:cart-changed"));
  }

  function removeFromCart(productId) {
    cart = cart.filter(function (entry) { return entry.productId !== productId; });
    saveState();
    updateCartCount();
    renderCart();
    window.dispatchEvent(new CustomEvent("nexora:cart-changed"));
  }

  function buildChecklist(items) {
    return requiredBuildCategories.map(function (category) {
      const selected = items.find(function (item) { return item.product.category === category; });
      return `<li class="${selected ? "complete" : "missing"}"><span aria-hidden="true">${selected ? "✓" : "○"}</span><div><strong>${escapeHtml(category)}</strong><small>${selected ? escapeHtml(selected.product.name) : "Not selected"}</small></div></li>`;
    }).join("");
  }

  function renderCart() {
    const summary = cartSummary();
    const itemRows = summary.items.map(function (item) {
      const remaining = remainingInventory(item.product);
      return `<article class="cart-item">
        <img src="${escapeHtml(item.product.image)}" alt="">
        <div class="cart-item-copy"><strong>${escapeHtml(item.product.name)}</strong><span>${money(item.product.price)} each</span><button type="button" data-remove-product="${escapeHtml(item.product.id)}">Remove</button></div>
        <div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.product.name)}"><button type="button" data-quantity-minus="${escapeHtml(item.product.id)}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity-plus="${escapeHtml(item.product.id)}" aria-label="Increase quantity" ${item.quantity >= remaining ? "disabled" : ""}>+</button></div>
      </article>`;
    }).join("");
    const completedCategories = requiredBuildCategories.filter(function (category) { return summary.items.some(function (item) { return item.product.category === category; }); }).length;
    const overBudget = budget !== null && summary.total > budget;
    cartContent.innerHTML = `
      ${summary.items.length ? `<div class="cart-items">${itemRows}</div>` : `<div class="empty-cart"><strong>Your cart is empty.</strong><p>Choose a product card to view details, then add it to your order.</p></div>`}
      <section class="build-checklist"><div class="section-mini-heading"><div><span class="eyebrow">Full PC checklist</span><h3>${completedCategories} of ${requiredBuildCategories.length} core parts</h3></div><strong>${Math.round(completedCategories / requiredBuildCategories.length * 100)}%</strong></div><ul>${buildChecklist(summary.items)}</ul></section>
      <section class="budget-panel"><label for="budget-input">Customer budget</label><div class="budget-input"><span>$</span><input id="budget-input" type="number" min="1" step="1" inputmode="decimal" placeholder="Optional" value="${budget === null ? "" : budget}"></div><p class="budget-message ${overBudget ? "over" : ""}">${budget === null ? "Add a budget to check whether this order stays within it." : overBudget ? "Over budget by " + money(summary.total - budget) + "." : "Within budget by " + money(budget - summary.total) + "."}</p></section>
      <section class="order-summary"><div><span>Subtotal</span><strong>${money(summary.subtotal)}</strong></div><div><span>Demo tax (${(TAX_RATE * 100).toFixed(1)}%)</span><strong>${money(summary.tax)}</strong></div><div class="order-total"><span>Total</span><strong>${money(summary.total)}</strong></div></section>`;
    const placeOrder = document.getElementById("place-order");
    if (placeOrder) placeOrder.disabled = !summary.items.length || overBudget;
  }

  function orderReceipt(order) {
    const lines = [
      "NEXORA DEMO ORDER RECEIPT",
      "Order: " + order.id,
      "Created: " + new Date(order.createdAt).toLocaleString(),
      "Status: " + order.status,
      "Customer: " + order.customer.name + " <" + order.customer.email + ">",
      "Fulfillment: " + order.fulfillment,
      "",
      ...order.items.map(function (item) { return item.quantity + " × " + item.name + " — " + money(item.unitPrice * item.quantity); }),
      "",
      "Subtotal: " + money(order.subtotal),
      "Demo tax: " + money(order.tax),
      "Total: " + money(order.total),
      order.budget ? "Customer budget: " + money(order.budget) : "Customer budget: Not provided",
      order.notes ? "Notes: " + order.notes : "",
      "",
      "Prototype order only. No payment was collected and nothing will be shipped."
    ];
    return lines.join("\n");
  }

  function downloadReceipt(order) {
    const blob = new Blob([orderReceipt(order)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = order.id.toLowerCase() + "-receipt.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderOrders() {
    if (!orders.length) {
      ordersList.innerHTML = `<div class="empty-orders"><strong>No saved orders yet.</strong><p>Completed demo orders will appear here for review and cancellation.</p></div>`;
      return;
    }
    ordersList.innerHTML = orders.map(function (order) {
      const itemRows = order.items.map(function (item) { return `<li><span>${item.quantity} × ${escapeHtml(item.name)}</span><strong>${money(item.unitPrice * item.quantity)}</strong></li>`; }).join("");
      return `<article class="saved-order">
        <header><div><span class="order-id">${escapeHtml(order.id)}</span><h3>${escapeHtml(order.customer.name)}</h3><p>${new Date(order.createdAt).toLocaleString()} · ${escapeHtml(order.fulfillment)}</p></div><span class="order-status ${order.status.toLowerCase()}">${escapeHtml(order.status)}</span></header>
        <details><summary>Review ${order.items.reduce(function (total, item) { return total + item.quantity; }, 0)} items</summary><ul>${itemRows}</ul><div class="saved-order-total"><span>Order total</span><strong>${money(order.total)}</strong></div>${order.notes ? `<p class="order-notes">${escapeHtml(order.notes)}</p>` : ""}</details>
        <footer><button type="button" data-download-order="${escapeHtml(order.id)}">Download receipt</button>${order.status === "Received" ? `<button class="cancel-order" type="button" data-cancel-order="${escapeHtml(order.id)}">Cancel order</button>` : ""}</footer>
      </article>`;
    }).join("");
  }

  function placeOrder(event) {
    event.preventDefault();
    checkoutError.hidden = true;
    const summary = cartSummary();
    if (!summary.items.length) return;
    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      checkoutError.textContent = "Enter a valid name, email, and fulfillment method.";
      checkoutError.hidden = false;
      return;
    }
    const name = document.getElementById("customer-name").value.trim();
    const email = document.getElementById("customer-email").value.trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      checkoutError.textContent = "Enter a valid full name and email address.";
      checkoutError.hidden = false;
      return;
    }
    const unavailableItem = summary.items.find(function (item) { return item.quantity > remainingInventory(item.product); });
    if (unavailableItem) {
      checkoutError.textContent = unavailableItem.product.name + " no longer has enough demo inventory.";
      checkoutError.hidden = false;
      renderCart();
      return;
    }
    if (budget !== null && summary.total > budget) {
      checkoutError.textContent = "This order is over the customer budget by " + money(summary.total - budget) + ".";
      checkoutError.hidden = false;
      return;
    }
    const order = {
      id: orderId(),
      createdAt: new Date().toISOString(),
      status: "Received",
      customer: { name, email },
      fulfillment: document.getElementById("fulfillment-method").value,
      notes: document.getElementById("order-notes").value.trim(),
      budget,
      items: summary.items.map(function (item) { return { productId: item.product.id, name: item.product.name, category: item.product.category, quantity: item.quantity, unitPrice: item.product.price }; }),
      subtotal: summary.subtotal,
      tax: summary.tax,
      total: summary.total
    };
    orders.unshift(order);
    cart = [];
    saveState();
    checkoutForm.reset();
    updateCartCount();
    renderCart();
    renderOrders();
    window.dispatchEvent(new CustomEvent("nexora:inventory-changed"));
    openDialog(ordersBackdrop);
    showToast("Order " + order.id + " saved.");
  }

  function cancelOrder(orderIdValue) {
    const order = orders.find(function (entry) { return entry.id === orderIdValue; });
    if (!order || order.status !== "Received") return;
    order.status = "Cancelled";
    order.cancelledAt = new Date().toISOString();
    saveState();
    renderOrders();
    renderCart();
    window.dispatchEvent(new CustomEvent("nexora:inventory-changed"));
    showToast("Order " + order.id + " cancelled and inventory restored.");
  }

  app.addEventListener("click", function (event) {
    if (event.target.matches("[data-close-dialog]") || event.target.classList.contains("app-backdrop")) closeDialogs();
    const addButton = event.target.closest("[data-add-product]");
    if (addButton && addToCart(addButton.dataset.addProduct)) {
      openProduct(addButton.dataset.addProduct);
      const refreshedButton = productDialogContent.querySelector("[data-add-product]");
      if (refreshedButton) refreshedButton.focus();
    }
    const minusButton = event.target.closest("[data-quantity-minus]");
    if (minusButton) changeQuantity(minusButton.dataset.quantityMinus, -1);
    const plusButton = event.target.closest("[data-quantity-plus]");
    if (plusButton) changeQuantity(plusButton.dataset.quantityPlus, 1);
    const removeButton = event.target.closest("[data-remove-product]");
    if (removeButton) removeFromCart(removeButton.dataset.removeProduct);
    const cancelButton = event.target.closest("[data-cancel-order]");
    if (cancelButton) cancelOrder(cancelButton.dataset.cancelOrder);
    const downloadButton = event.target.closest("[data-download-order]");
    if (downloadButton) {
      const order = orders.find(function (entry) { return entry.id === downloadButton.dataset.downloadOrder; });
      if (order) downloadReceipt(order);
    }
  });

  cartContent.addEventListener("change", function (event) {
    if (event.target.id !== "budget-input") return;
    const value = Number(event.target.value);
    budget = Number.isFinite(value) && value > 0 ? value : null;
    saveState();
    renderCart();
  });

  checkoutForm.addEventListener("submit", placeOrder);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && activeBackdrop()) closeDialogs();
    if (event.key !== "Tab") return;
    const backdrop = activeBackdrop();
    if (!backdrop) return;
    const focusable = Array.from(backdrop.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const openCartButton = document.getElementById("open-cart");
  const openOrdersButton = document.getElementById("open-orders");
  if (openCartButton) openCartButton.addEventListener("click", function () { renderCart(); openDialog(cartBackdrop); });
  if (openOrdersButton) openOrdersButton.addEventListener("click", function () { renderOrders(); openDialog(ordersBackdrop); });

  cart = cart.filter(function (item) {
    const product = productById(item.productId);
    return product && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= remainingInventory(product);
  });
  saveState();
  updateCartCount();
  renderCart();
  renderOrders();

  window.NEXORA_ORDERING = {
    addToCart,
    cartQuantity,
    openCart: function () { renderCart(); openDialog(cartBackdrop); },
    openProduct,
    remainingInventory
  };
})();
