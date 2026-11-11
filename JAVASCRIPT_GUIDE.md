# Nexora JavaScript guide

Nexora uses twelve focused frontend JavaScript files, one service worker, and two small server-side API modules.

## What it does

`assets/js/main.js` has six jobs:

1. Insert the shared header on every page.
2. Insert the shared footer on every page.
3. Open and close the mobile navigation menu.
4. Reveal page sections as they enter the viewport.
5. Insert the app-style mobile bottom navigation.
6. Add shared install controls for the PWA.

`assets/js/assistant.js` creates the Ask Nexora drawer, stores a short conversation history in the visitor's browser, and sends questions to `/api/chat`.

`assets/js/accessibility.js` creates the accessibility panel, applies each preference to the page, and saves those preferences in `localStorage`.

`assets/js/install.js` handles the browser install prompt, iPhone/iPad instructions, installed-app state, and service-worker registration.

`assets/js/products.js` exposes the generated 300-product catalog to the browser. Each object stores the exact model, original supplied name, brand, category, tier, demo inventory, image path, product role, and compatibility checks. `scripts/build-catalog.mjs` creates this file from `data/catalog-source.json`, so the Shop never contains 300 hand-written cards.

`assets/js/pricing-data.js` overlays retailer-checked prices after the generated catalog loads. Products without a verified record receive `price: null`, so the interface displays **Check retailer** instead of a demo estimate.

`assets/js/compatibility-data.js` stores verified technical fields by product ID. Keeping this overlay separate prevents catalog rebuilds from deleting researched specifications. Empty fields stay empty instead of being guessed.

`assets/js/compatibility.js` is the pure rules engine. `evaluateBuild()` groups selected products, checks required categories, evaluates every rule with conditionals, and returns pass, fail, unknown, and missing results.

`assets/js/catalog-core.js` contains the pure search, filter, and sort logic used by the Shop and the logic tests.

`assets/js/ordering-core.js` contains pure functions for totals, customer validation, inventory commitments, duplicate fingerprints, order filtering, and admin statistics.

`assets/js/ordering.js` manages product details, cart quantities, demo inventory, customer budgets, checkout validation, totals, saved orders, status updates, the demo admin dashboard, cancellation, and receipt downloads. Cart and order data stay in the browser with `localStorage`.

`assets/js/shop.js` reads the shared catalog, builds the product cards, opens product details, adds products to the cart, and handles search, category, brand, tier, sorting, clearing filters, and loading more results.

`api/chat.js` runs on Vercel. It validates requests, applies basic rate limiting, reads the private `GEMINI_API_KEY` environment variable, and sends the question to Gemini. `api/chat-utils.js` sanitizes the catalog context and limits it to 20 products. The key never appears in the browser.

`service-worker.js` caches the app shell for offline loading. It uses network-first behavior for page navigation, cache-first behavior for same-origin assets, and skips `/api/` requests so AI answers are never stored as static files.

## Shared header

`renderHeader()` and `renderMobileAppBar()` read the current page from the body:

```html
<body data-page="home">
```

They compare that value with the Home, Shop, and About navigation records, then add `aria-current="page"` to the active desktop and mobile links. The mobile app bar stays at the bottom of smaller screens, similar to a native shopping app.

## App installation flow

1. Every page links to `manifest.webmanifest` and loads `install.js`.
2. `install.js` registers `service-worker.js` after the page finishes loading.
3. A supported browser fires `beforeinstallprompt` when Nexora meets its PWA requirements.
4. Nexora saves that event and reveals its Install buttons.
5. Clicking Install opens the browser's real installation prompt.
6. After installation, `appinstalled` hides the buttons and standalone CSS adjusts the app shell.

iOS does not provide `beforeinstallprompt`, so the same button explains how to use Safari's **Add to Home Screen** option instead.

## Shop catalog flow

1. `products.js` creates `window.NEXORA_PRODUCTS`.
2. `shop.js` reads that array and fills the category, brand, and tier controls.
3. `filteredProducts()` searches names, original names, brands, categories, tiers, and descriptions before applying the selected filters and sort order.
4. `renderProducts()` creates only the cards that should currently be visible.
5. Clicking a card calls `ordering.openProduct()` to display the detailed product dialog.
6. Clicking Add to cart calls `ordering.addToCart()` and respects the current inventory limit.
7. Load More increases the visible count without manually writing more HTML.

