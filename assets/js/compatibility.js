(function (global) {
  "use strict";

  const REQUIRED_CATEGORIES = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "CPU Cooler"];

  function result(id, label, status, message) {
    return { id, label, status, message };
  }

  function selectByCategory(products) {
    return products.reduce(function (groups, product) {
      if (!product || !product.category) return groups;
      if (!groups[product.category]) groups[product.category] = [];
      groups[product.category].push(product);
      return groups;
    }, {});
  }

  function specsFor(product) {
    return product ? (global.NEXORA_TECHNICAL_SPECS && global.NEXORA_TECHNICAL_SPECS[product.id]) || product.technicalSpecs || {} : {};
  }

  function pairCheck(id, label, left, right, leftKey, rightKey, compatible, successText, failureText, unknownText) {
    if (!left || !right) return null;
    const leftValue = specsFor(left)[leftKey];
    const rightValue = specsFor(right)[rightKey];
    if (leftValue === undefined || rightValue === undefined) return result(id, label, "unknown", unknownText);
    return compatible(leftValue, rightValue)
      ? result(id, label, "pass", successText(leftValue, rightValue))
      : result(id, label, "fail", failureText(leftValue, rightValue));
  }

  function estimateRequiredPsu(cpu, gpu) {
    const cpuSpecs = specsFor(cpu);
    const gpuSpecs = specsFor(gpu);
    if (!Number.isFinite(cpuSpecs.cpuPowerWatts) || !Number.isFinite(gpuSpecs.gpuPowerWatts)) return null;
    const estimatedWithHeadroom = Math.ceil(((cpuSpecs.cpuPowerWatts + gpuSpecs.gpuPowerWatts + 100) * 1.25) / 50) * 50;
    return Math.max(estimatedWithHeadroom, Number(gpuSpecs.recommendedPsuWatts) || 0);
  }

  function evaluateBuild(inputProducts) {
    const products = (Array.isArray(inputProducts) ? inputProducts : []).map(function (item) { return item && item.product ? item.product : item; }).filter(Boolean);
    const grouped = selectByCategory(products);
    const checks = [];

    REQUIRED_CATEGORIES.forEach(function (category) {
      const selected = grouped[category] || [];
      if (!selected.length) checks.push(result("missing-" + category.toLowerCase().replaceAll(" ", "-"), category, "missing", category + " is required for this full-PC checklist."));
      else if (selected.length > 1) checks.push(result("multiple-" + category.toLowerCase().replaceAll(" ", "-"), category, "unknown", "More than one " + category + " is selected. Keep one before treating this as a single build."));
    });

    const cpu = (grouped.CPU || [])[0];
    const gpu = (grouped.GPU || [])[0];
    const motherboard = (grouped.Motherboard || [])[0];
    const ram = (grouped.RAM || [])[0];
    const psu = (grouped.PSU || [])[0];
    const pcCase = (grouped.Case || [])[0];
    const cooler = (grouped["CPU Cooler"] || [])[0];

    [
      pairCheck("cpu-socket", "CPU socket", cpu, motherboard, "cpuSocket", "cpuSocket", function (a, b) { return a === b; },
        function (a) { return "CPU and motherboard both use " + a + "."; },
        function (a, b) { return "CPU uses " + a + ", but the motherboard uses " + b + "."; },
        "Socket data is missing for the CPU or motherboard."),
      pairCheck("ram-type", "Memory type", ram, motherboard, "ramType", "ramType", function (a, b) { return a === b; },
        function (a) { return "RAM and motherboard both use " + a + "."; },
        function (a, b) { return "RAM is " + a + ", but the motherboard requires " + b + "."; },
        "DDR generation data is missing for the RAM or motherboard."),
      pairCheck("case-form-factor", "Case fit", motherboard, pcCase, "formFactor", "supportedMotherboardFormFactors", function (board, supported) { return Array.isArray(supported) && supported.includes(board); },
        function (board) { return "The case supports the motherboard's " + board + " form factor."; },
        function (board, supported) { return "The " + board + " motherboard does not fit this case (supports " + supported.join(", ") + ")."; },
        "Verified motherboard or case form-factor data is missing."),
      pairCheck("gpu-clearance", "GPU clearance", gpu, pcCase, "gpuLengthMm", "maxGpuLengthMm", function (length, maximum) { return length <= maximum; },
        function (length, maximum) { return "GPU length is " + length + " mm; case limit is " + maximum + " mm."; },
        function (length, maximum) { return "GPU length is " + length + " mm, exceeding the case limit of " + maximum + " mm."; },
        "Verified GPU length or case clearance is missing."),
      pairCheck("cooler-socket", "Cooler mounting", cpu, cooler, "cpuSocket", "coolerSockets", function (socket, sockets) { return Array.isArray(sockets) && sockets.includes(socket); },
        function (socket) { return "The cooler includes mounting support for " + socket + "."; },
        function (socket) { return "The cooler's verified socket list does not include " + socket + "."; },
        "Verified CPU socket or cooler mounting data is missing."),
      pairCheck("cooler-clearance", "Cooler clearance", cooler, pcCase, "coolerHeightMm", "maxCoolerHeightMm", function (height, maximum) { return height <= maximum; },
        function (height, maximum) { return "Cooler height is " + height + " mm; case limit is " + maximum + " mm."; },
        function (height, maximum) { return "Cooler height is " + height + " mm, exceeding the case limit of " + maximum + " mm."; },
        "Verified cooler height or case clearance is missing.")
    ].filter(Boolean).forEach(function (check) { checks.push(check); });

    if (cpu && gpu && psu) {
      const requiredWatts = estimateRequiredPsu(cpu, gpu);
      const availableWatts = specsFor(psu).psuWatts;
      if (!Number.isFinite(requiredWatts) || !Number.isFinite(availableWatts)) {
        checks.push(result("power", "Power estimate", "unknown", "Verified CPU, GPU, or PSU power data is missing."));
      } else if (availableWatts >= requiredWatts) {
        checks.push(result("power", "Power estimate", "pass", "Estimated requirement is " + requiredWatts + " W; selected PSU provides " + availableWatts + " W."));
      } else {
        checks.push(result("power", "Power estimate", "fail", "Estimated requirement is " + requiredWatts + " W, but the selected PSU provides only " + availableWatts + " W."));
      }
    }

    const counts = checks.reduce(function (totals, check) { totals[check.status] += 1; return totals; }, { pass: 0, fail: 0, unknown: 0, missing: 0 });
    let status = "compatible";
    if (counts.fail) status = "incompatible";
    else if (counts.missing) status = "incomplete";
    else if (counts.unknown) status = "needs-review";
    return { status, counts, checks, requiredCategories: REQUIRED_CATEGORIES.slice(), estimatedPsuWatts: estimateRequiredPsu(cpu, gpu) };
  }

  global.NEXORA_COMPATIBILITY = { REQUIRED_CATEGORIES, evaluateBuild, estimateRequiredPsu, specsFor };
})(typeof window !== "undefined" ? window : this);
