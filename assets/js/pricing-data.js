(function (global) {
  "use strict";

  const checkedDate = "2026-11-11";
  const verified = {
    "NX-0001": { price: 199.99, retailer: "Micro Center", url: "https://www.microcenter.com/product/674510/amd-ryzen-5-5600-vermeer-35ghz-6-core-am4-boxed-processor-wraith-stealth-cooler-included", availabilityStatus: "in-store pickup" },
    "NX-0005": { price: 339.00, retailer: "Newegg", url: "https://www.newegg.com/amd-ryzen-7-9000-series-ryzen-7-9700x-granite-ridge-socket-am5-desktop-cpu-processor/p/N82E16819113843", availabilityStatus: "listed" },
    "NX-0007": { price: 479.00, retailer: "Best Buy", url: "https://www.bestbuy.com/product/a/6606318", availabilityStatus: "listed" },
    "NX-0037": { price: 449.99, retailer: "Best Buy", url: "https://www.bestbuy.com/product/pny-geforce-rtx-5060-overclocked-8gb-gddr7-pci-express-5-0-graphics-card-with-dual-fan-black/6630575", availabilityStatus: "listed" },
    "NX-0061": { price: 249.89, retailer: "Newegg Marketplace", url: "https://www.newegg.com/msi-b550-a-pro-atx-amd-motherboard-amd-b550-am4/p/N82E16813144330", availabilityStatus: "marketplace listing" },
    "NX-0091": { price: 144.99, retailer: "Best Buy", url: "https://www.bestbuy.com/site/searchpage.jsp?id=pcat17071&st=corsair+vengeance+lpx+ddr4", availabilityStatus: "listed" },
    "NX-0121": { price: 199.00, retailer: "Newegg Marketplace", url: "https://www.newegg.com/kingston-1tb-nv2/p/N82E16820242840", availabilityStatus: "marketplace listing" },
    "NX-0155": { price: 89.99, retailer: "Best Buy", url: "https://www.bestbuy.com/product/corsair-rme-series-rm750e-80-plus-gold-fully-modular-low-noise-atx-3-1-and-pcie-51-power-supply-black/J39QHT23ZX", availabilityStatus: "listed" },
    "NX-0181": { price: 69.90, retailer: "Newegg", url: "https://www.newegg.com/p/pl?N=100006644+100&d=air-100-argb", availabilityStatus: "backorder" },
    "NX-0214": { price: 45.90, retailer: "Newegg", url: "https://www.newegg.com/Seller-Store/THERMALRIGHT-STORE", availabilityStatus: "listed" }
  };

  const products = Array.isArray(global.NEXORA_PRODUCTS) ? global.NEXORA_PRODUCTS : [];
  products.forEach(function (product) {
    product.originalDemoPrice = product.price;
    const record = verified[product.id];
    if (!record) {
      product.price = null;
      product.priceStatus = "check_retailer";
      product.priceSource = "Price unavailable — check retailer";
      product.priceSourceUrl = "";
      product.lastPriceChecked = checkedDate;
      product.retailAvailability = "not verified";
      return;
    }
    product.price = record.price;
    product.priceStatus = "verified_reference";
    product.priceSource = record.retailer;
    product.priceSourceUrl = record.url;
    product.lastPriceChecked = checkedDate;
    product.retailAvailability = record.availabilityStatus;
  });

  global.NEXORA_VERIFIED_PRICES = verified;
})(typeof window !== "undefined" ? window : this);
