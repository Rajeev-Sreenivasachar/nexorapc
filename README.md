# Nexora

Nexora is an installable PC hardware ordering web app created for FBLA Introduction to Programming. Customers can browse real component models, inspect product details, manage a cart, check a budget, place a local demo order, and review or cancel that order. A Python desktop shell can also package the live app as a Windows executable.

## Current pages

- `index.html` — homepage
- `shop.html` — searchable catalog and digital ordering app with 300 real component models
- `prebuilt.html` — six-question PC finder using researched prebuilt listings and deterministic matching rules
- `about.html` — project mission and development team

The ordering experience is built directly into the Shop instead of spreading one task across several pages. The Gemini assistant and accessibility settings are available from compact controls on every current page.

## Project structure

```text
├── index.html
├── shop.html
├── prebuilt.html
├── about.html
├── manifest.webmanifest
├── service-worker.js
├── desktop/
│   ├── nexora_desktop.py
│   ├── build-windows.ps1
│   ├── requirements.txt
│   └── README.md
├── IMAGE_GUIDE.md
├── assets/
│   ├── css/style.css
│   ├── images/
│   │   ├── favicon.svg
│   │   ├── nexora-mark.svg
│   │   ├── app-icon-192.png
│   │   ├── app-icon-512.png
│   │   ├── home/
│   │   └── products/
│   └── js/
│       ├── main.js
│       ├── assistant.js
│       ├── accessibility.js
│       ├── install.js
│       ├── pricing-data.js
│       ├── compatibility-data.js
│       ├── compatibility.js
│       ├── catalog-core.js
│       ├── ordering-core.js
│       ├── ordering.js
│       ├── prebuilt-data.js
│       ├── prebuilt-core.js
│       ├── prebuilt.js
│       ├── products.js
│       └── shop.js
├── api/
│   ├── chat.js
│   └── chat-utils.js
├── tests/
│   ├── smoke-test.mjs
│   └── logic-test.mjs
├── package.json
└── vercel.json
```

## Run locally

Use any static web server from the repository root. For example, if Python is installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Test

```bash
npm test
```

The smoke test checks JavaScript syntax, required files, internal links, asset references, the PWA manifest, service worker, app icons, page titles, the 300-product catalog boundary, demo inventory, full-PC category coverage, exact-model GPU replacements, and all local product images. The logic test executes pricing overlays, filters, totals, invalid and valid customer data, inventory commitment, admin filtering, order statistics, AI context sanitization, and compatibility scenarios.

## Installable app

Nexora is a Progressive Web App (PWA). On a supported browser, use **Install app** in the desktop header or **Install** in the mobile bottom navigation. The installed version opens in its own standalone window and keeps Nexora's black-and-green app interface.

The service worker caches the three main pages and essential local assets. Previously opened same-origin product images are cached as they are requested. Gemini questions still require a network connection because `/api/chat` is intentionally never cached.

Local installation testing requires a web server at `localhost`; opening the HTML files directly with `file://` cannot register a service worker. Production installation requires HTTPS, which Vercel provides.

## Windows download

Nexora also includes a small Python and PyWebView desktop shell. It opens the secure production app in a dedicated Windows window, while Gemini requests continue through the server-side Vercel route. No API key is bundled into the executable.

Build it with:

```powershell
powershell -ExecutionPolicy Bypass -File desktop\build-windows.ps1
```

The build produces:

- `desktop/release/Nexora.exe`
- `desktop/release/Nexora-Windows.zip`

The build output is ignored by Git so large generated binaries do not bloat the repository. Publish the zip as a GitHub Release asset when a public download is needed. The student build is unsigned, so Windows may show a publisher warning.

## Languages

- HTML structures the three web pages.
- CSS creates the responsive black-and-green interface.
- JavaScript powers the catalog, ordering, accessibility, Gemini interface, and PWA.
- Python provides the native Windows desktop shell and executable build.

Each language has a specific job. More languages should only be added when they solve a real project need.

## Product catalog

`assets/js/products.js` contains 300 unique component models across 10 categories. The original dataset is preserved in `data/catalog-source.json`, while `scripts/build-catalog.mjs` converts it into the browser-ready catalog. Generic GPU families were replaced with exact board-partner models so the displayed names and images refer to specific products.

`assets/js/pricing-data.js` replaces the generated catalog amounts at runtime. All 300 products have a usable reference price: 45 retailer-checked prices dated November 11, 2026 and 255 clearly labeled best-effort estimates. Every product also includes Amazon and Best Buy search links so visitors can compare the estimate before buying.

