import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { runInNewContext } from "node:vm";
import { sanitizeCatalogContext, catalogPrompt } from "../api/chat-utils.js";

const root = resolve(import.meta.dirname, "..");
const failures = [];
function check(condition, message) { if (!condition) failures.push(message); }
function browserContext(files) {
  const context = { window: {} };
  context.window.window = context.window;
  files.forEach(function (file) { runInNewContext(readFileSync(join(root, file), "utf8"), context, { filename: file }); });
  return Object.assign(context, context.window);
}

const pricing = browserContext(["assets/js/products.js", "assets/js/pricing-data.js"]);
const products = pricing.NEXORA_PRODUCTS;
check(products.length === 300, "Pricing overlay did not preserve all 300 products.");
check(products.filter(function (product) { return product.priceStatus === "verified_reference"; }).length === 10, "Expected exactly 10 currently verified reference prices.");
check(products.find(function (product) { return product.id === "NX-0005"; }).price === 339, "Ryzen 7 9700X reference price is incorrect.");
check(products.find(function (product) { return product.id === "NX-0007"; }).price === 479, "Ryzen 7 9800X3D reference price is incorrect.");
check(products.find(function (product) { return product.name.includes("Ryzen 9 5900X"); }).price === null, "Ryzen 9 5900X should say Check retailer, not show demo pricing.");

const cores = browserContext(["assets/js/ordering-core.js", "assets/js/catalog-core.js"]);
const orderCore = cores.NEXORA_ORDER_CORE;
const catalogCore = cores.NEXORA_CATALOG_CORE;
const pricedTotals = orderCore.calculateTotals([{ product: { price: 100 }, quantity: 2 }], 0.075);
check(pricedTotals.subtotal === 200 && pricedTotals.tax === 15 && pricedTotals.total === 215, "Order totals are incorrect.");
const incompleteTotals = orderCore.calculateTotals([{ product: { price: null }, quantity: 1 }], 0.075);
check(incompleteTotals.hasIncompletePricing && incompleteTotals.total === null, "Unverified prices must make the order total incomplete.");
check(!orderCore.validateCustomer({ name: "A", email: "bad" }).valid, "Invalid checkout data was accepted.");
check(orderCore.validateCustomer({ name: "Alex Lee", email: "alex@example.com" }).valid, "Valid checkout data was rejected.");
const orderSet = [{ status: "Preparing", items: [{ productId: "P1", quantity: 2 }] }, { status: "Cancelled", items: [{ productId: "P1", quantity: 5 }] }];
check(orderCore.committedQuantity(orderSet, "P1") === 2, "Cancelled orders should restore inventory while active orders reserve it.");
check(orderCore.filterOrders([{ id: "NXO-1", status: "Ready", customer: { name: "Alex", email: "a@b.com" } }], "alex", "Ready").length === 1, "Admin order search or status filtering failed.");
check(orderCore.calculateStats([{ status: "Ready", total: 50 }, { status: "Cancelled", total: 90 }]).revenue === 50, "Admin revenue should exclude cancelled orders.");
const sorted = catalogCore.filterAndSort([{ name: "Unpriced", price: null, brand: "A", category: "CPU", tier: "Budget" }, { name: "Priced", price: 10, brand: "A", category: "CPU", tier: "Budget" }], { sort: "price-asc" });
check(sorted[0].name === "Priced", "Unpriced products should sort after verified prices.");

const cleanContext = sanitizeCatalogContext([{ id: "NX-1", name: "Part", price: 25, inventory: 4, technicalSpecs: { socket: "AM5", evidence: [{ secret: true }] } }]);
check(cleanContext.length === 1 && cleanContext[0].technicalSpecs.socket === "AM5" && !cleanContext[0].technicalSpecs.evidence, "AI catalog context sanitizer failed.");
check(catalogPrompt(cleanContext).includes("NX-1"), "AI catalog prompt omitted the supplied product.");

if (failures.length) {
  console.error("Logic test failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Logic test passed: pricing, catalog filters, checkout totals, inventory, admin orders, and AI context are working.");