The category shortcut rail and the category dropdown stay synchronized. Product images use a non-cropping scale-down layout so the whole source image stays visible. Images start hidden, and a clean category placeholder remains visible unless the correct local file loads successfully, so missing files never show broken-image icons.

The card stage now has a 300-pixel media row with reduced padding and `object-fit: contain`. The product dialog uses `object-fit: scale-down`. This keeps the complete source image inside its frame. CSS cannot recreate pixels missing from an already-cropped source file, so replace that individual file when a better licensed exact-model image is available.

## Ordering flow

1. A customer opens a card to review the product role, demo inventory, retailer price evidence, and compatibility checks.
2. `addToCart()` checks the inventory limit before changing the cart.
3. `renderCart()` recalculates line totals, subtotal, demo tax, total, and the eight-part build checklist.
4. `evaluateBuild()` checks the selected parts and explains passes, failures, missing parts, and specifications that still need verification.
5. A customer can enter a budget. Checkout is disabled while the total is over that budget or any selected product lacks a verified price.
6. `placeOrder()` validates the name and email, checks inventory again, and saves the order with a unique ID.
7. Every non-cancelled order status reserves demo inventory. Cancelling restores it; completing an order keeps it committed as sold demo stock.
8. The demo admin dashboard searches orders, filters statuses, updates statuses, and calculates summary statistics.
9. A short fingerprint blocks accidental duplicate submissions.
10. The Order Center can generate a plain-text receipt for review.

The main arrays are `cart` and `orders`. Loops such as `map()`, `filter()`, and `reduce()` create the visible rows and calculate totals. Conditionals handle empty carts, unavailable inventory, invalid input, and over-budget orders. This covers the FBLA programming requirements without adding another language just to make the project look more complicated.

## Compatibility logic

The engine never assumes that “not proven incompatible” means compatible. Each rule returns a status:

- `pass` means the compared structured values match.
- `fail` means the structured values conflict.
- `unknown` means a required technical value is unavailable or the cart contains multiple choices for one core category.
- `missing` means an essential full-PC category has not been selected.

The final result becomes incompatible if any check fails, incomplete if parts are missing, or needs review if specifications are unknown. It says compatible only when every relevant check can be completed and passes.

## Shared footer

`renderFooter()` keeps the footer identical across all three pages. The current year is added with JavaScript so it stays up to date.

## Mobile navigation

`setupNavigation()` listens for clicks on the Menu button. It toggles the `.open` class on the navigation and updates `aria-expanded` for screen readers. Pressing Escape closes the menu.

## Reveal animation

`setupRevealAnimations()` uses `IntersectionObserver` to add `.visible` when an element enters the screen. If the visitor prefers reduced motion, the sections appear immediately without animation.

## Gemini assistant flow

1. A visitor opens the drawer from the floating Ask AI button.
2. `assistant.js` scores the catalog against the question and sends at most 18 relevant product records with the recent history.
3. `chat-utils.js` sanitizes the context, and `chat.js` validates the message before asking Gemini for a response.
4. The server returns only the generated reply.
5. `assistant.js` safely inserts the reply with `textContent` and saves recent messages in `localStorage`.

The assistant is told to use only the supplied Nexora products. Verified reference prices include a source and date; unavailable prices remain unavailable. Inventory is described as browser-only demo inventory. Compatibility calculations remain deterministic application logic.

## Accessibility settings flow

1. The bottom-left button opens a keyboard-friendly dialog.
2. Each control updates a small `state` object.
3. `applyState()` changes CSS classes, variables, or color-filter values on the page.
4. The state is saved under `nexora_accessibility_v1`, so it remains after a refresh.
5. Reset restores the defaults. Text to speech reads only text the visitor has selected.

The dialog traps keyboard focus while open, closes with Escape, and restores focus to the element that opened it. Simplified reading mode removes decorative imagery and motion; it does not claim to replace a real screen reader.

## Adding another page later

When the team is ready to add a new page:

1. Create the HTML file with `data-site-header`, `main-content`, and `data-site-footer` landmarks.
2. Add the versioned `style.css`, `main.js`, `assistant.js`, and `accessibility.js` references.
3. Add its navigation record inside `renderHeader()` only if it belongs in the main navigation.
4. Add only the CSS and JavaScript that page actually needs.
5. Update `tests/smoke-test.mjs` and run `npm test`.

The goal is simple: new features should not leave dead pages, broken links, or unused code behind.
