import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "data", "catalog-source.json");
const outputPath = resolve(root, "assets", "data", "products.json");
const browserPath = resolve(root, "assets", "js", "products.js");

const exactGpuModels = new Map(Object.entries({
  "Intel Arc A580 8GB": "ASRock Intel Arc A580 Challenger 8GB OC",
  "Intel Arc B580 12GB": "ASRock Intel Arc B580 Steel Legend 12GB OC",
  "AMD Radeon RX 7600 8GB": "Sapphire PULSE AMD Radeon RX 7600 8GB",
  "AMD Radeon RX 9060 XT 16GB": "Sapphire PULSE AMD Radeon RX 9060 XT 16GB",
  "AMD Radeon RX 9070 16GB": "Sapphire PULSE AMD Radeon RX 9070 16GB",
  "AMD Radeon RX 9070 XT 16GB": "Sapphire PULSE AMD Radeon RX 9070 XT 16GB",
  "NVIDIA GeForce RTX 5060 8GB": "PNY GeForce RTX 5060 8GB Dual Fan OC",
  "NVIDIA GeForce RTX 5060 Ti 16GB": "MSI GeForce RTX 5060 Ti 16G VENTUS 2X OC PLUS",
  "NVIDIA GeForce RTX 5080 16GB": "ASUS TUF Gaming GeForce RTX 5080 16GB GDDR7 OC Edition",
  "NVIDIA GeForce RTX 5090 32GB": "GIGABYTE GeForce RTX 5090 GAMING OC 32G",
  "Intel Arc A750 8GB": "ASRock Intel Arc A750 Challenger D 8GB OC",
  "Intel Arc A770 16GB": "ASRock Intel Arc A770 Phantom Gaming 16GB OC",
  "Intel Arc B570 10GB": "ASRock Intel Arc B570 Challenger 10GB OC",
  "AMD Radeon RX 6600 8GB": "XFX Speedster SWFT 210 AMD Radeon RX 6600 CORE 8GB",
  "AMD Radeon RX 6650 XT 8GB": "XFX Speedster MERC 308 AMD Radeon RX 6650 XT Black 8GB",
  "AMD Radeon RX 6700 XT 12GB": "XFX Speedster SWFT 309 AMD Radeon RX 6700 XT CORE 12GB",
  "AMD Radeon RX 6750 XT 12GB": "XFX Speedster QICK 319 AMD Radeon RX 6750 XT CORE 12GB",
  "AMD Radeon RX 6800 16GB": "XFX Speedster SWFT 319 AMD Radeon RX 6800 CORE 16GB",
  "AMD Radeon RX 7800 XT 16GB": "Sapphire PULSE AMD Radeon RX 7800 XT 16GB",
  "AMD Radeon RX 7900 GRE 16GB": "Sapphire PULSE AMD Radeon RX 7900 GRE 16GB",
  "AMD Radeon RX 7900 XT 20GB": "Sapphire PULSE AMD Radeon RX 7900 XT 20GB",
  "AMD Radeon RX 7900 XTX 24GB": "Sapphire PULSE AMD Radeon RX 7900 XTX 24GB",
  "NVIDIA GeForce RTX 4060 8GB": "ASUS Dual GeForce RTX 4060 OC Edition 8GB",
  "NVIDIA GeForce RTX 4060 Ti 16GB": "GIGABYTE GeForce RTX 4060 Ti GAMING OC 16G",
  "NVIDIA GeForce RTX 4070 SUPER 12GB": "ASUS Dual GeForce RTX 4070 SUPER EVO OC Edition 12GB",
  "NVIDIA GeForce RTX 4070 Ti SUPER 16GB": "MSI GeForce RTX 4070 Ti SUPER 16G VENTUS 3X OC",
  "NVIDIA GeForce RTX 4080 SUPER 16GB": "GIGABYTE GeForce RTX 4080 SUPER GAMING OC 16G",
  "NVIDIA GeForce RTX 5070 12GB": "ASUS TUF Gaming GeForce RTX 5070 12GB GDDR7 OC Edition",
  "NVIDIA GeForce RTX 5070 Ti 16GB": "MSI GeForce RTX 5070 Ti 16G GAMING TRIO OC",
  "AMD Radeon RX 7600 XT 16GB": "Sapphire PULSE AMD Radeon RX 7600 XT 16GB"
}));

