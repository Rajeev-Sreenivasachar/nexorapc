import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const requiredPages = [
  "index.html", "shop.html", "product.html", "cart.html", "builder.html",
  "assistant.html", "about.html", "support.html", "privacy.html", "terms.html", "credits.html"
];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

requiredPages.forEach(function (page) {
  check(existsSync(join(root, page)), "Missing required page: " + page);
});

const javascriptFiles = [
  ...readdirSync(join(root, "assets", "js")).filter(function (file) { return file.endsWith(".js"); }).map(function (file) { return join(root, "assets", "js", file); }),
  join(root, "api", "chat.js")
];

javascriptFiles.forEach(function (file) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  check(result.status === 0, "JavaScript syntax failed for " + file + ": " + result.stderr.trim());
});

requiredPages.forEach(function (page) {
  const html = readFileSync(join(root, page), "utf8");
  check(html.includes('<html lang="en">'), page + " is missing an English language declaration.");
  check(/<title>[^<]+<\/title>/.test(html), page + " is missing a document title.");
  check(html.includes('id="main-content"'), page + " is missing the main-content landmark.");
  check(html.includes("assets/js/main.js"), page + " is missing the shared main script.");
  check(!/onclick=|onchange=|onsubmit=/.test(html), page + " contains inline JavaScript instead of event listeners.");

  const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), function (match) { return match[1]; });
  check(new Set(ids).size === ids.length, page + " contains duplicate static IDs.");
  for (const image of html.matchAll(/<img\s+[^>]*>/g)) {
    check(/\salt="[^"]*"/.test(image[0]), page + " contains an image without alt text.");
  }

  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|data:)/.test(target)) continue;
    check(existsSync(join(root, target)), page + " has a missing local target: " + target);
  }
});

const context = { window: {} };
vm.createContext(context);
vm.runInContext(readFileSync(join(root, "assets", "js", "products.js"), "utf8"), context);
vm.runInContext(readFileSync(join(root, "assets", "js", "compatibility.js"), "utf8"), context);
const products = context.window.NEXORA_PRODUCTS;
const categories = context.window.NEXORA_CATEGORIES;
check(Array.isArray(products) && products.length === 16, "Catalog should contain 16 products.");
check(Array.isArray(categories) && categories.length === 8, "Catalog should contain 8 categories.");

if (Array.isArray(products)) {
  const ids = products.map(function (product) { return product.id; });
  check(new Set(ids).size === ids.length, "Product IDs must be unique.");
  products.forEach(function (product) {
    check(product.price > 0, product.id + " needs a positive demo price.");
    check(categories.some(function (category) { return category.id === product.category; }), product.id + " uses an unknown category.");
    check(product.compatibility && typeof product.compatibility === "object", product.id + " is missing compatibility metadata.");
  });
}

const completeAmdBuild = {
  cpu: "amd-ryzen-5-7600",
  gpu: "nvidia-rtx-4070-super",
  motherboard: "msi-pro-b650-s-wifi",
  ram: "corsair-vengeance-32gb-ddr5",
  storage: "samsung-990-pro-2tb",
  psu: "corsair-rm750e",
  case: "corsair-4000d-airflow",
  cooling: "thermalright-peerless-assassin-120-se"
};
const amdResult = context.window.NexoraCompatibility.checkBuild(completeAmdBuild);
check(amdResult.checks.every(function (item) { return item.status === "compatible"; }), "The complete AMD test build should pass all five compatibility checks.");
check(amdResult.requiredPsu <= 750, "The AMD test build should fit the selected 750 W PSU estimate.");

const mismatchedBuild = {
  cpu: "amd-ryzen-5-7600",
  motherboard: "asus-tuf-z790-plus-wifi",
  ram: "corsair-vengeance-32gb-ddr5"
};
const mismatchResult = context.window.NexoraCompatibility.checkBuild(mismatchedBuild);
check(mismatchResult.checks.filter(function (item) { return item.status === "incompatible"; }).length === 2, "The mismatch test should detect both socket and memory incompatibility.");

const emptyResult = context.window.NexoraCompatibility.checkBuild({});
check(emptyResult.checks.every(function (item) { return item.status === "unknown"; }), "An empty build should report unknown checks, not compatibility.");

if (failures.length) {
  console.error("Smoke test failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Smoke test passed: JavaScript parses, required pages and links exist, and catalog data is valid.");
