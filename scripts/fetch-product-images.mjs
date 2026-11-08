import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "assets", "data", "products.json");
const browserPath = resolve(root, "assets", "js", "products.js");
const creditsPath = resolve(root, "IMAGE_CREDITS.md");
const imageDirectory = resolve(root, "assets", "images", "products");
const refresh = process.argv.includes("--refresh");
const products = JSON.parse(await readFile(dataPath, "utf8"));

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      lastError = error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 400 * attempt));
    }
  }
  throw lastError;
}

async function findImage(product) {
  const query = encodeURIComponent(product.imageQuery);
  const imageUrl = `https://tse1.mm.bing.net/th?q=${query}&w=600&h=600&c=7`;
  const searchUrl = `https://www.bing.com/images/search?q=${query}`;
  const imageResponse = await fetchWithRetry(imageUrl, { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.bing.com/" } });
  const contentType = imageResponse.headers.get("content-type") || "";
  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  if (!contentType.startsWith("image/") || bytes.length < 4000) throw new Error("Exact-model query did not return a usable image");
  return { bytes, imageUrl, searchUrl };
}

await mkdir(imageDirectory, { recursive: true });
const failures = [];
let completed = 0;
let cursor = 0;

async function worker() {
  while (cursor < products.length) {
    const index = cursor;
    cursor += 1;
    const product = products[index];
    const filePath = resolve(root, product.image);
    if (!refresh && existsSync(filePath)) {
      completed += 1;
      continue;
    }
    try {
      const result = await findImage(product);
      await writeFile(filePath, result.bytes);
      product.imageSourcePage = null;
      product.imageOriginalUrl = result.imageUrl;
      product.imageSearchUrl = result.searchUrl;
      product.imageReviewStatus = "needs_visual_review";
    } catch (error) {
      failures.push(`${product.id} ${product.name}: ${error.message}`);
    }
    completed += 1;
    if (completed % 25 === 0 || completed === products.length) console.log(`Images: ${completed}/${products.length}`);
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));
await writeFile(dataPath, JSON.stringify(products, null, 2) + "\n");
await writeFile(browserPath, `(function (global) {\n  \"use strict\";\n  global.NEXORA_PRODUCTS = ${JSON.stringify(products, null, 2)};\n})(typeof window !== \"undefined\" ? window : this);\n`);

const creditLines = [
  "# Nexora product image credits",
  "",
  "These locally cached reference images were generated from exact-model public image-search queries. Nexora does not claim ownership. Each entry links to its audit query. Replace any image before production use if its original publisher or reuse rights cannot be confirmed.",
  "",
  ...products.map((product) => `- **${product.name}** — ${product.imageSearchUrl ? `[audit image search](${product.imageSearchUrl})` : "image unavailable"}`),
  ""
];
await writeFile(creditsPath, creditLines.join("\n"));

if (failures.length) {
  console.error(`Failed to fetch ${failures.length} images:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Fetched all 300 product images. Visual review is still required.");
}
