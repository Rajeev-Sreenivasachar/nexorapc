(function () {
  "use strict";

  function productFor(build, category) {
    return window.NEXORA_PRODUCTS.find(function (product) {
      return product.id === build[category];
    });
  }

  function addCheck(checks, status, message) {
    checks.push({ status: status, message: message });
  }

  function checkBuild(build) {
    const cpu = productFor(build, "cpu");
    const motherboard = productFor(build, "motherboard");
    const memory = productFor(build, "ram");
    const computerCase = productFor(build, "case");
    const cooler = productFor(build, "cooling");
    const gpu = productFor(build, "gpu");
    const psu = productFor(build, "psu");
    const checks = [];

    if (!cpu || !motherboard) {
      addCheck(checks, "unknown", "CPU socket: unable to verify until a CPU and motherboard are selected.");
    } else if (cpu.compatibility.socket === motherboard.compatibility.socket) {
      addCheck(checks, "compatible", "CPU socket: compatible — both use " + cpu.compatibility.socket + ".");
    } else {
      addCheck(checks, "incompatible", "CPU socket: incompatible — " + cpu.compatibility.socket + " CPU vs. " + motherboard.compatibility.socket + " motherboard.");
    }

    if (!memory || !motherboard) {
      addCheck(checks, "unknown", "Memory type: unable to verify until RAM and a motherboard are selected.");
    } else if (memory.compatibility.memoryType === motherboard.compatibility.memoryType) {
      addCheck(checks, "compatible", "Memory type: compatible — both use " + memory.compatibility.memoryType + ".");
    } else {
      addCheck(checks, "incompatible", "Memory type: incompatible — the selected RAM and motherboard use different standards.");
    }

    if (!motherboard || !computerCase) {
      addCheck(checks, "unknown", "Case fit: unable to verify until a motherboard and case are selected.");
    } else if (computerCase.compatibility.caseSupport.includes(motherboard.compatibility.formFactor)) {
      addCheck(checks, "compatible", "Case fit: compatible — the case supports " + motherboard.compatibility.formFactor + ".");
    } else {
      addCheck(checks, "incompatible", "Case fit: incompatible — the case does not list " + motherboard.compatibility.formFactor + " support.");
    }

    if (!cpu || !cooler) {
      addCheck(checks, "unknown", "Cooler socket: unable to verify until a CPU and cooler are selected.");
    } else if (!Array.isArray(cooler.compatibility.coolerSockets) || cooler.compatibility.coolerSockets.length === 0) {
      addCheck(checks, "unknown", "Cooler socket: mounting-kit support was not verified in the catalog. Check the manufacturer page for " + cpu.compatibility.socket + " support.");
    } else if (cooler.compatibility.coolerSockets.includes(cpu.compatibility.socket)) {
      addCheck(checks, "compatible", "Cooler socket: compatible — the cooler lists " + cpu.compatibility.socket + " support.");
    } else {
      addCheck(checks, "incompatible", "Cooler socket: incompatible with the selected CPU socket.");
    }

    const selected = Object.values(build).map(function (productId) {
      return window.NEXORA_PRODUCTS.find(function (product) { return product.id === productId; });
    }).filter(Boolean);
    const estimatedDraw = selected.reduce(function (total, product) {
      return total + (Number(product.compatibility.powerDraw) || 0);
    }, 100);
    const recommendedByLoad = Math.ceil((estimatedDraw / 0.8) / 50) * 50;
    const requiredPsu = Math.max(recommendedByLoad, gpu ? Number(gpu.compatibility.recommendedPsu) || 0 : 0);

    if (!psu) {
      addCheck(checks, "unknown", "Power supply: unable to verify until a PSU is selected.");
    } else if (psu.compatibility.wattage >= requiredPsu) {
      addCheck(checks, "compatible", "Power supply: compatible — " + psu.compatibility.wattage + " W meets the estimated " + requiredPsu + " W recommendation.");
    } else {
      addCheck(checks, "incompatible", "Power supply: choose at least " + requiredPsu + " W for the selected parts and headroom.");
    }

    return { checks: checks, estimatedDraw: estimatedDraw, requiredPsu: requiredPsu };
  }

  window.NexoraCompatibility = { checkBuild: checkBuild };
})();
