import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = path.join(root, "data", "price-audit.json");
const catalogPath = path.join(root, "assets", "data", "products.json");
const pricingPath = path.join(root, "assets", "js", "pricing-data.js");
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const catalogById = new Map(catalog.map((product) => [product.id, product]));

const extraVerified = {
  "NX-0003": [220.00, "Best Buy", "https://www.bestbuy.com/product/amd-ryzen-5-9600x-6-core-12-thread-3-9-ghz-5-4-ghz-max-boost-socket-am5-unlocked-desktop-processor-silver/6589140", "listed"],
  "NX-0005": [341.00, "Best Buy", "https://www.bestbuy.com/product/amd-ryzen-7-9700x-8-core-16-thread-3-8-ghz-5-5-ghz-max-boost-socket-am5-pci-express-5-0-unlocked-desktop-processor-silver/6589136", "availability not confirmed"],
  "NX-0006": [326.79, "Amazon", "https://www.amazon.com/dp/B0BTZB7F88", "listed"],
  "NX-0008": [586.06, "Amazon", "https://www.amazon.com/dp/B0DVZSG8D5", "listed"],
  "NX-0012": [189.99, "Best Buy", "https://www.bestbuy.com/product/amd-ryzen-5-5600x-4th-gen-6-core-12-threads-unlocked-desktop-processor-with-wraith-stealth-cooler-black/JXKQHH4V8T", "listed"],
  "NX-0018": [184.00, "Best Buy", "https://www.bestbuy.com/product/amd-ryzen-5-7600x-6-core-12-thread-4-7ghz-5-3-ghz-max-boost-socket-am5-pci-express-5-0-unlocked-desktop-processor-silver/6519479", "listed"],
  "NX-0021": [378.00, "Best Buy", "https://www.bestbuy.com/product/amd-ryzen-9-7900x-12-core-24-thread-4-7-ghz-5-6-ghz-max-boost-socket-am5-pci-express-5-0-unlocked-desktop-processor-silver/6519473", "listed"],
  "NX-0028": [393.99, "Best Buy", "https://www.bestbuy.com/product/intel-core-i7-14700k-14th-gen-20-core-28-thread-4-3ghz-5-6ghz-turbo-socket-lga-1700-unlocked-desktop-processor-multi/JXZRJ557C2", "listed"],
  "NX-0030": [509.99, "Best Buy", "https://www.bestbuy.com/product/intel-core-ultra-9-285k-24-cores-24-threads-4-6ghz-5-7ghz-turbo-socket-lga-1851-unlocked-desktop-processor-multi/JXZRJ553QL", "listed"],
  "NX-0034": [519.99, "Best Buy Marketplace (aaawave)", "https://www.bestbuy.com/product/sapphire-pulse-radeon-rx-9060-xt-16gb-gddr6-pci-express-5-0-x16-atx-graphics-card-11350-03-20g/J39WZRL44Y", "listed"],
  "NX-0037": [449.99, "Best Buy", "https://www.bestbuy.com/product/pny-geforce-rtx-5060-overclocked-8gb-gddr7-pci-express-5-0-graphics-card-with-dual-fan-black/JXF2C4R7LJ", "listed"],
  "NX-0040": [4399.99, "Best Buy", "https://www.bestbuy.com/product/gigabyte-nvidia-geforce-rtx-5090-gaming-oc-32g-gddr7-pci-express-5-0-graphics-card-black/6615929", "sold out"],
  "NX-0059": [1249.99, "Best Buy", "https://www.bestbuy.com/product/msi-nvidia-geforce-rtx-5070-ti-16g-gaming-trio-oc-16gb-gddr7-pci-express-gen-5-graphics-card-black/J3P7TXRPQX", "listed"],
  "NX-0067": [149.99, "Best Buy", "https://www.bestbuy.com/product/gigabyte-b650-aorus-elite-ax-socket-am5-amd-b650-atx-ddr5-wi-fi-6e-motherboard-black/J3ZW92V2KF", "listed"],
  "NX-0071": [90.99, "Best Buy", "https://www.bestbuy.com/product/msi-b550m-pro-vdh-wifi-socket-am4-amd-b550-matx-ddr4-wi-fi-6-motherboard-black/6629564", "sold out"],
  "NX-0076": [127.49, "Best Buy", "https://www.bestbuy.com/product/asrock-b650m-pro-rs-wifi-am5-amd-b650-micro-atx-motherboard/C34K265LFR", "listed"],
  "NX-0077": [139.99, "Best Buy", "https://www.bestbuy.com/product/gigabyte-b650-eagle-ax-socket-am5-amd-b650-atx-ddr5-wi-fi-6e-motherboard-black/J3ZW92VHW2", "listed"],
  "NX-0087": [192.99, "Best Buy Marketplace (Newegg Official)", "https://www.bestbuy.com/product/asrock-x870-pro-rs-wifi-am5-amd-x870-atx-motherboard/C34K265WFL", "listed"],
  "NX-0129": [399.99, "Best Buy", "https://www.bestbuy.com/product/samsung-9100-pro-2tb-internal-ssd-pcie-gen-5x4-nvme-speeds-up-to-14700-mb-s/J3ZYG24547", "listed"],
  "NX-0148": [34.99, "Best Buy", "https://www.bestbuy.com/product/wd-blue-2tb-internal-sata-hard-drive-for-desktops/JXTHCJZXRT", "sold out"],
  "NX-0151": [56.49, "Best Buy", "https://www.bestbuy.com/product/msi-mag-a550bn-550w-power-supply/J3P7TXX6PT", "listed"],
  "NX-0164": [129.99, "Best Buy", "https://www.bestbuy.com/product/msi-mag-a850gl-pcie5-850w-atx-3-1-pcie-5-1-ready-full-modular-80-plus-gold-gaming-power-supply-black/J3P7TXLPW5", "listed"],
  "NX-0180": [119.99, "Best Buy", "https://www.bestbuy.com/product/thermaltake-toughpower-gf-a3-850w-80-plus-gold-pcie-gen-5-atx-3-0-ready-fully-modular-power-supply-black/6566239", "listed"],
  "NX-0182": [79.99, "Best Buy Marketplace (Newegg Official)", "https://www.bestbuy.com/product/montech-air-903-max-e-atx-mid-tower-4x-140mm-fans-tempered-glass-mesh-front-type-c-4090-support-black-black/C34KSQQR6Z", "listed"],
  "NX-0193": [159.99, "Best Buy Marketplace (Newegg Official)", "https://www.bestbuy.com/product/montech-king-95-pro-dual-chamber-atx-mid-tower-high-airflow-tempered-glass-6-argb-fans-black/C34KSQQH5H", "listed"],
  "NX-0208": [78.99, "Best Buy Marketplace (Newegg Official)", "https://www.bestbuy.com/product/lian-li-a3-matx-black-spcc-m-atx-itx-computer-case-a3-matx-x-black/J39TC2KVXW", "listed"],
  "NX-0209": [86.49, "Best Buy Marketplace (Newegg Official)", "https://www.bestbuy.com/product/phanteks-xt-pro-ultra-mid-tower-gaming-chassis-4x-m25-140-fans-mesh-tempered-glass-usb-c-3-2-gen2-black-black/J3Z8XVHP76", "listed"],
  "NX-0217": [84.99, "Best Buy Marketplace (Newegg Official)", "https://www.bestbuy.com/product/be-quiet-dark-rock-pro-5-quiet-cpu-cooler-black/CC5VXLQ3X4", "listed"],
  "NX-0229": [39.99, "Best Buy Marketplace (Focus Camera)", "https://www.bestbuy.com/product/cooler-master-masterliquid-240l-core-aio-argb-sync-amd-am5-am4-intel-lga-1851-1700-1200-white/J3K4GJPJ7F", "listed"],
  "NX-0235": [69.99, "Best Buy Marketplace (Newegg Official)", "https://www.bestbuy.com/product/be-quiet-dark-rock-5-intel-1851-1700-1200-1150-1151-1155-amd-am5-am4-silent-wings-4-cpu-cooler-bk035-black/CC5VXLQ3XR", "listed"]
};

