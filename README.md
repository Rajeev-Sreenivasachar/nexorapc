# Nexora

Nexora is a PC hardware ordering web app created for FBLA Introduction to Programming. Customers can browse real component models, inspect product details, manage a cart, check a budget, place a local demo order, and review or cancel that order.

## Current pages

- `index.html` — homepage
- `shop.html` — searchable catalog and digital ordering app with 300 real component models
- `about.html` — project mission and development team

The ordering experience is built directly into the Shop instead of spreading one task across several pages. The Gemini assistant and accessibility settings are available from compact controls on every current page.

## Project structure

```text
├── index.html
├── shop.html
├── about.html
├── IMAGE_GUIDE.md
├── assets/
│   ├── css/style.css
│   ├── images/
│   │   ├── favicon.svg
│   │   ├── nexora-mark.svg
│   │   ├── home/
│   │   └── products/
│   └── js/
│       ├── main.js
│       ├── assistant.js
│       ├── accessibility.js
│       ├── ordering.js
│       ├── products.js
│       └── shop.js
├── api/chat.js
├── tests/smoke-test.mjs
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

The smoke test checks JavaScript syntax, required files, internal links, asset references, page titles, the 300-product catalog boundary, demo inventory, full-PC category coverage, ordering logic, exact-model GPU replacements, and all local product images.

## Product catalog

`assets/js/products.js` contains 300 unique component models across 10 categories. The original dataset is preserved in `data/catalog-source.json`, while `scripts/build-catalog.mjs` converts it into the browser-ready catalog. Generic GPU families were replaced with exact board-partner models so the displayed names and images refer to specific products.

The supplied USD amounts and inventory counts are demo data for the ordering-system prototype. They are not verified retailer prices, live offers, or real stock claims. Deterministic inventory counts let the app demonstrate availability limits and unavailable-item handling without pretending Nexora has real inventory.

All 300 products have a local image path such as `assets/images/products/nx-0001.jpg`. Images were reviewed in ten category contact sheets. `IMAGE_CREDITS.md` keeps an audit search link for every image, and `IMAGE_GUIDE.md` explains how to replace one without changing the Shop code.

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

Cart, budget, and order data are stored only in the visitor's browser with `localStorage`. Placing an order does not collect payment, contact a business, reserve real stock, or ship anything.

## Gemini assistant

The browser sends questions to `/api/chat`. That server-side route reads `GEMINI_API_KEY` from the Vercel environment and calls Gemini without exposing the key in frontend code.

Optional environment variable:

- `GEMINI_MODEL` — overrides the default `gemini-3.8-flash` model.

The assistant provides general PC hardware guidance. It does not represent live Nexora inventory or verified prices.

## Accessibility settings

The bottom-left accessibility button opens controls for contrast, reduced motion, link underlines, text size, color filters, font choice, keyboard focus, spacing, simplified reading, cursor highlighting, and text to speech. Preferences are stored locally in the visitor's browser and can be reset from the panel.

## Deployment

The repository is connected to Vercel. Pushing to `main` triggers the production deployment at [nexorapc.vercel.app](https://nexorapc.vercel.app/).
