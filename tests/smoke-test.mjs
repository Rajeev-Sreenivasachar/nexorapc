import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";

const root = resolve(import.meta.dirname, "..");
const requiredPages = ["index.html", "about.html", "shop.html"];
const removedPages = [
  "product.html", "cart.html", "builder.html", "reviews.html",
  "support.html", "privacy.html", "terms.html", "credits.html", "assistant.html"
];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

requiredPages.forEach(function (page) {
  check(existsSync(join(root, page)), "Missing required page: " + page);
});

removedPages.forEach(function (page) {
  check(!existsSync(join(root, page)), "Removed page still exists: " + page);
});

const htmlFiles = readdirSync(root).filter(function (file) { return file.endsWith(".html"); }).sort();
check(JSON.stringify(htmlFiles) === JSON.stringify(requiredPages.slice().sort()), "The repository root should contain only Home, Shop, and About pages.");

const javascriptDirectory = join(root, "assets", "js");
const javascriptFiles = readdirSync(javascriptDirectory).filter(function (file) { return file.endsWith(".js"); }).sort();
check(JSON.stringify(javascriptFiles) === JSON.stringify(["accessibility.js", "assistant.js", "install.js", "main.js", "ordering.js", "products.js", "shop.js"]), "assets/js contains unexpected or missing scripts.");

javascriptFiles.forEach(function (file) {
  const result = spawnSync(process.execPath, ["--check", join(javascriptDirectory, file)], { encoding: "utf8" });
  check(result.status === 0, "JavaScript syntax failed for " + file + ": " + result.stderr.trim());
});

requiredPages.forEach(function (page) {
  const html = readFileSync(join(root, page), "utf8");
  check(html.includes('<html lang="en">'), page + " is missing an English language declaration.");
  check(/<title>[^<]+<\/title>/.test(html), page + " is missing a document title.");
  check(html.includes('id="main-content"'), page + " is missing the main-content landmark.");
  check(html.includes("assets/css/style.css"), page + " is missing the shared stylesheet.");
  check(html.includes("assets/js/main.js"), page + " is missing the shared script.");
  check(html.includes("assets/js/install.js"), page + " is missing the app installation script.");
  check(html.includes("assets/js/assistant.js"), page + " is missing the assistant script.");
  check(html.includes("assets/js/accessibility.js"), page + " is missing the accessibility script.");
  check(html.includes('rel="manifest"') && html.includes("manifest.webmanifest"), page + " is missing the web app manifest.");
  check(html.includes('rel="apple-touch-icon"'), page + " is missing its Apple touch icon.");
  if (page === "shop.html") {
    check(html.includes("assets/js/products.js") && html.includes("assets/js/ordering.js") && html.includes("assets/js/shop.js"), "Shop is missing its product data, ordering, or display logic.");
  }
  check(!/onclick=|onchange=|onsubmit=/.test(html), page + " contains inline JavaScript.");
  check(!/assets\/(?:css|js)\/[^"?]+\.(?:css|js)"/.test(html), page + " has an unversioned CSS or JavaScript asset.");

  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|data:)/.test(target)) continue;
    check(existsSync(join(root, target)), page + " has a missing local target: " + target);
  }
});

const allSource = requiredPages.map(function (page) { return readFileSync(join(root, page), "utf8"); }).join("\n") + javascriptFiles.map(function (file) { return readFileSync(join(javascriptDirectory, file), "utf8"); }).join("\n");
removedPages.forEach(function (page) {
  check(!allSource.includes(page), "Retained pages or shared JavaScript still link to " + page + ".");
});
check(!/coming soon|next version is planned|future tools/i.test(allSource), "Site copy contains unfinished placeholder language.");

const homepage = readFileSync(join(root, "index.html"), "utf8");
check(homepage.includes('class="trust-strip"'), "Homepage is missing the checkmark strip.");
check(homepage.includes("Understand every component") && homepage.includes("Check what works together") && homepage.includes("Build with confidence"), "Homepage checkmark goals are incomplete.");
check(homepage.includes('class="hardware-story section-alt"'), "Homepage is missing the hardware story section.");
check(!homepage.includes("editorial-intro") && !homepage.includes("principles-section"), "Homepage still contains the removed oversized sections.");
check(homepage.includes('class="about-callout section-alt"') && !homepage.includes("student-callout"), "Homepage About Nexora callout is missing or the team callout remains.");
check(homepage.includes("FBLA Introduction to Programming") && homepage.includes("hardware parts shop experience"), "Homepage FBLA or hardware shop labeling is missing.");

