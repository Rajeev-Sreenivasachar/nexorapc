# Nexora

Nexora is a responsive PC planning platform, compatibility checker, upcoming storefront, and AI hardware assistant created as an FBLA Introduction to Programming project.

The store is a demonstration. It does not process payments, create orders, track live inventory, or claim that dated reference prices are guaranteed current offers.

## Main features

- Storewide Coming Soon state that hides product listings without deleting the catalog system
- Eight-part PC Builder with saved builds
- Compatibility checks for CPU socket, memory type, case fit, cooler socket, and PSU capacity
- Floating AI chat available on every page with browser-persisted conversation history
- Secure Vercel serverless function for Gemini hardware guidance
- Empty-by-default reviews with genuine on-device submissions only
- Accessible prebuilt-PC popup with an honest Coming Soon state
- Dismissible Thanksgiving promotion preview clearly labeled as inactive
- Responsive navigation, keyboard focus states, semantic labels, and reduced-motion support
- Retained product, cart, filtering, detail, and pricing code for a future inventory launch

## Project structure

```text
nexorapc/
├── index.html                # Homepage
├── shop.html                 # Store Coming Soon experience
├── product.html              # Gated product details from ?id=
├── cart.html                 # Gated persistent cart
├── builder.html              # Build planner and compatibility checks
├── reviews.html              # Genuine local feedback
├── about.html
├── support.html
├── privacy.html
├── terms.html
├── credits.html
├── api/chat.js               # Server-side Gemini request
├── api/catalog.js            # Retained compact catalog data
├── assets/css/
│   └── style.css             # Shared styles and responsive rules
├── assets/js/
│   ├── products.js           # Catalog and compatibility metadata
│   ├── compatibility.js      # Pure compatibility-checking rules
│   ├── main.js               # Shared layout, modals, cart helpers, and utilities
│   ├── assistant.js          # Floating AI chat and secure API request
│   ├── home.js
│   ├── shop.js
│   ├── product.js
│   ├── cart.js
│   ├── builder.js
│   ├── reviews.js
│   └── support.js
├── assets/images/products/   # Add exact-model product PNGs here
├── docs/FBLA_ALIGNMENT.md
├── IMAGE_GUIDE.md
├── PRODUCT_GUIDE.md
└── JAVASCRIPT_GUIDE.md
```

## Run locally

The storefront pages have no build step. From the repository root, run a static server:

```bash
npx serve .
```

Open the local URL printed in the terminal. The homepage, reviews, and builder work without the Gemini endpoint. A plain static server cannot run `api/chat.js`, so the floating assistant will clearly report that the AI service is unavailable.

### GitHub Codespaces

1. Open the repository in a Codespace.
2. Run `npx serve .` in the terminal.
3. Open the forwarded port.
4. Use `vercel dev` instead when you need to test the serverless Gemini route locally.

## Configure Gemini securely

The API key must never appear in HTML, browser JavaScript, screenshots, commits, or chat messages.

For local Vercel development, create an untracked `.env.local` file based on `.env.example`:

```text
GEMINI_API_KEY=your_key_here
```

For Vercel, add `GEMINI_API_KEY` in the project’s Environment Variables settings. `api/chat.js` reads `process.env.GEMINI_API_KEY` on the server. It validates each request, limits message and history length, applies a best-effort per-instance rate limit, and times out slow requests.

The default model is `gemini-3.8-flash`. It can be changed with the optional `GEMINI_MODEL` server environment variable after checking Google’s current official model documentation.

The API key must be added in Vercel or an untracked local environment file. Never paste it into `main.js`, HTML, a commit, or a screenshot.

## Add or update products

Public inventory is currently disabled by `INVENTORY_PUBLIC = false` in `assets/js/main.js`. Keep it disabled until listings, pricing, availability labels, cart behavior, and deployment are ready to be verified together.

Edit the `window.NEXORA_PRODUCTS` array in `assets/js/products.js`. Every product needs a unique `id`, exact model designation, source metadata, image path, specifications, and the structured compatibility fields that apply to its category. Use `price: null` when a price cannot be confirmed.

Do not guess specifications from the product name. Check the manufacturer’s official page, then update both the visible `specs` and machine-readable `compatibility` values.

Read [`PRODUCT_GUIDE.md`](PRODUCT_GUIDE.md) before changing the catalog and [`IMAGE_GUIDE.md`](IMAGE_GUIDE.md) before adding images.

## Catalog pricing method

The expanded catalog was seeded from the public `docyx/pc-part-dataset` snapshot dated July 23, 2025. Of the 185 products, 183 USD prices remain clearly labeled dated snapshots. Two SAPPHIRE GPU listings were re-checked directly on Newegg on October 18, 2026 and store the exact listing URL and model number. No value is described as a guaranteed live offer. Every product provides a source date and retailer re-check link; unverified availability is shown as “Check retailer.”

When a team member verifies an exact current retailer listing, replace the snapshot metadata with the retailer name, exact listing URL, current USD price, new check date, and `priceStatus: "verified-retailer"`. Never silently refresh only the number.

## Deploy through Vercel

1. Import the GitHub repository into Vercel.
2. Choose the **Other** framework preset.
3. Leave the build and output-directory fields empty.
4. Add `GEMINI_API_KEY` to the server-side environment variables.
5. Deploy to a preview URL and test it before promoting it to production.

This repository is not deployed automatically by these instructions.

## Team collaboration

Create a focused branch instead of editing `main` directly:

```bash
git switch main
git pull
git switch -c feature/short-description
```

Commit one understandable change at a time, push the branch, and open a pull request. Before merging, check changed JavaScript with `node --check`, test the relevant interactions in a browser, and confirm that no `.env` files or keys are staged.

## Competition and originality note

Read [`docs/FBLA_ALIGNMENT.md`](docs/FBLA_ALIGNMENT.md) before submitting. The official Florida page available during development stated that competitors must prepare the program without outside help. The team must verify the current national and Florida rules, disclose AI assistance when required, understand every submitted section, and never misrepresent authorship.

See [`JAVASCRIPT_GUIDE.md`](JAVASCRIPT_GUIDE.md) for a beginner-friendly explanation and presentation preparation.