const imageQueryOverrides = new Map(Object.entries({
  "Intel Core i5-12400F": "Intel Core i5-12400F desktop processor retail box CPU product photo",
  "ASRock Intel Arc B570 Challenger 10GB OC": "ASRock Arc B570 Challenger 10GB OC graphics card product photo",
  "Thermalright Frozen Notte 240": "Thermalright Frozen Notte 240 ARGB AIO liquid CPU cooler product photo"
}));

const brandPrefixes = [
  "Thermal Grizzly", "Fractal Design", "Cooler Master", "Silicon Power",
  "be quiet!", "G.Skill", "TEAMGROUP", "Thermaltake", "SilverStone",
  "Creative", "DeepCool", "Thermalright", "Seasonic", "Sapphire",
  "GIGABYTE", "Gigabyte", "Kingston", "Corsair", "Noctua", "Phanteks",
  "Montech", "Crucial", "Samsung", "Sabrent", "Patriot", "Arctic",
  "Elgato", "ASRock", "ASUS", "Intel", "NVIDIA", "AMD", "MSI", "NZXT",
  "Lian Li", "TP-Link", "EVGA", "XFX", "PNY", "WD"
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function brandFor(name) {
  return brandPrefixes.find((prefix) => name.toLowerCase().startsWith(prefix.toLowerCase())) || name.split(" ")[0];
}

function tierFor(price, prices) {
  const sorted = prices.slice().sort((a, b) => a - b);
  const firstCutoff = sorted[Math.ceil(sorted.length / 3) - 1];
  const secondCutoff = sorted[Math.ceil(sorted.length * 2 / 3) - 1];
  if (price <= firstCutoff) return "Budget";
  if (price <= secondCutoff) return "Midrange";
  return "Premium";
}

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const products = [];

for (const [sourceCategory, group] of Object.entries(source.categories)) {
  const category = sourceCategory === "Accessory" ? "Accessories" : sourceCategory;
  const categoryPrices = group.products.map((product) => product[1]);
  group.products.forEach(([originalName, price]) => {
    const name = exactGpuModels.get(originalName) || originalName;
    const imageQuery = imageQueryOverrides.get(name) || `\"${name}\" ${category} PC hardware product photo`;
    const encodedImageQuery = encodeURIComponent(imageQuery);
    const id = `NX-${String(products.length + 1).padStart(4, "0")}`;
    const imageFile = `${id.toLowerCase()}.jpg`;
    products.push({
      id,
      slug: slugify(name),
      name,
      originalName,
      brand: brandFor(name),
      model: name,
      category,
      tier: tierFor(price, categoryPrices),
      description: group.description,
      price,
      currency: source.currency,
      priceStatus: "demo_estimate",
      priceSource: "Nexora demo estimate — not a verified retailer price",
      inventory: null,
      availability: "catalog_only",
      orderable: false,
      image: `assets/images/products/${imageFile}`,
      imageQuery,
      imageSourcePage: null,
      imageOriginalUrl: `https://tse1.mm.bing.net/th?q=${encodedImageQuery}&w=600&h=600&c=7`,
      imageSearchUrl: `https://www.bing.com/images/search?q=${encodedImageQuery}`,
      imageReviewStatus: "pending"
    });
  });
}

if (products.length !== 300) throw new Error(`Expected 300 products, found ${products.length}.`);
if (new Set(products.map((product) => product.name)).size !== 300) throw new Error("Product names must be unique.");
if (new Set(products.map((product) => product.id)).size !== 300) throw new Error("Product IDs must be unique.");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(products, null, 2) + "\n");
await writeFile(browserPath, `(function (global) {\n  \"use strict\";\n  global.NEXORA_PRODUCTS = ${JSON.stringify(products, null, 2)};\n})(typeof window !== \"undefined\" ? window : this);\n`);

console.log(`Built ${products.length} products across ${new Set(products.map((product) => product.category)).size} categories.`);
console.log(`Resolved ${exactGpuModels.size} generic GPU families to exact board-partner models.`);
