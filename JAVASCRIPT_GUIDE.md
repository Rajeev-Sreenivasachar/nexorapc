# Nexora JavaScript guide

Nexora uses six focused frontend JavaScript files and one server-side API route.

## What it does

`assets/js/main.js` has four jobs:

1. Insert the shared header on every page.
2. Insert the shared footer on every page.
3. Open and close the mobile navigation menu.
4. Reveal page sections as they enter the viewport.

`assets/js/assistant.js` creates the Ask Nexora drawer, stores a short conversation history in the visitor's browser, and sends questions to `/api/chat`.

`assets/js/accessibility.js` creates the accessibility panel, applies each preference to the page, and saves those preferences in `localStorage`.

`assets/js/products.js` exposes the generated 300-product catalog to the browser. Each object stores the exact model, original supplied name, brand, category, tier, demo price, demo inventory, image path, product role, and compatibility checks. `scripts/build-catalog.mjs` creates this file from `data/catalog-source.json`, so the Shop never contains 300 hand-written cards.

`assets/js/ordering.js` manages product details, cart quantities, demo inventory, customer budgets, checkout validation, totals, saved orders, cancellation, and receipt downloads. Cart and order data stay in the browser with `localStorage`.

`assets/js/shop.js` reads the shared catalog, builds the product cards, opens product details, adds products to the cart, and handles search, category, brand, tier, sorting, clearing filters, and loading more results.

`api/chat.js` runs on Vercel. It validates requests, applies basic rate limiting, reads the private `GEMINI_API_KEY` environment variable, and sends the question to Gemini. The key never appears in the browser.

## Shared header

`renderHeader()` reads the current page from the body:

```html
<body data-page="home">
```

It compares that value with the Home, Shop, and About navigation records, then adds `aria-current="page"` to the active link.

## Shop catalog flow

1. `products.js` creates `window.NEXORA_PRODUCTS`.
2. `shop.js` reads that array and fills the category, brand, and tier controls.
3. `filteredProducts()` searches names, original names, brands, categories, tiers, and descriptions before applying the selected filters and sort order.
4. `renderProducts()` creates only the cards that should currently be visible.
5. Clicking a card calls `ordering.openProduct()` to display the detailed product dialog.
6. Clicking Add to cart calls `ordering.addToCart()` and respects the current inventory limit.
7. Load More increases the visible count without manually writing more HTML.

The category shortcut rail and the category dropdown stay synchronized. Product images use `object-fit: contain`, so the whole component stays visible instead of being cropped. Images start hidden, and a clean category placeholder remains visible unless the correct local file loads successfully, so missing files never show broken-image icons.

## Ordering flow

1. A customer opens a card to review the product role, demo inventory, price, and compatibility checks.
2. `addToCart()` checks the inventory limit before changing the cart.
3. `renderCart()` recalculates line totals, subtotal, demo tax, total, and the eight-part build checklist.
4. A customer can enter a budget. Checkout is disabled while the total is over that budget.
5. `placeOrder()` validates the name and email, checks inventory again, and saves the order with a unique ID.
6. Received orders reduce the remaining demo inventory.
7. Cancelling an order changes its status and restores that inventory.
8. The Order Center can generate a plain-text receipt for review.

The main arrays are `cart` and `orders`. Loops such as `map()`, `filter()`, and `reduce()` create the visible rows and calculate totals. Conditionals handle empty carts, unavailable inventory, invalid input, and over-budget orders. This covers the FBLA programming requirements without adding another language just to make the project look more complicated.

## Shared footer

`renderFooter()` keeps the footer identical across all three pages. The current year is added with JavaScript so it stays up to date.

## Mobile navigation

`setupNavigation()` listens for clicks on the Menu button. It toggles the `.open` class on the navigation and updates `aria-expanded` for screen readers. Pressing Escape closes the menu.

## Reveal animation

`setupRevealAnimations()` uses `IntersectionObserver` to add `.visible` when an element enters the screen. If the visitor prefers reduced motion, the sections appear immediately without animation.

## Gemini assistant flow

1. A visitor opens the drawer from the floating Ask AI button.
2. `assistant.js` sends the message and recent conversation history to `/api/chat`.
3. `chat.js` validates the message and asks Gemini for a response.
4. The server returns only the generated reply.
5. `assistant.js` safely inserts the reply with `textContent` and saves recent messages in `localStorage`.

The assistant clearly separates general guidance from verified prices, inventory, and compatibility facts.

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
