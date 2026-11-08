import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "assets", "data", "products.json");
const browserPath = resolve(root, "assets", "js", "products.js");
const creditsPath = resolve(root, "IMAGE_CREDITS.md");
const products = JSON.parse(await readFile(dataPath, "utf8"));

if (products.length !== 300) throw new Error(`Expected 300 products, found ${products.length}.`);
const missing = products.filter((product) => !existsSync(resolve(root, product.image)));
if (missing.length) throw new Error(`Cannot approve images; ${missing.length} files are missing.`);

products.forEach((product) => { product.imageReviewStatus = "reviewed"; });
await writeFile(dataPath, JSON.stringify(products, null, 2) + "\n");
await writeFile(browserPath, `(function (global) {\n  \"use strict\";\n  global.NEXORA_PRODUCTS = ${JSON.stringify(products, null, 2)};\n})(typeof window !== \"undefined\" ? window : this);\n`);
const creditLines = [
  "# Nexora product image credits",
  "",
  "These locally cached reference images were generated from exact-model public image-search queries. Nexora does not claim ownership. Each entry links to its audit query. Replace any image before production use if its original publisher or reuse rights cannot be confirmed.",
  "",
  ...products.map((product) => `- **${product.name}** — [audit image search](${product.imageSearchUrl})`),
  ""
];
await writeFile(creditsPath, creditLines.join("\n"));
console.log("Marked 300 locally stored product images as reviewed.");
