(function (global) {
  "use strict";

  const specs = {};

  function add(ids, values, evidence) {
    ids.forEach(function (id) {
      specs[id] = Object.assign({}, specs[id] || {}, values, {
        evidence: Array.from(new Set([].concat(specs[id] && specs[id].evidence || [], evidence || [])))
      });
    });
  }

  const amdAm4Source = "https://www.amd.com/en/products/processors/chipsets/am4.html";
  const amdRyzenSource = "https://www.amd.com/en/products/processors/desktops/ryzen.html";
  const intelLga1700Source = "https://www.intel.com/content/www/us/en/support/articles/000088143/processors/intel-core-processors.html";
  const intelCoreUltraSource = "https://www.intel.com/content/www/us/en/products/details/processors/core-ultra.html";

  add(["NX-0001", "NX-0011", "NX-0012", "NX-0013", "NX-0014", "NX-0015", "NX-0016"],
    { cpuSocket: "AM4" }, [{ label: "AMD Socket AM4 platform", url: amdAm4Source }]);
  add(["NX-0002", "NX-0003", "NX-0004", "NX-0005", "NX-0006", "NX-0007", "NX-0008", "NX-0017", "NX-0018", "NX-0019", "NX-0020", "NX-0021", "NX-0022", "NX-0023", "NX-0024"],
    { cpuSocket: "AM5" }, [{ label: "AMD Ryzen desktop processors", url: amdRyzenSource }]);
  add(["NX-0009", "NX-0025", "NX-0026", "NX-0027", "NX-0028"],
    { cpuSocket: "LGA1700" }, [{ label: "Intel desktop processor compatibility", url: intelLga1700Source }]);
  add(["NX-0010", "NX-0029", "NX-0030"],
    { cpuSocket: "LGA1851" }, [{ label: "Intel Core Ultra desktop processors", url: intelCoreUltraSource }]);

  add(["NX-0001"], { cpuPowerWatts: 65 }, [{
    label: "AMD Ryzen 5 5600 specifications",
    url: "https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/amd-ryzen-5-5600.html"
  }]);
  add(["NX-0009"], { cpuPowerWatts: 65 }, [{
    label: "Intel Core i5-12400F specifications",
    url: "https://www.intel.com/content/www/us/en/products/sku/134587/intel-core-i512400f-processor-18m-cache-up-to-4-40-ghz/specifications.html"
  }]);

  const am4Boards = ["NX-0061", "NX-0062", "NX-0071", "NX-0072", "NX-0073", "NX-0074", "NX-0075"];
  const am5Boards = ["NX-0063", "NX-0064", "NX-0065", "NX-0066", "NX-0067", "NX-0068", "NX-0069", "NX-0070", "NX-0076", "NX-0077", "NX-0078", "NX-0079", "NX-0080", "NX-0081", "NX-0082", "NX-0083", "NX-0084", "NX-0085", "NX-0086", "NX-0087"];
  add(am4Boards, { cpuSocket: "AM4", ramType: "DDR4" }, [{ label: "AMD Socket AM4 platform", url: amdAm4Source }]);
  add(am5Boards, { cpuSocket: "AM5", ramType: "DDR5" }, [{ label: "AMD Ryzen desktop platform", url: amdRyzenSource }]);
  add(["NX-0088", "NX-0089"], { cpuSocket: "LGA1700", ramType: "DDR5" }, [{ label: "Intel LGA1700 platform", url: intelLga1700Source }]);
  add(["NX-0090"], { cpuSocket: "LGA1851", ramType: "DDR5" }, [{ label: "Intel Core Ultra desktop platform", url: intelCoreUltraSource }]);

  add(["NX-0062", "NX-0063", "NX-0064", "NX-0071", "NX-0072", "NX-0075", "NX-0076"], { formFactor: "Micro-ATX" });
  add(["NX-0061", "NX-0065", "NX-0066", "NX-0067", "NX-0068", "NX-0069", "NX-0070", "NX-0073", "NX-0074", "NX-0077", "NX-0078", "NX-0079", "NX-0080", "NX-0081", "NX-0082", "NX-0083", "NX-0084", "NX-0085", "NX-0086", "NX-0087", "NX-0088", "NX-0089", "NX-0090"], { formFactor: "ATX" });
  add(["NX-0061"], {}, [{ label: "MSI B550-A PRO specifications", url: "https://www.msi.com/Motherboard/B550-A-PRO/Specification" }]);
  add(["NX-0089"], {}, [{ label: "ASUS PRIME Z790-P WiFi specifications", url: "https://www.asus.com/motherboards-components/motherboards/prime/prime-z790-p-wifi/techspec/" }]);

  add(["NX-0091", "NX-0092", "NX-0093", "NX-0101", "NX-0102", "NX-0103", "NX-0104", "NX-0105", "NX-0106", "NX-0107", "NX-0108", "NX-0109", "NX-0110"], { ramType: "DDR4" });
  add(["NX-0094", "NX-0095", "NX-0096", "NX-0097", "NX-0098", "NX-0099", "NX-0100", "NX-0111", "NX-0112", "NX-0113", "NX-0114", "NX-0115", "NX-0116", "NX-0117", "NX-0118", "NX-0119", "NX-0120"], { ramType: "DDR5" });

  const psuWatts = [550, 650, 650, 650, 750, 750, 850, 850, 1000, 1500, 550, 750, 750, 850, 650, 750, 850, 1000, 1000, 1000, 750, 850, 1200, 1000, 600, 750, 850, 750, 1000, 850];
  psuWatts.forEach(function (watts, index) {
    add(["NX-" + String(151 + index).padStart(4, "0")], { psuWatts: watts });
  });
  add(["NX-0155"], {}, [{ label: "Corsair RM750e specifications", url: "https://www.corsair.com/us/en/explorer/diy-builder/power-supply-units/corsair-rme-series/" }]);

  add(["NX-0033"], { gpuLengthMm: 240, gpuPowerWatts: 185, recommendedPsuWatts: 550 }, [{
    label: "Sapphire PULSE RX 7600 specifications",
    url: "https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-7600-8g-gddr6"
  }]);
  add(["NX-0181"], {
    supportedMotherboardFormFactors: ["Micro-ATX", "Mini-ITX"],
    maxGpuLengthMm: 330,
    maxCoolerHeightMm: 161
  }, [{ label: "Montech AIR 100 ARGB specifications", url: "https://www.montechpc.com/air-100-ARGB" }]);
  add(["NX-0214"], {
    coolerSockets: ["AM4", "AM5", "LGA115X", "LGA1200", "LGA1700", "LGA1851"],
    coolerHeightMm: 155
  }, [{ label: "Thermalright Peerless Assassin 120 SE specifications", url: "https://www.thermalright.com/product/peerless-assassin-120-se/" }]);

  Object.keys(specs).forEach(function (id) {
    specs[id].lastVerified = "2026-11-11";
  });

  global.NEXORA_TECHNICAL_SPECS = specs;
})(typeof window !== "undefined" ? window : this);