Object.assign(extraVerified, {
  "NX-0001": [137.95, "Amazon (other sellers)", "https://www.amazon.com/dp/B09VCHR1VH", "new and used offers"],
  "NX-0007": [479.00, "Best Buy", "https://www.bestbuy.com/product/a/6606318", "listed"],
  "NX-0155": [89.99, "Best Buy", "https://www.bestbuy.com/product/corsair-rme-series-rm750e-80-plus-gold-fully-modular-low-noise-atx-3-1-and-pcie-51-power-supply-black/J39QHT23ZX", "listed"],
  "NX-0181": [69.90, "Newegg", "https://www.newegg.com/p/pl?N=100006644+100&d=air-100-argb", "backorder"],
  "NX-0214": [45.90, "Newegg", "https://www.newegg.com/Seller-Store/THERMALRIGHT-STORE", "listed"],
  "NX-0273": [249.99, "Best Buy", "https://www.bestbuy.com/product/elgato-game-capture-4k60-pro-mk-2-black/J39QHHFC94", "listed; pickup unavailable"],
  "NX-0274": [239.99, "Best Buy", "https://www.bestbuy.com/product/elgato-4k-pro-8k60-passthrough-4k60-capture-for-pc-nintendo-switch-2-ps5-xbox-series-x-with-hdmi-2-1-vrr-hdr10-black/6580838", "listed"],
  "NX-0277": [13.99, "Best Buy Marketplace", "https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=Thermal+Grizzly+Kryonaut+1g", "listed"],
  "NX-0278": [8.99, "Best Buy Marketplace (aaawave)", "https://www.bestbuy.com/product/arctic-actcp00080a-mx-6-4g-thermal-compound-paste-4-0-g/J39QKP9TKR/sku/13096113", "listed"],
  "NX-0280": [35.72, "Best Buy Marketplace", "https://www.bestbuy.com/product/nzxt-internal-usb-hub-gen-3-black/J3LQVTZJY2", "listed"],
  "NX-0282": [76.99, "Best Buy Marketplace (SpaceBound)", "https://www.bestbuy.com/product/tp-link-archer-txe72e-wifi-6e-axe5400-pcie-wifi-card-for-desktop-pc-bluetooth-5-2-wpa3-802-11axe-tri-band-black/J39QK2QLP8", "listed"],
  "NX-0286": [179.00, "Best Buy Marketplace (Focus Camera)", "https://www.bestbuy.com/product/elgato-hd60-x-1080p60-hdr10-external-capture-card-for-nintendo-switch-2-ps5-ps4-pro-xbox-pc-and-mac-black/J39QHTJ74C", "listed"],
  "NX-0287": [249.99, "Best Buy", "https://www.bestbuy.com/product/elgato-4k-x-4k144-hdr10-external-capture-card-with-hdmi-2-1-for-nintendo-switch-2-ps5-ps4-pro-xbox-pc-and-mac-black/J39QHTCY8F", "listed"],
  "NX-0288": [79.99, "Best Buy", "https://www.bestbuy.com/product/elgato-cam-link-4k-windows-macos-black/J363LW7SYX", "listed"],
  "NX-0291": [7.49, "Best Buy Marketplace (aaawave)", "https://www.bestbuy.com/product/arctic-actcp00002b-mx-4-4g-thermal-compound-4-0-g/J3TV4L6QLP", "listed"]
});

