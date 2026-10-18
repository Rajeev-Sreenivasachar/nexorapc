# Nexora

Nexora is a responsive PC component catalog, cart, build planner, compatibility checker, and recommendation assistant created as an FBLA Introduction to Programming project.

The store is a demonstration. It does not process payments, create orders, track live inventory, or claim current market prices.

## Main features

- Search, category, brand, maximum-price, and sorting controls
- Reusable product pages driven by an `id` URL parameter
- Persistent cart with quantity controls and calculated estimates
- Eight-part PC Builder with saved builds
- Compatibility checks for CPU socket, memory type, case fit, cooler socket, and PSU capacity
- Secure Vercel serverless function for Gemini recommendations
- Clearly labeled local rule-based recommendations when Gemini is unavailable
- Responsive navigation, keyboard focus states, semantic labels, and reduced-motion support

## Project structure

```text
nexorapc/
├── index.html                # Homepage
├── shop.html                 # Searchable catalog
├── product.html              # Product details from ?id=
├── cart.html                 # Persistent cart
├── builder.html              # Build planner and compatibility checks
├── assistant.html            # Recommendation interface
├── about.html
├── support.html
├── privacy.html
├── terms.html
├── credits.html
├── api/chat.js               # Server-side Gemini request
├── assets/css/
│   ├── style.css
│   └── responsive.css
├── assets/js/
│   ├── products.js           # Catalog and compatibility metadata
│   ├── compatibility.js      # Pure compatibility-checking rules
│   ├── main.js               # Shared layout, cart helpers, and utilities
│   ├── home.js
│   ├── shop.js
│   ├── product.js
│   ├── cart.js
│   ├── builder.js
│   ├── assistant.js
│   └── support.js
├── docs/FBLA_ALIGNMENT.md
└── JAVASCRIPT_GUIDE.md
```

## Run locally

The storefront pages have no build step. From the repository root, run a static server:

```bash
npx serve .
```

Open the local URL printed in the terminal. The catalog, cart, and builder work without the Gemini endpoint. A plain static server cannot run `api/chat.js`, so the assistant will use its clearly labeled local fallback.

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

For Vercel, add `GEMINI_API_KEY` in the project’s Environment Variables settings. `api/chat.js` reads `process.env.GEMINI_API_KEY` on the server. It validates the request, limits message length, applies a best-effort per-instance rate limit, times out slow requests, and sends only the recommendation profile plus a small catalog snapshot.

The default model is `gemini-2.5-flash`. It can be changed with the optional `GEMINI_MODEL` server environment variable after checking Google’s current official model documentation.

## Add or update products

Edit the `window.NEXORA_PRODUCTS` array in `assets/js/products.js`. Every product needs a unique `id`, display information, a demonstration price, specifications, and the structured compatibility fields that apply to its category.

Do not guess specifications from the product name. Check the manufacturer’s official page, then update both the visible `specs` and machine-readable `compatibility` values.

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