const mainScript = readFileSync(join(javascriptDirectory, "main.js"), "utf8");
const installScript = readFileSync(join(javascriptDirectory, "install.js"), "utf8");
const assistantScript = readFileSync(join(javascriptDirectory, "assistant.js"), "utf8");
const accessibilityScript = readFileSync(join(javascriptDirectory, "accessibility.js"), "utf8");
const orderingScript = readFileSync(join(javascriptDirectory, "ordering.js"), "utf8");
const productScript = readFileSync(join(javascriptDirectory, "products.js"), "utf8");
const productContext = {};
runInNewContext(productScript, productContext);
const products = productContext.NEXORA_PRODUCTS || [];
const chatRoutePath = join(root, "api", "chat.js");
check(existsSync(chatRoutePath), "Missing Gemini server route: api/chat.js.");
const chatRoute = existsSync(chatRoutePath) ? readFileSync(chatRoutePath, "utf8") : "";
if (existsSync(chatRoutePath)) {
  const routeSyntax = spawnSync(process.execPath, ["--check", chatRoutePath], { encoding: "utf8" });
  check(routeSyntax.status === 0, "Gemini route syntax failed: " + routeSyntax.stderr.trim());
}
const sharedStyles = readFileSync(join(root, "assets", "css", "style.css"), "utf8");
const manifestPath = join(root, "manifest.webmanifest");
const serviceWorkerPath = join(root, "service-worker.js");
check(existsSync(manifestPath), "Missing web app manifest.");
check(existsSync(serviceWorkerPath), "Missing service worker.");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
check(manifest.name === "Nexora PC Parts" && manifest.short_name === "Nexora", "Manifest app identity is incorrect.");
check(manifest.display === "standalone" && manifest.start_url, "Manifest is missing standalone display or a start URL.");
check(Array.isArray(manifest.icons) && manifest.icons.some(function (icon) { return icon.sizes === "192x192"; }) && manifest.icons.some(function (icon) { return icon.sizes === "512x512" && icon.purpose.includes("maskable"); }), "Manifest needs 192px and maskable 512px app icons.");
if (existsSync(serviceWorkerPath)) {
  const serviceWorkerSyntax = spawnSync(process.execPath, ["--check", serviceWorkerPath], { encoding: "utf8" });
  check(serviceWorkerSyntax.status === 0, "Service worker syntax failed: " + serviceWorkerSyntax.stderr.trim());
}
check(existsSync(join(root, "assets", "images", "app-icon-192.png")) && existsSync(join(root, "assets", "images", "app-icon-512.png")), "PWA app icons are missing.");
check(mainScript.includes('["home", "index.html", "Home"]'), "Shared navigation is missing Home.");
check(mainScript.includes('["shop", "shop.html", "Shop"]'), "Shared navigation is missing Shop.");
check(mainScript.includes('["about", "about.html", "About Nexora"]'), "Shared navigation is missing About.");
check(mainScript.includes("FBLA Introduction to Programming") && mainScript.includes("hardware parts shop experience"), "Footer FBLA or hardware shop labeling is missing.");
check(!mainScript.includes("data-open-ai") && !mainScript.includes("nav-ai-button"), "Shared navigation still contains the removed Ask Nexora control.");
check(mainScript.includes("mobile-app-bar") && mainScript.includes("data-install-app"), "Shared app navigation or install control is missing.");
check(installScript.includes("beforeinstallprompt") && installScript.includes("appinstalled") && installScript.includes('serviceWorker.register("/service-worker.js")'), "Install prompt or service-worker registration is incomplete.");
check(assistantScript.includes('fetch("/api/chat"'), "Assistant does not call the server-side chat route.");
check(!assistantScript.includes("GEMINI_API_KEY"), "Frontend JavaScript must not reference the Gemini API key.");
check(accessibilityScript.includes("nexora_accessibility_v1"), "Accessibility preferences are not persisted.");
check(accessibilityScript.includes('role="dialog"') && accessibilityScript.includes("speechSynthesis"), "Accessibility dialog or text-to-speech support is missing.");
check(products.length === 300, "Product catalog should contain exactly 300 products.");
check(new Set(products.map(function (product) { return product.id; })).size === 300, "Product IDs must be unique.");
check(new Set(products.map(function (product) { return product.name; })).size === 300, "Product names must be unique.");
check(new Set(products.map(function (product) { return product.category; })).size === 10, "Product catalog should contain 10 categories.");
check(Array.from(new Set(products.map(function (product) { return product.category; }))).every(function (category) { return products.filter(function (product) { return product.category === category; }).length === 30; }), "Every category should contain exactly 30 products.");
check(products.every(function (product) { return Number.isFinite(product.price) && product.price > 0 && product.priceStatus === "demo_estimate"; }), "Products must use positive, clearly labeled demo prices.");
check(products.every(function (product) { return Number.isInteger(product.inventory) && product.inventory >= 0 && product.orderable === (product.inventory > 0); }), "Every product needs valid demo inventory and a matching orderable state.");
check(products.some(function (product) { return product.inventory === 0; }) && products.some(function (product) { return product.inventory > 0; }), "Catalog inventory should include both available and unavailable products.");
check(products.every(function (product) { return typeof product.role === "string" && product.role.length > 20 && Array.isArray(product.compatibilityChecks) && product.compatibilityChecks.length === 4; }), "Every product needs useful detail and compatibility-check fields.");
check(products.every(function (product) { return typeof product.description === "string" && product.description.length > 20; }), "Every catalog product needs a useful description.");
check(products.every(function (product) { return existsSync(join(root, product.image)); }), "Every product must have a local image file.");
check(products.every(function (product) { return product.imageReviewStatus === "reviewed"; }), "Every product image must be marked as visually reviewed.");
check(products.find(function (product) { return product.name === "PNY GeForce RTX 5060 8GB Dual Fan OC"; }), "Generic RTX 5060 entry was not resolved to an exact board model.");
check(products.find(function (product) { return product.name === "ASRock Intel Arc B580 Steel Legend 12GB OC"; }), "Generic Arc B580 entry was not resolved to an exact board model.");
check(products.find(function (product) { return product.name === "Seagate BarraCuda 4TB HDD"; }).price === 79, "Seagate demo price is mapped incorrectly.");
const shopPage = readFileSync(join(root, "shop.html"), "utf8");
check(shopPage.includes('id="product-search"') && shopPage.includes('id="category-filter"') && shopPage.includes('id="category-shortcuts"'), "Shop search or category controls are missing.");
check(shopPage.includes("300 real, exact component models") && shopPage.includes("demo estimates"), "Shop catalog size or price disclosure is missing.");
check(shopPage.includes('class="build-coverage"') && shopPage.includes('id="open-cart"') && shopPage.includes('id="open-orders"'), "Shop build coverage or ordering controls are missing.");
const requiredBuildCategories = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "CPU Cooler"];
check(requiredBuildCategories.every(function (category) { return products.some(function (product) { return product.category === category && product.inventory > 0; }); }), "The catalog cannot supply every core full-PC category.");
check(orderingScript.includes("nexora_cart_v1") && orderingScript.includes("nexora_orders_v1") && orderingScript.includes("nexora_budget_v1"), "Cart, order, or budget persistence is missing.");
check(orderingScript.includes("remainingInventory") && orderingScript.includes("cancelOrder") && orderingScript.includes("downloadReceipt") && orderingScript.includes("placeOrder"), "Ordering app is missing inventory, cancellation, receipt, or checkout logic.");
check(orderingScript.includes("checkoutForm.checkValidity()") && orderingScript.includes("summary.total > budget"), "Checkout input validation or budget enforcement is missing.");
check(chatRoute.includes("process.env.GEMINI_API_KEY") && chatRoute.includes('"x-goog-api-key"'), "Gemini route is not using the server-side API key.");
check(sharedStyles.includes("[data-site-header]") && /\[data-site-header\]\s*\{[^}]*position:\s*sticky/s.test(sharedStyles), "The shared header should remain sticky.");
check(sharedStyles.includes(".mobile-app-bar") && sharedStyles.includes(".standalone-app"), "App-like mobile navigation or standalone styling is missing.");

if (failures.length) {
  console.error("Smoke test failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Smoke test passed: Nexora is an installable PWA with standalone styling, offline app shell, mobile app navigation, 300 catalog products, ordering, accessibility, and Gemini support.");
