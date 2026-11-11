export function sanitizeCatalogContext(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).flatMap(function (item) {
    if (!item || typeof item !== "object") return [];
    const text = function (input, limit) { return typeof input === "string" ? input.trim().slice(0, limit) : ""; };
    const price = typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 ? item.price : null;
    const inventory = Number.isInteger(item.inventory) && item.inventory >= 0 ? Math.min(item.inventory, 9999) : null;
    const technicalSpecs = item.technicalSpecs && typeof item.technicalSpecs === "object"
      ? Object.fromEntries(Object.entries(item.technicalSpecs).filter(function (entry) { return !["evidence"].includes(entry[0]) && ["string", "number", "boolean"].includes(typeof entry[1]); }).slice(0, 12))
      : {};
    return [{
      id: text(item.id, 30), name: text(item.name, 120), brand: text(item.brand, 50), category: text(item.category, 40),
      price: price, priceStatus: text(item.priceStatus, 30), priceSource: text(item.priceSource, 80),
      lastPriceChecked: text(item.lastPriceChecked, 20), inventory: inventory,
      retailAvailability: text(item.retailAvailability, 60), technicalSpecs: technicalSpecs
    }];
  }).filter(function (item) { return item.id && item.name; });
}

export function catalogPrompt(context) {
  if (!context.length) return "No matching Nexora catalog records were supplied for this question.";
  return "NEXORA CATALOG CONTEXT (deterministic application data; use only these products):\n" + JSON.stringify(context);
}
