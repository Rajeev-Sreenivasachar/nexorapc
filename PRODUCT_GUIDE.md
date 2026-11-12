# Nexora product and price guide

Nexora keeps generated catalog data, verified price updates, compatibility facts, and images separate. That makes each type of update easier to review and prevents a catalog rebuild from deleting research.

## Add or edit a product

1. Open `data/catalog-source.json`.
2. Add or edit one product object. Keep its `id` unique and use the next unused `NX-####` value.
3. Use the exact manufacturer model name, brand, category, tier, description, inventory, and image filename.
4. Run `node scripts/build-catalog.mjs` to rebuild `assets/js/products.js` and `assets/data/products.json`.
5. Add the matching image described in `IMAGE_GUIDE.md`.
6. Run `node tests/smoke-test.mjs` and `node tests/logic-test.mjs`.

Do not manually write a product card in `shop.html`. `shop.js` generates every card from `window.NEXORA_PRODUCTS`.

## Update a verified reference price

Edit the matching record in `data/price-audit.json`. A verified record needs this shape:

```json
{
  "id": "NX-0005",
  "status": "verified_reference",
  "priceUSD": 341,
  "retailer": "Best Buy",
  "listingUrl": "https://www.bestbuy.com/product/...",
  "checkedDate": "2026-11-11",
  "availability": "listed"
}
```

Use a direct public listing from a reliable retailer or manufacturer. Confirm the exact model, capacity, generation, condition, kit count, color, and revision before recording the price. Marketplace, used, refurbished, bundle, membership, rebate, and in-store-only listings must be labeled honestly.

If the exact price cannot be confirmed, use `"status": "estimated_reference"`, enter a reasonable positive `priceUSD`, use `"retailer": "Nexora best-effort estimate"`, keep `listingUrl` as `null`, and explain the uncertainty in `note`. Estimated prices must never be described as retailer-confirmed.

Every product automatically receives Amazon and Best Buy search links. Those links help visitors compare estimates but do not count as verification by themselves. Only `verified_reference` records may name a retailer as the confirmed source.

After editing the audit, run:

```powershell
node scripts/sync-price-audit.mjs
node tests/smoke-test.mjs
node tests/logic-test.mjs
```

The sync script regenerates `assets/js/pricing-data.js`. Do not hand-edit that generated overlay.

## Update a prebuilt listing

Edit `assets/js/prebuilt-data.js`. Confirm the exact CPU, GPU, memory, storage, system name or model, price, retailer URL, and check date. Update its 1–5 task scores only when the hardware changes. Then run the logic test to confirm the finder still returns sensible in-budget choices.

## Add compatibility specifications

Add structured fields to `assets/js/compatibility-data.js` under the product ID. Include only facts confirmed for the exact model and keep an evidence URL with the record. Leave unknown fields missing instead of guessing.

The compatibility engine can use CPU socket, RAM generation, motherboard and case form factor, GPU length, cooler height and sockets, PSU wattage, CPU power, GPU power, and recommended PSU wattage.

## Inventory and order data

The `inventory` value is fictional demo inventory stored in the catalog. It exists to demonstrate limits, unavailable products, and restoration after cancellation. It must never be described as a retailer's real stock.

Cart, budget, orders, and admin status changes are saved only in the current browser with `localStorage`. Clearing site data removes them.

## Final checklist

- exact model name and unique ID
- correct category and brand
- unique local image filename
- direct retailer URL for every displayed price
- current check date
- honest availability wording
- no invented specification or missing-price fallback
- both test files pass
