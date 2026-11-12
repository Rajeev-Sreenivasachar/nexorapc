(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NEXORA_ORDER_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ORDER_STATUSES = ["Received", "Preparing", "Ready", "Completed", "Cancelled"];

  function hasPrice(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  }

  function calculateTotals(items, taxRate, discountRate) {
    const saleRate = Math.min(1, Math.max(0, Number(discountRate) || 0));
    const normalized = (Array.isArray(items) ? items : []).map(function (item) {
      const unitPrice = item && item.product ? item.product.price : item && item.unitPrice;
      const quantity = Number(item && item.quantity) || 0;
      return Object.assign({}, item, {
        quantity: quantity,
        lineTotal: hasPrice(unitPrice) ? Math.round(unitPrice * quantity * 100) / 100 : null,
        discount: hasPrice(unitPrice) ? Math.round(unitPrice * saleRate * quantity * 100) / 100 : null
      });
    });
    const hasIncompletePricing = normalized.some(function (item) { return item.lineTotal === null; });
    const grossSubtotal = Math.round(normalized.reduce(function (total, item) { return total + (item.lineTotal || 0); }, 0) * 100) / 100;
    const discount = Math.round(normalized.reduce(function (total, item) { return total + (item.discount || 0); }, 0) * 100) / 100;
    const subtotal = Math.max(0, Math.round((grossSubtotal - discount) * 100) / 100);
    const tax = hasIncompletePricing ? null : Math.round(subtotal * Number(taxRate || 0) * 100) / 100;
    return {
      items: normalized,
      grossSubtotal: grossSubtotal,
      discount: discount,
      subtotal: subtotal,
      tax: tax,
      total: tax === null ? null : Math.round((subtotal + tax) * 100) / 100,
      hasIncompletePricing: hasIncompletePricing
    };
  }

  function validateCustomer(customer) {
    const name = String(customer && customer.name || "").trim();
    const email = String(customer && customer.email || "").trim();
    if (name.length < 2) return { valid: false, message: "Enter a full name with at least two characters." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, message: "Enter a valid email address." };
    return { valid: true, name: name, email: email };
  }

  function isValidStatus(status) {
    return ORDER_STATUSES.includes(status);
  }

  function committedQuantity(orders, productId) {
    return (Array.isArray(orders) ? orders : []).reduce(function (total, order) {
      if (!order || order.status === "Cancelled" || !Array.isArray(order.items)) return total;
      const item = order.items.find(function (entry) { return entry.productId === productId; });
      return total + (item ? Number(item.quantity) || 0 : 0);
    }, 0);
  }

  function orderFingerprint(customer, items) {
    const contents = (Array.isArray(items) ? items : []).map(function (item) {
      return [item.productId || item.product && item.product.id, Number(item.quantity) || 0].join(":");
    }).sort().join("|");
    return [String(customer && customer.email || "").trim().toLowerCase(), contents].join("::");
  }

  function filterOrders(orders, query, status) {
    const needle = String(query || "").trim().toLowerCase();
    return (Array.isArray(orders) ? orders : []).filter(function (order) {
      const matchesStatus = !status || status === "all" || order.status === status;
      const searchable = [order.id, order.customer && order.customer.name, order.customer && order.customer.email].join(" ").toLowerCase();
      return matchesStatus && (!needle || searchable.includes(needle));
    });
  }

  function calculateStats(orders) {
    const list = Array.isArray(orders) ? orders : [];
    const active = list.filter(function (order) { return !["Completed", "Cancelled"].includes(order.status); }).length;
    const ready = list.filter(function (order) { return order.status === "Ready"; }).length;
    const revenue = Math.round(list.reduce(function (total, order) {
      return order.status !== "Cancelled" && hasPrice(order.total) ? total + order.total : total;
    }, 0) * 100) / 100;
    return { total: list.length, active: active, ready: ready, revenue: revenue };
  }

  return { ORDER_STATUSES, calculateTotals, validateCustomer, isValidStatus, committedQuantity, orderFingerprint, filterOrders, calculateStats, hasPrice };
});
