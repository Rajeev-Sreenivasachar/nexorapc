# Nexora product data guide

The shared catalog lives in `assets/js/products.js`. The shop, homepage, product page, cart, and PC builder all read the same `window.NEXORA_PRODUCTS` array.

## Product shape

```javascript
{
  id: "amd-ryzen-7-9700x",
  name: "AMD Ryzen 7 9700X",
  brand: "AMD",
  modelNumber: "Ryzen 7 9700X",
  category: "cpu",
  price: 305.89,
  priceSource: "PCPartPicker public dataset snapshot",
  priceSourceUrl: "https://example.com/source",
  listingUrl: "https://example.com/current-listing",
  priceChecked: "2025-07-23",
  availability: "Check retailer",
  priceStatus: "dated-snapshot",
  featured: false,
  description: "Short factual description.",
  image: "assets/images/products/amd-ryzen-7-9700x.png",
  imageAlt: "AMD Ryzen 7 9700X product image",
  specs: {
    "Socket": "AM5",
    "TDP": "65 W"
  },
  compatibility: {
    socket: "AM5",
    memoryType: "DDR5",
    powerDraw: 65
  }
}
```

## Add a product

1. Verify the exact model and important specifications on a manufacturer page or reliable retailer.
2. Verify the USD price on a public listing. Do not copy a crossed-out price when a lower current price is displayed.
3. Add a unique lowercase `id` using words separated by hyphens.
4. Use one of the existing category IDs: `cpu`, `gpu`, `motherboard`, `ram`, `storage`, `psu`, `case`, or `cooling`.
5. Add the source name, source URL, listing URL, and ISO date (`YYYY-MM-DD`).
6. If the price cannot be verified, use `price: null` and `priceStatus: "unavailable"`.
7. Add compatibility fields only when they are verified. Missing data should produce an “unable to verify” result, not a guess.
8. Give the product a unique image path that matches its ID.
9. Add the same compact product record to `api/catalog.js` so Gemini can recommend it.
10. Run `node tests/smoke-test.mjs`.

## Update a price

Change these fields together:

```javascript
price: 199.99,
priceSource: "Newegg",
priceSourceUrl: "https://www.newegg.com/...",
listingUrl: "https://www.newegg.com/...",
priceChecked: "2026-10-18",
priceStatus: "verified-retailer"
```

Then make the same price and date change in `api/catalog.js`. Never label an old snapshot as a live price.

## Compatibility fields

- CPU: `socket`, `memoryType`, `powerDraw`
- GPU: `powerDraw`, `recommendedPsu`
- Motherboard: `socket`, `memoryType`, `formFactor`, `powerDraw`
- RAM: `memoryType`, `powerDraw`
- Storage: `powerDraw`
- PSU: `wattage`
- Case: `caseSupport`
- Cooler: `coolerSockets`, `powerDraw`

Use an empty `coolerSockets` array when mounting support was not confirmed. The builder will show a warning instead of claiming compatibility.

