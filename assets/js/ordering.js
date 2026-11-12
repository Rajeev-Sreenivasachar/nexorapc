(function () {
  "use strict";

  const products = Array.isArray(window.NEXORA_PRODUCTS) ? window.NEXORA_PRODUCTS : [];
  if (!products.length) return;
  const compatibility = window.NEXORA_COMPATIBILITY;
  const orderCore = window.NEXORA_ORDER_CORE;
  if (!orderCore) return;
  if (compatibility) products.forEach(function (product) { product.technicalSpecs = compatibility.specsFor(product); });

  const CART_KEY = "nexora_cart_v1";
  const ORDERS_KEY = "nexora_orders_v1";
  const BUDGET_KEY = "nexora_budget_v1";
  const TAX_RATE = 0.075;
  const SALE_DISCOUNT_RATE = 0.15;
  const requiredBuildCategories = compatibility ? compatibility.REQUIRED_CATEGORIES : ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "CPU Cooler"];
  let cart = readArray(CART_KEY);
  let orders = readArray(ORDERS_KEY);
  let budget = readNumber(BUDGET_KEY);
  let previousFocus = null;
  let checkoutSubmitting = false;
  let lastSubmission = { fingerprint: "", time: 0 };

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
    if (!orderCore.hasPrice(value)) return "Price unavailable";
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
    return orderCore.committedQuantity(orders, productId);
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
        lineTotal: orderCore.hasPrice(product.price) ? product.price * entry.quantity : null
      };
    }).filter(Boolean);
    return orderCore.calculateTotals(items, TAX_RATE, SALE_DISCOUNT_RATE);
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
    <div class="app-backdrop" id="admin-backdrop" hidden>
      <section class="admin-dialog app-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-title">
        <header class="drawer-header">
          <div><span class="eyebrow">Browser-only prototype</span><h2 id="admin-title">Demo order dashboard</h2></div>
          <button class="dialog-close" type="button" data-close-dialog aria-label="Close demo admin dashboard">×</button>
        </header>
        <div class="admin-content">
          <p class="admin-disclosure">This is a local demo for judging. It has no login, payment system, or shared business database.</p>
          <div class="admin-stats" id="admin-stats"></div>
          <div class="admin-filters"><label>Search orders<input id="admin-search" type="search" placeholder="Order ID, name, or email"></label><label>Status<select id="admin-status"><option value="all">All statuses</option></select></label></div>
          <div class="orders-list" id="admin-orders-list"></div>
        </div>
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
  const adminBackdrop = document.getElementById("admin-backdrop");
  const adminStats = document.getElementById("admin-stats");
  const adminOrdersList = document.getElementById("admin-orders-list");
  const adminSearch = document.getElementById("admin-search");
  const adminStatus = document.getElementById("admin-status");
  const checkoutForm = document.getElementById("checkout-form");
  const checkoutError = document.getElementById("checkout-error");
  const cartCount = document.getElementById("cart-count");
  const toast = document.getElementById("app-toast");
  let toastTimer;
  orderCore.ORDER_STATUSES.forEach(function (status) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    adminStatus.appendChild(option);
  });

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  function activeBackdrop() {
    return [productBackdrop, cartBackdrop, ordersBackdrop, adminBackdrop].find(function (backdrop) { return !backdrop.hidden; });
  }

  function openDialog(backdrop) {
    previousFocus = document.activeElement;
    [productBackdrop, cartBackdrop, ordersBackdrop, adminBackdrop].forEach(function (item) { item.hidden = item !== backdrop; });
    document.body.classList.add("app-dialog-open");
    const focusTarget = backdrop.querySelector("button, input, select, textarea, [tabindex]");
    if (focusTarget) focusTarget.focus();
  }

  function closeDialogs() {
    [productBackdrop, cartBackdrop, ordersBackdrop, adminBackdrop].forEach(function (backdrop) { backdrop.hidden = true; });
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
    const technicalSpecs = compatibility ? compatibility.specsFor(product) : {};
    const specLabels = {
      cpuSocket: "CPU socket", cpuPowerWatts: "CPU power", gpuLengthMm: "GPU length",
      gpuPowerWatts: "GPU board power", recommendedPsuWatts: "Recommended PSU", ramType: "Memory type",
      formFactor: "Form factor", psuWatts: "PSU wattage", maxGpuLengthMm: "Maximum GPU length",
      maxCoolerHeightMm: "Maximum cooler height", coolerHeightMm: "Cooler height"
    };
    const unitKeys = { cpuPowerWatts: " W", gpuLengthMm: " mm", gpuPowerWatts: " W", recommendedPsuWatts: " W", psuWatts: " W", maxGpuLengthMm: " mm", maxCoolerHeightMm: " mm", coolerHeightMm: " mm" };
    const specRows = Object.keys(specLabels).filter(function (key) { return technicalSpecs[key] !== undefined; }).map(function (key) {
      return `<div><dt>${escapeHtml(specLabels[key])}</dt><dd>${escapeHtml(technicalSpecs[key])}${unitKeys[key] || ""}</dd></div>`;
    }).join("");
    const arrayRows = [["supportedMotherboardFormFactors", "Supported boards"], ["coolerSockets", "Cooler sockets"]]
      .filter(function (entry) { return Array.isArray(technicalSpecs[entry[0]]); })
      .map(function (entry) { return `<div><dt>${escapeHtml(entry[1])}</dt><dd>${escapeHtml(technicalSpecs[entry[0]].join(", "))}</dd></div>`; }).join("");
    const evidence = Array.isArray(technicalSpecs.evidence) ? technicalSpecs.evidence.map(function (source) {
      return `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`;
    }).join("") : "";
    const salePrice = orderCore.hasPrice(product.price) ? product.price * (1 - SALE_DISCOUNT_RATE) : null;
    productDialogContent.innerHTML = `
      <div class="product-dialog-layout">
        <div class="product-dialog-media"><span class="product-dialog-placeholder" hidden>${escapeHtml(product.category)}</span><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div>
        <div class="product-dialog-copy">
          <div class="product-meta"><span>${escapeHtml(product.category)}</span><span>${escapeHtml(product.tier)}</span></div>
          <h2 id="product-dialog-title">${escapeHtml(product.name)}</h2>
          <p class="product-dialog-model">${escapeHtml(product.brand)} · ${escapeHtml(product.id)}</p>
          <p>${escapeHtml(product.role)}</p>
          <div class="detail-price-row"><strong>${salePrice === null ? money(product.price) : `<s>${money(product.price)}</s><span class="detail-sale-price">${money(salePrice)}</span>`}</strong><span>${salePrice === null ? "Exact price not confirmed" : "15% sale price"}</span></div>
          <div class="inventory-status ${remaining > 0 ? "available" : "unavailable"}">${remaining > 0 ? remaining + " available in demo inventory" : "Currently unavailable"}</div>
          <div class="detail-panel"><h3>Check before ordering</h3><ul>${checks}</ul></div>
          <div class="detail-panel"><h3>Structured specifications</h3>${specRows || arrayRows ? `<dl>${specRows}${arrayRows}</dl>` : `<p>Detailed compatibility specifications have not been verified for this exact model.</p>`}${evidence ? `<p class="spec-date">Last checked ${escapeHtml(technicalSpecs.lastVerified)}.</p><ul class="spec-sources">${evidence}</ul>` : ""}</div>
          <div class="detail-panel"><h3>Catalog details</h3><dl><div><dt>Brand</dt><dd>${escapeHtml(product.brand)}</dd></div><div><dt>Category</dt><dd>${escapeHtml(product.category)}</dd></div><div><dt>Performance tier</dt><dd>${escapeHtml(product.tier)}</dd></div><div><dt>Model ID</dt><dd>${escapeHtml(product.id)}</dd></div></dl></div>
          <button class="button button-primary detail-add-button" type="button" data-add-product="${escapeHtml(product.id)}" ${remaining <= cartQuantity(product.id) ? "disabled" : ""}>${remaining === 0 ? "Unavailable" : "Add to cart"}</button>
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

  function renderCompatibility(items) {
    if (!compatibility) return "";
    const report = compatibility.evaluateBuild(items);
    const headings = { compatible: "Verified checks passed", incompatible: "Incompatible parts found", incomplete: "Build is missing core parts", "needs-review": "Compatibility needs review" };
    const descriptions = {
      compatible: "Every available compatibility check passed for this selection.",
      incompatible: "Fix the failed checks before treating these parts as one PC build.",
      incomplete: "Add the missing core parts to complete the build check.",
      "needs-review": "No conflict was proven, but missing specifications prevent a compatibility claim."
    };
    const icons = { pass: "✓", fail: "×", unknown: "?", missing: "○" };
    const rows = report.checks.map(function (check) {
      return `<li class="compatibility-${check.status}"><span aria-hidden="true">${icons[check.status]}</span><div><strong>${escapeHtml(check.label)}</strong><p>${escapeHtml(check.message)}</p></div></li>`;
    }).join("");
    return `<section class="compatibility-panel compatibility-${report.status}">
      <div class="section-mini-heading"><div><span class="eyebrow">Compatibility engine</span><h3>${escapeHtml(headings[report.status])}</h3></div><strong>${report.counts.pass} passed</strong></div>
      <p>${escapeHtml(descriptions[report.status])}</p><ul>${rows}</ul>
    </section>`;
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
    const overBudget = budget !== null && summary.total !== null && summary.total > budget;
    const budgetMessage = summary.hasIncompletePricing
      ? "Budget check is unavailable until every selected item has a reference price."
      : budget === null ? "Add a budget to check whether this order stays within it."
        : overBudget ? "Over budget by " + money(summary.total - budget) + "."
          : "Within budget by " + money(budget - summary.total) + ".";
    cartContent.innerHTML = `
      ${summary.items.length ? `<div class="cart-items">${itemRows}</div>` : `<div class="empty-cart"><strong>Your cart is empty.</strong><p>Choose a product card to view details, then add it to your order.</p></div>`}
      <section class="build-checklist"><div class="section-mini-heading"><div><span class="eyebrow">Full PC checklist</span><h3>${completedCategories} of ${requiredBuildCategories.length} core parts</h3></div><strong>${Math.round(completedCategories / requiredBuildCategories.length * 100)}%</strong></div><ul>${buildChecklist(summary.items)}</ul></section>
      ${renderCompatibility(summary.items)}
      <section class="budget-panel"><label for="budget-input">Customer budget</label><div class="budget-input"><span>$</span><input id="budget-input" type="number" min="1" step="1" inputmode="decimal" placeholder="Optional" value="${budget === null ? "" : budget}"></div><p class="budget-message ${overBudget || summary.hasIncompletePricing ? "over" : ""}">${budgetMessage}</p></section>
      <section class="order-summary"><div><span>Reference subtotal</span><strong>${money(summary.grossSubtotal)}</strong></div><div class="sale-discount"><span>Thanksgiving sale (15%)</span><strong>−${money(summary.discount)}</strong></div><div><span>Discounted subtotal</span><strong>${money(summary.subtotal)}</strong></div><div><span>Demo tax (${(TAX_RATE * 100).toFixed(1)}%)</span><strong>${money(summary.tax)}</strong></div><div class="order-total"><span>${summary.hasIncompletePricing ? "Total incomplete" : "Total"}</span><strong>${money(summary.total)}</strong></div>${summary.hasIncompletePricing ? `<p class="incomplete-price-note">A selected product is missing reference pricing.</p>` : ""}</section>`;
    const placeOrder = document.getElementById("place-order");
    if (placeOrder) placeOrder.disabled = !summary.items.length || overBudget || summary.hasIncompletePricing || checkoutSubmitting;
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
      ...order.items.map(function (item) { return item.quantity + " × " + item.name + " — " + money(orderCore.hasPrice(item.unitPrice) ? item.unitPrice * item.quantity : null); }),
      "",
      "Retail reference subtotal: " + money(order.grossSubtotal || order.subtotal),
      "Thanksgiving discount: -" + money(order.discount || 0),
      "Discounted subtotal: " + money(order.subtotal),
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
      const itemRows = order.items.map(function (item) { return `<li><span>${item.quantity} × ${escapeHtml(item.name)}</span><strong>${money(orderCore.hasPrice(item.unitPrice) ? item.unitPrice * item.quantity : null)}</strong></li>`; }).join("");
      return `<article class="saved-order">
        <header><div><span class="order-id">${escapeHtml(order.id)}</span><h3>${escapeHtml(order.customer.name)}</h3><p>${new Date(order.createdAt).toLocaleString()} · ${escapeHtml(order.fulfillment)}</p></div><span class="order-status ${order.status.toLowerCase()}">${escapeHtml(order.status)}</span></header>
        <details><summary>Review ${order.items.reduce(function (total, item) { return total + item.quantity; }, 0)} items</summary><ul>${itemRows}</ul><div class="saved-order-total"><span>Order total</span><strong>${money(order.total)}</strong></div>${order.notes ? `<p class="order-notes">${escapeHtml(order.notes)}</p>` : ""}</details>
        <footer><button type="button" data-download-order="${escapeHtml(order.id)}">Download receipt</button>${order.status !== "Cancelled" && order.status !== "Completed" ? `<button class="cancel-order" type="button" data-cancel-order="${escapeHtml(order.id)}">Cancel order</button>` : ""}</footer>
      </article>`;
    }).join("");
  }

  function renderAdmin() {
    const stats = orderCore.calculateStats(orders);
    adminStats.innerHTML = `<article><span>Total orders</span><strong>${stats.total}</strong></article><article><span>Active</span><strong>${stats.active}</strong></article><article><span>Ready</span><strong>${stats.ready}</strong></article><article><span>Demo revenue</span><strong>${money(stats.revenue)}</strong></article>`;
    const matches = orderCore.filterOrders(orders, adminSearch.value, adminStatus.value);
    if (!matches.length) {
      adminOrdersList.innerHTML = `<div class="empty-orders"><strong>No matching orders.</strong><p>Try a different order ID, customer, email, or status.</p></div>`;
      return;
    }
    adminOrdersList.innerHTML = matches.map(function (order) {
      const options = orderCore.ORDER_STATUSES.map(function (status) { return `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`; }).join("");
      return `<article class="admin-order"><div><span class="order-id">${escapeHtml(order.id)}</span><h3>${escapeHtml(order.customer.name)}</h3><p>${escapeHtml(order.customer.email)} · ${order.items.length} product lines · ${money(order.total)}</p></div><label>Status<select data-order-status="${escapeHtml(order.id)}">${options}</select></label></article>`;
    }).join("");
  }

  function updateOrderStatus(orderIdValue, status) {
    if (!orderCore.isValidStatus(status)) return;
    const order = orders.find(function (entry) { return entry.id === orderIdValue; });
    if (!order || order.status === status) return;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (status === "Cancelled") order.cancelledAt = order.updatedAt;
    saveState();
    renderOrders();
    renderAdmin();
    renderCart();
    window.dispatchEvent(new CustomEvent("nexora:inventory-changed"));
    showToast(order.id + " moved to " + status + ".");
  }

  function placeOrder(event) {
    event.preventDefault();
    if (checkoutSubmitting) return;
    checkoutError.hidden = true;
    const summary = cartSummary();
    if (!summary.items.length) return;
    if (summary.hasIncompletePricing) {
      checkoutError.textContent = "Every item needs a verified reference price before this demo order can be placed.";
      checkoutError.hidden = false;
      return;
    }
    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      checkoutError.textContent = "Enter a valid name, email, and fulfillment method.";
      checkoutError.hidden = false;
      return;
    }
    const customer = orderCore.validateCustomer({ name: document.getElementById("customer-name").value, email: document.getElementById("customer-email").value });
    if (!customer.valid) {
      checkoutError.textContent = customer.message;
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
    const fingerprint = orderCore.orderFingerprint(customer, summary.items);
    if (fingerprint === lastSubmission.fingerprint && Date.now() - lastSubmission.time < 5000) {
      checkoutError.textContent = "That order was just submitted. Check the order center before trying again.";
      checkoutError.hidden = false;
      return;
    }
    checkoutSubmitting = true;
    renderCart();
    const order = {
      id: orderId(),
      createdAt: new Date().toISOString(),
      status: "Received",
      customer: { name: customer.name, email: customer.email },
      fulfillment: document.getElementById("fulfillment-method").value,
      notes: document.getElementById("order-notes").value.trim(),
      budget,
      items: summary.items.map(function (item) { return { productId: item.product.id, name: item.product.name, category: item.product.category, quantity: item.quantity, unitPrice: item.product.price }; }),
      subtotal: summary.subtotal,
      grossSubtotal: summary.grossSubtotal,
      discount: summary.discount,
      tax: summary.tax,
      total: summary.total
    };
    lastSubmission = { fingerprint: fingerprint, time: Date.now() };
    orders.unshift(order);
    cart = [];
    saveState();
    checkoutForm.reset();
    updateCartCount();
    renderCart();
    renderOrders();
    renderAdmin();
    window.dispatchEvent(new CustomEvent("nexora:inventory-changed"));
    openDialog(ordersBackdrop);
    showToast("Order " + order.id + " saved.");
    checkoutSubmitting = false;
  }

  function cancelOrder(orderIdValue) {
    const order = orders.find(function (entry) { return entry.id === orderIdValue; });
    if (!order || order.status === "Cancelled" || order.status === "Completed") return;
    updateOrderStatus(orderIdValue, "Cancelled");
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
    const statusSelect = event.target.closest("[data-order-status]");
    if (statusSelect) updateOrderStatus(statusSelect.dataset.orderStatus, statusSelect.value);
  });

  adminBackdrop.addEventListener("change", function (event) {
    const statusSelect = event.target.closest("[data-order-status]");
    if (statusSelect) updateOrderStatus(statusSelect.dataset.orderStatus, statusSelect.value);
  });
  adminSearch.addEventListener("input", renderAdmin);
  adminStatus.addEventListener("change", renderAdmin);

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
  const openAdminButton = document.getElementById("open-admin");
  if (openCartButton) openCartButton.addEventListener("click", function () { renderCart(); openDialog(cartBackdrop); });
  if (openOrdersButton) openOrdersButton.addEventListener("click", function () { renderOrders(); openDialog(ordersBackdrop); });
  if (openAdminButton) openAdminButton.addEventListener("click", function () { renderAdmin(); openDialog(adminBackdrop); });

  cart = cart.filter(function (item) {
    const product = productById(item.productId);
    return product && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= remainingInventory(product);
  });
  saveState();
  updateCartCount();
  renderCart();
  renderOrders();
  renderAdmin();

  window.NEXORA_ORDERING = {
    addToCart,
    cartQuantity,
    openCart: function () { renderCart(); openDialog(cartBackdrop); },
    openProduct,
    remainingInventory
  };

  if (new URLSearchParams(window.location.search).get("cart") === "open") {
    renderCart();
    openDialog(cartBackdrop);
    window.history.replaceState({}, "", window.location.pathname);
  }
})();