for (const product of audit.products) {
  const match = extraVerified[product.id];
  if (match) {
    product.status = "verified_reference";
    product.priceUSD = match[0];
    product.retailer = match[1];
    product.listingUrl = match[2];
    product.availability = match[3];
    product.matchedListing = product.name;
    product.note = "Reference listing price; retailer prices and availability can change.";
    continue;
  }

  const catalogProduct = catalogById.get(product.id);
  if (!catalogProduct || !Number.isFinite(catalogProduct.price)) {
    throw new Error(`Missing estimate for ${product.id}`);
  }
  product.status = "estimated_reference";
  product.priceUSD = catalogProduct.price;
  product.retailer = "Nexora best-effort estimate";
  product.listingUrl = null;
  product.availability = "reference estimate only";
  product.matchedListing = null;
  product.note = "Approximate reference price; an exact current retailer listing was not confirmed.";
}

audit.verifiedPriceCount = audit.products.filter((product) => product.status === "verified_reference").length;
audit.estimatedPriceCount = audit.products.filter((product) => product.status === "estimated_reference").length;
audit.unconfirmedPriceCount = audit.totalProducts - audit.verifiedPriceCount - audit.estimatedPriceCount;
audit.disclaimer = "Reference prices only. Verified prices link to retailer evidence; estimated prices are clearly labeled and may be inaccurate.";
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + "\n");

const priced = audit.products.filter((product) => Number.isFinite(product.priceUSD));
const entries = priced.map((product) =>
  `    ${JSON.stringify(product.id)}: { price: ${product.priceUSD.toFixed(2)}, status: ${JSON.stringify(product.status)}, retailer: ${JSON.stringify(product.retailer)}, url: ${JSON.stringify(product.listingUrl || "")}, availabilityStatus: ${JSON.stringify(product.availability)} }`
).join(",\n");

const pricing = `(function (global) {
  "use strict";

  const checkedDate = "2026-11-11";
  const priceRecords = {
${entries}
  };

  const products = Array.isArray(global.NEXORA_PRODUCTS) ? global.NEXORA_PRODUCTS : [];
  products.forEach(function (product) {
    product.originalDemoPrice = product.price;
    const record = priceRecords[product.id];
    if (!record) {
      product.priceStatus = "estimated_reference";
      product.priceSource = "Nexora best-effort estimate";
      product.priceSourceUrl = "";
      product.lastPriceChecked = checkedDate;
      product.retailAvailability = "reference estimate only";
      return;
    }
    product.price = record.price;
    product.priceStatus = record.status;
    product.priceSource = record.retailer;
    product.priceSourceUrl = record.url;
    product.lastPriceChecked = checkedDate;
    product.retailAvailability = record.availabilityStatus;
  });

  global.NEXORA_PRICE_RECORDS = priceRecords;
  global.NEXORA_VERIFIED_PRICES = Object.fromEntries(Object.entries(priceRecords).filter(function (entry) {
    return entry[1].status === "verified_reference";
  }));
})(typeof window !== "undefined" ? window : this);
`;

fs.writeFileSync(pricingPath, pricing);
console.log(`Synced ${audit.verifiedPriceCount} verified prices and ${audit.estimatedPriceCount} estimates.`);



