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
const priceAudit = JSON.parse(readFileSync(join(root, "data/price-audit.json"), "utf8"));
check(products.length === 300, "Pricing overlay did not preserve all 300 products.");
check(products.filter(function (product) { return product.priceStatus === "verified_reference"; }).length === 45, "Expected exactly 45 currently verified reference prices.");
check(products.filter(function (product) { return product.priceStatus === "estimated_reference"; }).length === 255, "Expected exactly 255 clearly labeled price estimates.");
check(products.every(function (product) { return Number.isFinite(product.price) && product.price > 0; }), "Every catalog product needs a usable positive reference price.");
check(priceAudit.totalProducts === 300 && priceAudit.products.length === 300, "Price audit must cover every catalog product.");
check(priceAudit.verifiedPriceCount === 45 && priceAudit.estimatedPriceCount === 255 && priceAudit.unconfirmedPriceCount === 0, "Price audit summary counts are incorrect.");
check(priceAudit.products.every(function (record) { return record.checkedDate === "2026-11-11"; }), "Every audit record needs the current check date.");
check(priceAudit.products.filter(function (record) { return record.status === "verified_reference"; }).every(function (record) {
  return Number.isFinite(record.priceUSD) && record.priceUSD > 0 && /^https:\/\//.test(record.listingUrl);
}), "Every displayed price needs a positive amount and public listing URL.");
check(products.find(function (product) { return product.id === "NX-0001"; }).price === 137.95, "Ryzen 5 5600 Amazon reference price is incorrect.");
check(products.find(function (product) { return product.id === "NX-0005"; }).price === 341, "Ryzen 7 9700X Best Buy reference price is incorrect.");
check(products.find(function (product) { return product.id === "NX-0007"; }).price === 479, "Ryzen 7 9800X3D reference price is incorrect.");
check(products.find(function (product) { return product.name.includes("Ryzen 9 5900X"); }).price === 239, "Ryzen 9 5900X estimate is incorrect.");
check(products.find(function (product) { return product.name.includes("Ryzen 9 5900X"); }).priceStatus === "estimated_reference", "Ryzen 9 5900X must be labeled as estimated.");

const cores = browserContext(["assets/js/ordering-core.js", "assets/js/catalog-core.js"]);
const orderCore = cores.NEXORA_ORDER_CORE;
const catalogCore = cores.NEXORA_CATALOG_CORE;
const pricedTotals = orderCore.calculateTotals([{ product: { price: 100 }, quantity: 2 }], 0.075);
check(pricedTotals.subtotal === 200 && pricedTotals.tax === 15 && pricedTotals.total === 215, "Order totals are incorrect.");
const saleTotals = orderCore.calculateTotals([{ product: { price: 100 }, quantity: 2 }], 0.075, 15);
check(saleTotals.grossSubtotal === 200 && saleTotals.discount === 30 && saleTotals.subtotal === 170 && saleTotals.total === 182.75, "Thanksgiving per-item discount is incorrect.");
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

const finder = browserContext(["assets/js/prebuilt-data.js", "assets/js/prebuilt-core.js"]);
check(finder.NEXORA_PREBUILTS.length === 7, "PC Finder should contain seven researched prebuilt listings.");
check(finder.NEXORA_PREBUILTS.every(function (system) { return system.source === "Best Buy" && system.sourceUrl.startsWith("https://www.bestbuy.com/product/") && system.checkedDate === "2026-11-11"; }), "Every PC Finder result should use a dated direct Best Buy listing.");
check(finder.NEXORA_PREBUILTS.find(function (system) { return system.id === "PB-002"; }).price === 1199.99, "iBUYPOWER Slate current reference price is incorrect.");
check(finder.NEXORA_PREBUILTS.find(function (system) { return system.id === "PB-007"; }).price === 3299.99, "ASUS ROG G700 current reference price is incorrect.");
const finderAnswers = { tasks: ["gaming", "coding"], games: "Cyberpunk 2077", coding: "heavy", resolution: "1440p", priority: "performance", budget: 2200 };
const recommendations = finder.NEXORA_PREBUILT_CORE.rankSystems(finder.NEXORA_PREBUILTS, finderAnswers, 3);
check(recommendations.length === 3 && recommendations.every(function (entry) { return entry.system.price <= 2200; }), "PC Finder did not return three in-budget recommendations.");
check(recommendations[0].system.gaming >= 4 && recommendations[0].system.coding >= 4, "PC Finder ignored the heavy gaming and coding profile.");

if (failures.length) {
  console.error("Logic test failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Logic test passed: pricing, catalog filters, checkout totals, inventory, admin orders, and AI context are working.");
