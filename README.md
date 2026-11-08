# Nexora

Nexora is a concept hardware parts shop created for FBLA Introduction to Programming that makes hardware decisions easier to understand.

## Current pages

- `index.html` — homepage
- `shop.html` — searchable catalog of 100 real component models
- `about.html` — project mission and development team

Cart, builder, review, support, policy, credits, and standalone AI pages remain removed. The Gemini assistant and accessibility settings are available from compact controls on every current page.

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

The smoke test checks JavaScript syntax, required files, internal links, asset references, page titles, and the 100-product catalog boundary.

## Product catalog

`assets/js/products.js` contains 100 real PC component model names and descriptions across 10 categories. The supplied dataset includes 69 dated retailer price observations, 31 products without a confirmed price, and four direct retailer listing links. Reference prices are not treated as Nexora selling prices. Exact SKUs, local inventory, and availability still require verification, so every item remains non-orderable. Products without an observed reference display `Price unavailable`.

Each product already has a unique image path such as `assets/images/products/amd-ryzen-5-5600.png`. The Shop page shows a clean category placeholder when that file does not exist.

## Gemini assistant

The browser sends questions to `/api/chat`. That server-side route reads `GEMINI_API_KEY` from the Vercel environment and calls Gemini without exposing the key in frontend code.

Optional environment variable:

- `GEMINI_MODEL` — overrides the default `gemini-3.8-flash` model.

The assistant provides general PC hardware guidance. It does not represent live Nexora inventory or verified prices.

## Accessibility settings

The bottom-left accessibility button opens controls for contrast, reduced motion, link underlines, text size, color filters, font choice, keyboard focus, spacing, simplified reading, cursor highlighting, and text to speech. Preferences are stored locally in the visitor's browser and can be reset from the panel.

## Deployment

The repository is connected to Vercel. Pushing to `main` triggers the production deployment at [nexorapc.vercel.app](https://nexorapc.vercel.app/).