Reference prices are not guaranteed live offers. The product dialog shows the retailer, listing link, check date, and observed availability. Inventory counts remain deterministic demo data used only to demonstrate availability limits; Nexora does not claim retailer stock or ownership of the products. See `PRODUCT_GUIDE.md` for the update process.

All 300 products have a local image path such as `assets/images/products/nx-0001.jpg`. Images were reviewed in ten category contact sheets. `IMAGE_CREDITS.md` keeps an audit search link for every image, and `IMAGE_GUIDE.md` explains how to replace one without changing the Shop code.

## Compatibility engine

`assets/js/compatibility-data.js` stores structured compatibility specifications separately from the generated catalog. Every stored fact is tied either to the exact model name or to linked manufacturer documentation. Missing dimensions and socket lists remain missing; the app does not fill them with guesses.

`assets/js/compatibility.js` evaluates eight core build categories and returns one of four outcomes:

- **Compatible** — all available checks passed and no required information is missing.
- **Incompatible** — at least one verified rule failed.
- **Incomplete** — one or more core components are missing.
- **Needs review** — no conflict was proven, but a specification is missing or more than one core part was selected.

The engine checks CPU sockets, DDR generation, motherboard/case form factor, GPU clearance, CPU-cooler mounting and height, and estimated PSU capacity. The power estimate uses verified CPU and GPU wattage, adds 100 W for the remaining system, adds 25% headroom, rounds upward to 50 W, and never runs when required power data is missing. Compatibility results appear in the cart and product specifications appear in the details dialog.

## Digital ordering app

The Shop includes:

- search, category, brand, tier, sort, and Load More controls
- product detail dialogs opened from each card
- a persistent cart with quantity and inventory limits
- an eight-category full-PC checklist
- subtotal, 7.5% demo tax, and total calculations
- an optional customer budget that blocks over-budget orders
- validated customer name, email, and fulfillment fields
- saved local orders, cancellation, inventory restoration, and text receipts
- a browser-only demo admin dashboard with order search, status filtering, status updates, and summary counts
- duplicate-submission protection and clearly labeled estimated totals
- a Thanksgiving prototype promotion that subtracts $15 per priced cart item before demo tax

Cart, budget, and order data are stored only in the visitor's browser with `localStorage`. Placing an order does not collect payment, contact a business, reserve real stock, or ship anything.

## Price audit

All 300 catalog entries were reviewed on November 11, 2026 using exact-name public listing searches that prioritized Amazon and Best Buy. The current audit contains **45 source-backed reference prices** and **255 best-effort estimates**. Estimates are used when the exact SKU or variant could not be matched confidently and are never presented as retailer-confirmed prices.

The complete result is stored in `data/price-audit.json`. Each record includes its status, check date, price, source wording, listing URL when verified, and availability wording. RAM kits and several fan/case variants especially need fuller SKUs because capacity, speed, timings, kit count, color, and revision can change the actual product and price.

Run `node scripts/sync-price-audit.mjs` after editing verified records in the audit so `assets/js/pricing-data.js` stays in sync. Prices are reference snapshots, not live guarantees.

## Prebuilt PC finder

The PC Finder asks about intended use, game titles, coding intensity, gaming resolution, budget, and the customer's main priority. `prebuilt-core.js` scores seven dated Best Buy listings with plain JavaScript rules and returns up to three matches inside the selected budget. If no listing fits, it clearly labels the closest option above budget.

The prebuilt prices are reference listings, not Nexora inventory or guaranteed offers. Every result links back to the retailer and displays its check date.

## Gemini assistant

The browser sends questions to `/api/chat`. That server-side route reads `GEMINI_API_KEY` from the Vercel environment and calls Gemini without exposing the key in frontend code.

Optional environment variable:

- `GEMINI_MODEL` — overrides the default `gemini-3.8-flash` model.

The browser selects a small set of relevant products from the real Nexora catalog and sends only their IDs, names, prices, price status, inventory, and structured specifications. The server sanitizes that context before Gemini sees it. Gemini is instructed to recommend only supplied catalog products, treat app data as authoritative, describe inventory as demo inventory, and say **Check retailer** when a price is unavailable.

AI answers still require human review. Deterministic pricing, inventory, and compatibility calculations happen in the application instead of being delegated to Gemini.

## Accessibility settings

The bottom-left accessibility button opens controls for contrast, reduced motion, link underlines, text size, color filters, font choice, keyboard focus, spacing, simplified reading, cursor highlighting, and text to speech. Preferences are stored locally in the visitor's browser and can be reset from the panel.

## Deployment

The repository is connected to Vercel. Pushing to `main` triggers the production deployment at [nexorapc.vercel.app](https://nexorapc.vercel.app/).
