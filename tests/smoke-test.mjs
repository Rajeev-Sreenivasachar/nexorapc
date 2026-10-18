import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const requiredPages = [
  "index.html", "shop.html", "product.html", "cart.html", "builder.html",
  "assistant.html", "about.html", "support.html", "privacy.html", "terms.html", "credits.html"
];
const requiredDocs = ["README.md", "JAVASCRIPT_GUIDE.md", "IMAGE_GUIDE.md", "PRODUCT_GUIDE.md"];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

requiredPages.forEach(function (page) {
  check(existsSync(join(root, page)), "Missing required page: " + page);
});
requiredDocs.forEach(function (file) {
  check(existsSync(join(root, file)), "Missing required documentation: " + file);
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
check(Array.isArray(products) && products.length >= 150, "Catalog should contain at least 150 products.");
check(Array.isArray(categories) && categories.length === 8, "Catalog should contain 8 categories.");

if (Array.isArray(products)) {
  const ids = products.map(function (product) { return product.id; });
  const images = products.map(function (product) { return product.image; });
  check(new Set(ids).size === ids.length, "Product IDs must be unique.");
  check(new Set(images).size === images.length, "Product image paths must be unique.");
  products.forEach(function (product) {
    check(product.price === null || product.price > 0, product.id + " needs a positive price or null.");
    check(typeof product.modelNumber === "string" && product.modelNumber.length > 0, product.id + " is missing a model designation.");
    check(typeof product.priceSource === "string" && product.priceSource.length > 0, product.id + " is missing a price source.");
    check(/^https:\/\//.test(product.priceSourceUrl), product.id + " is missing a source URL.");
    check(/^https:\/\//.test(product.listingUrl), product.id + " is missing a retailer listing URL.");
    check(/^\d{4}-\d{2}-\d{2}$/.test(product.priceChecked), product.id + " has an invalid price-check date.");
    check(product.image === "assets/images/products/" + product.id + ".png", product.id + " does not use its standard image filename.");
    check(categories.some(function (category) { return category.id === product.category; }), product.id + " uses an unknown category.");
    check(product.compatibility && typeof product.compatibility === "object", product.id + " is missing compatibility metadata.");
  });
  categories.forEach(function (category) {
    check(products.filter(function (product) { return product.category === category.id; }).length >= 20, category.id + " should contain at least 20 products.");
  });
  ["AMD", "Intel", "ASUS", "MSI", "GIGABYTE", "ASRock", "Corsair", "Kingston", "G.Skill", "Crucial", "Samsung", "Western Digital", "SeaSonic", "be quiet!", "NZXT", "Lian Li", "Fractal Design", "Noctua", "ARCTIC", "Deepcool", "Thermalright"].forEach(function (brand) {
    check(products.some(function (product) { return product.brand.toLowerCase() === brand.toLowerCase() || product.name.toLowerCase().startsWith(brand.toLowerCase()); }), "Catalog is missing requested brand: " + brand);
  });
  check(products.filter(function (product) { return product.priceStatus === "verified-retailer"; }).length >= 2, "Catalog should retain the directly verified retailer listings.");

  const searchResults = products.filter(function (product) {
    return [product.name, product.brand, product.modelNumber, product.description].join(" ").toLowerCase().includes("corsair");
  });
  check(searchResults.length > 0, "Catalog search should find Corsair products.");
  const filteredResults = products.filter(function (product) {
    return product.category === "gpu" && product.price !== null && product.price >= 300 && product.price <= 1000;
  });
  check(filteredResults.length > 0 && filteredResults.every(function (product) { return product.category === "gpu" && product.price >= 300 && product.price <= 1000; }), "Combined category and price filtering should return valid products.");
  const sortedPrices = filteredResults.slice().sort(function (a, b) { return a.price - b.price; }).map(function (product) { return product.price; });
  check(sortedPrices.every(function (price, index) { return index === 0 || sortedPrices[index - 1] <= price; }), "Low-to-high price sorting should be ordered.");
}

const shopHtml = readFileSync(join(root, "shop.html"), "utf8");
const shopScript = readFileSync(join(root, "assets", "js", "shop.js"), "utf8");
check(shopHtml.includes('id="minimum-price"') && shopHtml.includes('id="maximum-price"'), "Shop needs minimum and maximum price fields.");
check(shopHtml.includes('id="load-more"') && shopScript.includes("const PAGE_SIZE = 24"), "Shop needs Load More pagination.");
check(readFileSync(join(root, "assets", "js", "main.js"), "utf8").includes('matches("[data-product-image]")'), "Missing product images need a shared fallback handler.");

const apiCatalogContext = {};
vm.createContext(apiCatalogContext);
vm.runInContext(readFileSync(join(root, "api", "catalog.js"), "utf8").replace("export const catalog =", "catalog ="), apiCatalogContext);
check(Array.isArray(apiCatalogContext.catalog) && apiCatalogContext.catalog.length === products.length, "Gemini catalog should match the storefront catalog count.");

const completeAmdBuild = {
  cpu: "amd-ryzen-5-7600",
  gpu: "gigabyte-windforce-oc-geforce-rtx-4070-super",
  motherboard: "asus-prime-b650-plus-wifi",
  ram: "corsair-vengeance-rgb-32-gb-ddr5-6000-cl36",
  storage: "samsung-990-pro-2-tb",
  psu: "msi-mag-a750gl-pcie5",
  case: "nzxt-h5-flow-2024",
  cooling: "thermalright-peerless-assassin-120-se"
};
const amdResult = context.window.NexoraCompatibility.checkBuild(completeAmdBuild);
check(!amdResult.checks.some(function (item) { return item.status === "incompatible"; }), "The complete AMD test build should have no known incompatibilities.");
check(amdResult.checks.some(function (item) { return item.status === "unknown"; }), "Unverified cooler mounting data should remain unknown.");
check(amdResult.requiredPsu <= 750, "The AMD test build should fit the selected 750 W PSU estimate.");

const mismatchedBuild = {
  cpu: "amd-ryzen-5-7600",
  motherboard: "msi-b760-gaming-plus-wifi",
  ram: "corsair-vengeance-lpx-16-gb-ddr4-3200-cl16"
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
