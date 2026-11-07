import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const requiredPages = ["index.html", "about.html"];
const removedPages = [
  "shop.html", "product.html", "cart.html", "builder.html", "reviews.html",
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
check(JSON.stringify(htmlFiles) === JSON.stringify(requiredPages.slice().sort()), "The repository root should contain only index.html and about.html.");

const javascriptDirectory = join(root, "assets", "js");
const javascriptFiles = readdirSync(javascriptDirectory).filter(function (file) { return file.endsWith(".js"); }).sort();
check(JSON.stringify(javascriptFiles) === JSON.stringify(["main.js"]), "assets/js should contain only main.js.");

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
  check(!/onclick=|onchange=|onsubmit=/.test(html), page + " contains inline JavaScript.");
  check(!/assets\/(?:css|js)\/[^"?]+\.(?:css|js)"/.test(html), page + " has an unversioned CSS or JavaScript asset.");

  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|data:)/.test(target)) continue;
    check(existsSync(join(root, target)), page + " has a missing local target: " + target);
  }
});

const allSource = requiredPages.map(function (page) { return readFileSync(join(root, page), "utf8"); }).join("\n") + readFileSync(join(javascriptDirectory, "main.js"), "utf8");
removedPages.forEach(function (page) {
  check(!allSource.includes(page), "Retained pages or shared JavaScript still link to " + page + ".");
});

const mainScript = readFileSync(join(javascriptDirectory, "main.js"), "utf8");
const sharedStyles = readFileSync(join(root, "assets", "css", "style.css"), "utf8");
check(mainScript.includes('["home", "index.html", "Home"]'), "Shared navigation is missing Home.");
check(mainScript.includes('["about", "about.html", "About Nexora"]'), "Shared navigation is missing About.");
check(sharedStyles.includes("[data-site-header]") && /\[data-site-header\]\s*\{[^}]*position:\s*sticky/s.test(sharedStyles), "The shared header should remain sticky.");

if (failures.length) {
  console.error("Smoke test failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Smoke test passed: Nexora contains only Home and About with one shared stylesheet and one shared script.");
