(function (global) {
  "use strict";

  const products = [];

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function findBrand(name) {
    const multiWordBrands = ["Cooler Master", "Fractal Design", "Lian Li", "Thermal Grizzly", "be quiet!"];
    return multiWordBrands.find(function (brand) { return name.startsWith(brand); }) || name.split(" ")[0];
  }

  function addProducts(category, tier, names) {
    names.forEach(function (name) {
      const id = slugify(name);
      products.push({
        id: id,
        name: name,
        brand: findBrand(name),
        model: name,
        sku: null,
        category: category,
        tier: tier,
        description: "",
        price: null,
        priceSource: null,
        priceChecked: null,
        referencePrice: null,
        referencePriceSource: null,
        referencePriceUrl: null,
        referencePriceChecked: null,
        referencePriceStatus: "needs_verification",
        inventory: null,
        availability: "unverified",
        orderable: false,
        image: "assets/images/products/" + id + ".png"
      });
    });
  }

  addProducts("CPU", "Budget", [
    "AMD Ryzen 5 5600",
    "Intel Core i5-12400F"
  ]);
  addProducts("CPU", "Midrange", [
    "AMD Ryzen 5 7600",
    "AMD Ryzen 5 9600X",
    "AMD Ryzen 7 7700X",
    "AMD Ryzen 7 9700X"
  ]);
  addProducts("CPU", "High-end", [
    "AMD Ryzen 7 7800X3D",
    "AMD Ryzen 7 9800X3D",
    "AMD Ryzen 9 9950X3D",
    "Intel Core Ultra 7 265K"
  ]);

  addProducts("GPU", "Budget", [
    "Intel Arc A580 8GB",
    "Intel Arc B580 12GB",
    "AMD Radeon RX 7600 8GB"
  ]);
  addProducts("GPU", "Midrange", [
    "AMD Radeon RX 9060 XT 16GB",
    "AMD Radeon RX 9070 16GB",
    "NVIDIA GeForce RTX 5060 8GB",
    "NVIDIA GeForce RTX 5060 Ti 16GB"
  ]);
  addProducts("GPU", "High-end", [
    "AMD Radeon RX 9070 XT 16GB",
    "NVIDIA GeForce RTX 5080 16GB",
    "NVIDIA GeForce RTX 5090 32GB"
  ]);

  addProducts("Motherboard", "Budget", [
    "MSI B550-A PRO",
    "ASUS PRIME B550M-A WiFi II",
    "Gigabyte B650M DS3H"
  ]);
  addProducts("Motherboard", "Midrange", [
    "MSI PRO B650M-A WiFi",
    "MSI B650 Gaming Plus WiFi",
    "ASUS TUF Gaming B650-PLUS WiFi",
    "Gigabyte B650 AORUS Elite AX"
  ]);
  addProducts("Motherboard", "High-end", [
    "MSI MAG X870 Tomahawk WiFi",
    "ASUS ROG Strix X870E-E Gaming WiFi",
    "ASUS ROG Crosshair X870E Hero"
  ]);

  addProducts("RAM", "Budget", [
    "Corsair Vengeance LPX DDR4 16GB 3200MHz",
    "Kingston FURY Beast DDR4 16GB 3200MHz",
    "G.Skill Ripjaws V DDR4 32GB 3600MHz"
  ]);
  addProducts("RAM", "Midrange", [
    "Crucial Pro DDR5 32GB 5600MHz",
    "Kingston FURY Beast DDR5 32GB 6000MT/s",
    "Corsair Vengeance DDR5 32GB 6000MHz",
    "G.Skill Flare X5 DDR5 32GB 6000MT/s"
  ]);
  addProducts("RAM", "High-end", [
    "G.Skill Trident Z5 RGB DDR5 32GB 6400MT/s",
    "Corsair Dominator Titanium DDR5 64GB 6000MT/s",
    "Kingston FURY Renegade DDR5 64GB 6400MT/s"
  ]);

  addProducts("Storage", "Budget", [
    "Kingston NV2 1TB NVMe",
    "Crucial P3 Plus 1TB NVMe",
    "WD Blue SN580 1TB NVMe",
    "Seagate BarraCuda 4TB HDD"
  ]);
  addProducts("Storage", "Midrange", [
    "Samsung 990 EVO Plus 1TB",
    "WD Black SN770 2TB",
    "Crucial T500 2TB"
  ]);
  addProducts("Storage", "High-end", [
    "WD Black SN850X 2TB",
    "Samsung 990 PRO 2TB",
    "Samsung 9100 PRO 2TB"
  ]);

  addProducts("PSU", "Budget", [
    "MSI MAG A550BN 550W",
    "MSI MAG A650BN 650W",
    "Corsair CX650 650W",
    "Cooler Master MWE Bronze V2 650W"
  ]);
  addProducts("PSU", "Midrange", [
    "Corsair RM750e 750W",
    "MSI MAG A750GL PCIE5 750W",
    "Corsair RM850e 850W",
    "be quiet! Pure Power 12 M 850W"
  ]);
  addProducts("PSU", "High-end", [
    "Seasonic FOCUS GX-1000",
    "Corsair HX1500i 1500W"
  ]);

  addProducts("Case", "Budget", [
    "Montech AIR 100 ARGB",
    "Montech AIR 903 MAX",
    "DeepCool CH370",
    "Corsair 3000D Airflow"
  ]);
  addProducts("Case", "Midrange", [
    "NZXT H5 Flow",
    "Fractal Design Pop Air",
    "Corsair 4000D Airflow",
    "NZXT H7 Flow (2024)"
  ]);
  addProducts("Case", "High-end", [
    "Lian Li O11 Dynamic EVO RGB",
    "Fractal Design North XL"
  ]);

  addProducts("CPU Cooler", "Budget", [
    "Thermalright Assassin X 120 Refined SE",
    "DeepCool AG400",
    "Cooler Master Hyper 212 Black"
  ]);
  addProducts("CPU Cooler", "Midrange", [
    "Thermalright Peerless Assassin 120 SE",
    "Thermalright Phantom Spirit 120 SE",
    "Noctua NH-U12S redux"
  ]);
  addProducts("CPU Cooler", "High-end", [
    "be quiet! Dark Rock Pro 5",
    "Noctua NH-D15 G2",
    "Arctic Liquid Freezer III 360",
    "Corsair iCUE H150i Elite Capellix XT"
  ]);

  addProducts("Case Fan", "Budget", [
    "Arctic P12 PWM PST",
    "Arctic P14 PWM PST",
    "Thermalright TL-C12C-S",
    "be quiet! Pure Wings 3 120mm"
  ]);
  addProducts("Case Fan", "Midrange", [
    "Corsair AF120 Elite",
    "Noctua NF-P12 redux-1700 PWM",
    "Arctic P12 Max"
  ]);
  addProducts("Case Fan", "High-end", [
    "Lian Li UNI FAN SL-INF 120",
    "Noctua NF-A12x25 PWM",
    "Corsair iCUE LINK QX120 RGB"
  ]);

  addProducts("Additional Hardware", "Budget", [
    "TP-Link Archer TX3000E",
    "ASUS Xonar SE",
    "Thermal Grizzly Kryonaut 1g",
    "Arctic MX-6 4g",
    "NZXT Internal USB Hub (Gen 3)"
  ]);
  addProducts("Additional Hardware", "Midrange", [
    "ASUS PCE-AXE58BT",
    "Creative Sound Blaster AE-5 Plus",
    "Corsair Commander Core XT"
  ]);
  addProducts("Additional Hardware", "High-end", [
    "Elgato Game Capture 4K60 Pro MK.2",
    "Elgato 4K Pro"
  ]);

  function addDetails(category, details) {
    products.filter(function (product) { return product.category === category; }).forEach(function (product, index) {
      const detail = details[index];
      if (!detail) return;
      product.description = detail[0];
      product.referencePrice = detail[1];
      product.referencePriceSource = detail[2] || null;
      product.referencePriceUrl = detail[3] || null;
      product.referencePriceChecked = detail[1] === null ? null : "2026-11-07";
      product.referencePriceStatus = detail[1] === null ? "needs_verification" : (detail[3] ? "linked_listing" : "observed_unverified");
    });
  }

  addDetails("CPU", [
    ["6-core AM4 processor for affordable gaming and everyday computing.", 147.80, "BasketPrice"],
    ["6-core LGA1700 CPU for budget PCs; requires a separate GPU.", 149.99, "Build Redux"],
    ["6-core AM5 processor with DDR5 support and integrated graphics.", null],
    ["Zen 5, 6-core processor for modern gaming builds.", 179, "Amazon"],
    ["8-core processor suitable for gaming, streaming, and multitasking.", 229, "BasketPrice"],
    ["Efficient 8-core Zen 5 CPU for gaming and productivity.", 335, "BasketPrice"],
    ["8-core gaming processor with AMD 3D V-Cache.", 375, "Amazon"],
    ["High-performance gaming CPU with upgraded 3D V-Cache.", 444, "Amazon"],
    ["16-core processor for demanding gaming and creative workloads.", 639.99, "MBPC"],
    ["20-core LGA1851 CPU for demanding desktop workloads.", 289, "Walmart"]
  ]);

  addDetails("GPU", [
    ["Entry-level discrete graphics card for 1080p gaming.", 249, "Newegg — GUNNIR"],
    ["Modern Intel gaming GPU with 12GB GDDR6 memory.", 329.99, "Newegg — ASRock"],
    ["RDNA 3 GPU designed for mainstream 1080p gaming.", 599, "Newegg — ASRock"],
    ["RDNA 4 card with 16GB memory for modern gaming.", 650, "Micro Center — ASRock"],
    ["High-performance RDNA 4 GPU suited to 1440p gaming.", 750, "PC Tech Vault"],
    ["Blackwell-generation GPU with DLSS support.", 449, "Walmart — PNY"],
    ["NVIDIA gaming GPU with 16GB GDDR7 memory.", 770, "B&H Photo — PNY"],
    ["Faster RDNA 4 GPU for demanding gaming workloads.", 920, "Amazon — PowerColor"],
    ["High-end GPU for demanding games and creative applications.", 2000, "Best Buy — PNY"],
    ["Flagship GPU for enthusiast gaming and heavy GPU workloads.", 6550, "Newegg — Gigabyte"]
  ]);

  addDetails("Motherboard", [
    ["ATX motherboard with AM4 socket and DDR4 support.", 119.99, "MSI Store — out of stock"],
    ["Micro-ATX AM4 board with integrated Wi-Fi 6.", 172.94, "Macy's"],
    ["Micro-ATX AM5 board with DDR5 and M.2 slots.", 211.45, "Newegg"],
    ["AM5 micro-ATX motherboard with wireless connectivity.", null],
    ["ATX AM5 board with DDR5 and Wi-Fi 6E.", 119.99, "Newegg", "https://www.newegg.com/msi-b650-gaming-plus-wifi-atx-motherboard-amd-b650-am5/p/N82E16813144628"],
    ["Durable AM5 gaming motherboard with DDR5 support.", null],
    ["AM5 gaming board with advanced power delivery.", 223.99, "Newegg"],
    ["Modern AM5 board with PCIe 5.0 and fast connectivity.", 259.99, "B&H Photo"],
    ["Enthusiast AM5 board with Wi-Fi 7 and extensive expansion.", 351.99, "Newegg"],
    ["Premium AM5 motherboard for high-end Ryzen systems.", 569.99, "Newegg"]
  ]);

  addDetails("RAM", [
    ["Low-profile DDR4 memory for older and affordable PCs; observed listing is 1×16GB.", 157.99, "Corsair"],
    ["DDR4 kit with a low-profile heat spreader.", null],
    ["32GB memory for DDR4 gaming and multitasking systems.", 290.80, "ZOZOZON"],
    ["DDR5 memory for compatible modern desktops; observed listing is a single module.", 499.99, "Walmart — Platinum Micro"],
    ["High-speed DDR5 kit for gaming and productivity.", 709.99, "Newegg"],
    ["32GB DDR5 memory for performance-focused systems.", 586.99, "Newegg"],
    ["Low-profile DDR5 kit with AMD EXPO support.", 539.99, "Newegg"],
    ["Fast RGB-equipped DDR5 memory for enthusiast builds.", 1099.99, "Newegg"],
    ["Premium, large-capacity RGB memory for demanding PCs.", null],
    ["High-capacity DDR5 for memory-intensive systems.", null]
  ]);

  addDetails("Storage", [
    ["Entry-level PCIe 4.0 NVMe SSD for operating systems, files, and games.", 178, "Walmart — Platinum Micro"],
    ["PCIe 4.0 SSD for affordable storage upgrades.", null],
    ["Efficient NVMe SSD with up to 4,150MB/s sequential reads.", 62, "Walmart"],
    ["Mechanical SATA hard drive for bulk file storage.", 159.99, "Micro Center"],
    ["Fast NVMe SSD for gaming and productivity.", 234, "Newegg"],
    ["High-capacity PCIe 4.0 gaming SSD.", null],
    ["Performance-focused PCIe 4.0 NVMe storage.", null],
    ["High-performance gaming SSD; observed listing includes a heatsink.", 420, "Newegg"],
    ["High-end PCIe 4.0 SSD; observed listing includes a heatsink.", 669.99, "Walmart"],
    ["PCIe 5.0 SSD for high-speed workstation storage.", 399.99, "Newegg", "https://www.newegg.com/p/0D9-0009-00CX3"]
  ]);

  addDetails("PSU", [
    ["Entry-level 80 PLUS Bronze PSU for lower-power systems.", 49.99, "Newegg"],
    ["650W Bronze power supply for mainstream desktop builds.", 58.99, "Newegg"],
    ["Reliable 650W Bronze-rated power supply.", 87.25, "TeciSoft"],
    ["650W power supply with Bronze efficiency certification.", null],
    ["Fully modular 750W PSU with modern GPU power support; observed listing is the 2025 model.", 89.99, "Newegg"],
    ["Fully modular Gold-rated PSU with modern PCIe power connections.", 89.93, "Newegg", "https://www.newegg.com/msi-atx12v-750-w-80-plus-gold-certified-power-supplies-black-mag-a750gl-pcie5/p/N82E16817701022"],
    ["Gold-efficiency modular PSU for performance builds.", 114.97, "B&H Photo"],
    ["Quiet, modular Gold-rated PSU for gaming systems.", null],
    ["1000W modular Gold power supply for demanding configurations; observed listing is V4.", 199.99, "Micro Center"],
    ["Premium high-wattage PSU for power-hungry systems.", null]
  ]);

  addDetails("Case", [
    ["Compact micro-ATX case with mesh airflow and four RGB fans.", 69.99, "Newegg"],
    ["Airflow-focused ATX case with spacious component support.", null],
    ["Compact micro-ATX case for clean, minimal builds.", null],
    ["ATX mid-tower with mesh ventilation and included fans; observed listing is white.", 124.35, "Newegg"],
    ["Modern ATX case with mesh panels and improved airflow; observed listing is the 2024 black model.", 69.99, "Newegg", "https://www.newegg.com/nzxt-atx-mid-tower-h5-flow-sgcc-steel-dark-tinted-tempered-glass-case-black-cc-h52fb-01/p/N82E16811146365"],
    ["ATX case with front mesh and included cooling fans.", 86.99, "Newegg"],
    ["Popular ATX case with mesh front and cable-management features; observed listing is white.", 104.99, "Newegg"],
    ["Spacious ATX mid-tower for powerful cooling configurations; observed listing is white.", 69.99, "Newegg"],
    ["Showcase-style case with extensive cooling options and RGB lighting; observed listing is white.", 169.99, "Newegg"],
    ["Large, wood-accented case for premium builds.", null]
  ]);

  addDetails("CPU Cooler", [
    ["Affordable single-tower air cooler with four heat pipes.", 24.99, "Altex Computers & Electronics"],
    ["Single-tower air cooler for mainstream CPUs.", null],
    ["Tower cooler with 120mm PWM fan and copper heat pipes.", 29.99, "Newegg"],
    ["Dual-tower CPU cooler designed for strong air-cooling performance.", 47.90, "Newegg"],
    ["Dual-tower air cooler with seven heat pipes.", 47.68, "Walmart — GIIZHMY"],
    ["Quiet, single-tower 120mm CPU cooler.", null],
    ["Premium dual-tower air cooler designed for low-noise operation.", 79.90, "Newegg"],
    ["Premium dual-tower CPU cooler for high-end processors.", null],
    ["360mm all-in-one liquid cooler for compatible cases.", null],
    ["360mm liquid cooler with RGB fans and software controls.", 219.99, "Corsair"]
  ]);

  addDetails("Case Fan", [
    ["120mm pressure-optimized fan with daisy-chain PWM control.", null],
    ["140mm fan designed for quiet airflow and static pressure.", 24.77, "Newegg"],
    ["120mm RGB case fan with adjustable PWM speed; observed listing is a 3-pack.", 14.99, "Micro Center"],
    ["Quiet, airflow-focused case fan.", null],
    ["120mm PWM fan for case ventilation and cooling.", null],
    ["120mm performance fan with a 1,700 RPM maximum speed.", 21.92, "Newegg"],
    ["High-speed 120mm fan for demanding cooling needs.", null],
    ["Modular RGB fan with infinity-mirror styling.", null],
    ["Premium 120mm fan designed for strong, quiet performance.", 42, "Newegg"],
    ["Premium RGB fan supporting Corsair's LINK ecosystem.", null]
  ]);

  addDetails("Additional Hardware", [
    ["PCIe Wi-Fi 6 adapter with Bluetooth and external antennas.", null],
    ["PCIe sound card with multichannel audio output.", null],
    ["Premium thermal paste for transferring heat from CPUs to coolers.", 13.99, "Newegg"],
    ["Thermal compound for CPU and GPU cooling applications.", null],
    ["Internal hub that expands motherboard USB 2.0 connectivity.", 29.99, "Newegg"],
    ["PCIe Wi-Fi 6E adapter for desktop wireless connectivity.", null],
    ["PCIe sound card for upgraded desktop audio.", null],
    ["Controller for case fans and compatible RGB lighting.", 59.99, "Corsair"],
    ["Internal PCIe capture card supporting 4K60 video recording.", null],
    ["Internal HDMI 2.1 capture card with 4K60 capture and 8K passthrough.", 239.99, "B&H Photo"]
  ]);

  global.NEXORA_PRODUCTS = Object.freeze(products.map(function (product) { return Object.freeze(product); }));
})(typeof window !== "undefined" ? window : globalThis);
