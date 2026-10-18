# Nexora JavaScript Guide

This guide explains the actual JavaScript in Nexora. Read it with the files open and try changing one small thing at a time.

## 1. What JavaScript does in Nexora

HTML gives each page its structure. CSS controls how it looks. JavaScript supplies the changing behavior:

- It stores the product catalog as data.
- It creates product cards from that data.
- It searches, filters, and sorts products.
- It loads one product from the `id` in the URL.
- It saves the cart and PC builds in the browser.
- It calculates quantities, prices, estimated tax, and build totals.
- It checks a few compatibility rules.
- It validates the support form.
- It sends recommendation questions to the secure serverless function.

## 2. What each JavaScript file controls

| File | Job |
| --- | --- |
| `assets/js/products.js` | Product and category arrays, visible specifications, and compatibility metadata |
| `assets/js/compatibility.js` | Five compatibility checks written separately so they can be tested without the page |
| `assets/js/main.js` | Shared header/footer, cart helpers, money formatting, navigation, toast messages, and product-card HTML |
| `assets/js/home.js` | Homepage categories and featured products |
| `assets/js/shop.js` | Search, filters, sorting, URL parameters, and product results |
| `assets/js/product.js` | Product lookup, invalid-ID message, specifications, quantity, and related products |
| `assets/js/cart.js` | Cart rows, quantity changes, removal, subtotal, estimated tax, and total |
| `assets/js/builder.js` | Component slots, compatibility rules, power estimate, current build, and saved builds |
| `assets/js/assistant.js` | Chat interface, secure API request, product links, and the local rule-based fallback |
| `assets/js/support.js` | Contact-form validation and email-draft creation |
| `api/chat.js` | Server-only Gemini request, input validation, timeout, and basic rate limit |

The page scripts depend on `products.js` and `main.js`, so those files appear first in the `<script>` tags.

## 3. How HTML connects to JavaScript

At the bottom of `shop.html`:

```html
<script src="assets/js/products.js"></script>
<script src="assets/js/main.js"></script>
<script src="assets/js/shop.js"></script>
```

The browser loads them in that order. `products.js` creates `window.NEXORA_PRODUCTS`. `main.js` creates `window.Nexora`. Then `shop.js` can use both.

HTML IDs create specific connection points:

```html
<div class="product-grid" id="shop-products"></div>
```

```js
const productGrid = document.getElementById("shop-products");
```

## 4. How buttons trigger functions

An event listener waits for something to happen:

```js
document.getElementById("clear-filters").addEventListener("click", clearFilters);
```

This does not run `clearFilters()` immediately. It gives the browser the function and says, “run this after the button is clicked.”

Some repeated buttons use **event delegation**. `main.js` listens once on the document:

```js
document.addEventListener("click", function (event) {
  const button = event.target.closest("[data-add-cart]");
  if (button) addToCart(button.dataset.addCart, 1);
});
```

That works even when product-card buttons were added after the page loaded.

## 5. DOM manipulation

The DOM is the browser’s JavaScript representation of the HTML page.

Nexora changes it in two common ways:

```js
resultCount.textContent = products.length + " products shown";
```

`textContent` changes plain text.

```js
productGrid.innerHTML = products.map(window.Nexora.productCard).join("");
```

This turns an array of product objects into HTML cards. The catalog is controlled project data, not visitor-written HTML.

## 6. Arrays and objects

An array is an ordered list:

```js
window.NEXORA_PRODUCTS = [productOne, productTwo, productThree];
```

An object groups named values:

```js
{
  id: "amd-ryzen-5-7600",
  name: "AMD Ryzen 5 7600",
  category: "cpu",
  price: 199.99,
  compatibility: {
    socket: "AM5",
    memoryType: "DDR5",
    powerDraw: 65
  }
}
```

`product.name` reads the name. `product.compatibility.socket` reads the socket.

## 7. Search and filtering

`shop.js` uses `.filter()` to keep only matching products:

```js
let products = window.NEXORA_PRODUCTS.filter(function (product) {
  return (!query || searchText.includes(query)) &&
    (categorySelect.value === "all" || product.category === categorySelect.value) &&
    product.price <= maximumPrice;
});
```

Each product gets a `true` or `false` result. Only `true` products remain.

The `&&` operator means every condition must pass. The `||` operator allows either side to pass. For example, choosing `all` ignores that filter.

## 8. Sorting

JavaScript’s `.sort()` compares two items at a time:

```js
products.sort(function (a, b) {
  return a.price - b.price;
});
```

A negative number keeps `a` before `b`. A positive number moves `b` before `a`. Subtracting prices therefore sorts from low to high.

Names use:

```js
a.name.localeCompare(b.name)
```

## 9. Cart totals

The cart stores only product IDs and quantities:

```js
[
  { id: "amd-ryzen-5-7600", quantity: 1 },
  { id: "corsair-rm750e", quantity: 2 }
]
```

`cart.js` uses `.reduce()` to build one subtotal:

```js
const subtotal = cart.reduce(function (total, item) {
  return total + getProduct(item.id).price * item.quantity;
}, 0);
```

The `0` is the starting total. The estimated tax is `subtotal * 0.07`, and the estimated total is `subtotal + tax`.

These values do not create a real order.

## 10. `localStorage`

`localStorage` keeps text in the browser after a refresh. Arrays and objects must be converted to JSON text:

```js
localStorage.setItem("nexora_cart", JSON.stringify(cart));
```

To read it:

```js
const cart = JSON.parse(localStorage.getItem("nexora_cart"));
```

`main.js` wraps those operations in `readJson()` and `writeJson()`. `readJson()` uses `try/catch` so broken stored text does not crash the page.

## 11. Builder selections

The current build is an object where the key is a category and the value is a product ID:

```js
{
  cpu: "amd-ryzen-5-7600",
  motherboard: "msi-pro-b650-s-wifi",
  ram: "corsair-vengeance-32gb-ddr5"
}
```

Changing a `<select>` updates that object and saves it under `nexora_current_build`.

Named builds are objects inside a saved-builds array. Each has an ID, name, copy of the selected parts, and save date.

## 12. Compatibility checks

`compatibility.js` does not inspect names. It reads structured data, and `builder.js` displays the returned results.

CPU and motherboard example:

```js
if (!cpu || !motherboard) {
  status = "unknown";
} else if (cpu.compatibility.socket === motherboard.compatibility.socket) {
  status = "compatible";
} else {
  status = "incompatible";
}
```

The same pattern checks:

1. CPU socket against motherboard socket.
2. RAM type against motherboard memory type.
3. Motherboard form factor against the case’s supported list.
4. CPU socket against the cooler’s socket list.
5. Estimated component power and GPU recommendation against PSU wattage.

The power estimate starts with 100 W for unlisted system overhead, adds known component draw, and targets no more than 80% PSU load. It is an estimate, not an electrical guarantee.

## 13. `async` and `await`

Network requests take time. An `async` function can pause at `await` without freezing the entire page:

```js
const response = await fetch("/api/chat", options);
const data = await response.json();
```

The code waits for the response, then waits for the JSON body. `try/catch/finally` handles failure and always re-enables the submit button.

## 14. Secure Gemini connection

The browser sends the visitor’s question to `/api/chat`. It never receives the API key.

`api/chat.js` runs on Vercel’s server and reads:

```js
process.env.GEMINI_API_KEY
```

It validates the message and profile, creates a limited prompt, then sends a server-to-server request with the key in the `x-goog-api-key` header.

Security limits in the file:

- POST requests only
- message, budget, and allowed-option validation
- catalog snapshot instead of unrelated browser data
- eight-request-per-minute best-effort in-memory limit
- 15-second timeout
- generic errors that do not expose the key

The in-memory limit is basic. A production application would use a shared database or rate-limit service because serverless instances do not share memory.

## 15. Fixing common errors

### A page looks unstyled

Check the paths to `assets/css/style.css` and `assets/css/responsive.css`.

### `NEXORA_PRODUCTS is undefined`

Make sure `products.js` loads before the page script.

### Cart or builds disappear

Confirm the browser allows site storage and that the page is served from the same origin. Different preview ports count as different origins.

### Gemini always uses the fallback

Check that you are running through Vercel, not only a static server. Confirm `GEMINI_API_KEY` exists in the server environment. Inspect the Network panel for `/api/chat`, but never log or paste the key.

### A page shows an invalid product

Check the URL and make sure the `id` exactly matches an object in `products.js`.

### A compatibility result is wrong

Inspect the relevant object’s `compatibility` fields. Do not “fix” the result by adding a name check.

## 16. Adding a product

1. Verify the specifications using the manufacturer’s official page.
2. Add a new object to `window.NEXORA_PRODUCTS`.
3. Give it a unique lowercase ID with hyphens.
4. Use one of the existing category IDs.
5. Add visible `specs`.
6. Add only compatibility fields that are known.
7. Test the shop, product page, cart, and builder category.
8. Add or update image attribution in `credits.html`.

## 17. Creating a new feature

Use this order:

1. Describe the user action in one sentence.
2. Decide which data it needs.
3. Add the smallest useful HTML controls.
4. Write one or more focused functions.
5. Connect them with event listeners.
6. Handle empty, invalid, and failure states.
7. Test the feature without assuming the happy path.

Avoid putting unrelated code into `main.js`. Give a complicated page its own script.

# FBLA presentation preparation

## Suggested demonstration flow

1. Open the homepage and state clearly that prices and availability are demonstrations.
2. Open the shop, search for `Corsair`, filter a category, change the maximum price, and sort the results.
3. Open a product with its `id` URL and add more than one to the cart.
4. Refresh the cart to prove `localStorage` persistence, change quantity, and explain `.reduce()`.
5. Open the builder and deliberately pair an AM5 CPU with the LGA1700 motherboard.
6. Explain the incompatible socket result, then select the MSI B650 board to correct it.
7. Complete the build, explain the estimated power rule, save it, refresh, and reload it.
8. Use the assistant. Explain that the browser calls your serverless function so the Gemini key stays secret.
9. If the fallback appears, say exactly that it is a rule-based JavaScript recommendation, not AI.
10. End with the project’s limits and what you would improve next.

## Programming concepts to point out

- **Variable:** `const subtotal` stores a calculated number.
- **Conditional:** `if / else if / else` chooses a compatibility status.
- **Loop:** `.map()` turns product objects into repeated cards.
- **Array:** `NEXORA_PRODUCTS` is the shared catalog.
- **Object:** each product groups its name, price, specs, and compatibility data.
- **Function:** `renderProducts()` performs one understandable job.
- **User input:** search boxes, filters, quantities, build selections, and assistant goals.

## Common judge questions

### Why vanilla JavaScript?

It keeps the programming logic visible and understandable without hiding it behind a framework.

### Why use IDs instead of storing full products in the cart?

An ID keeps saved data small and lets the cart use the current catalog price and name.

### What happens when saved data is invalid?

`readJson()` catches parsing errors, and cart rendering removes IDs that no longer match products.

### How do you prevent the Gemini key from leaking?

The browser calls `/api/chat`. Only the serverless function reads the environment variable and contacts Google.

### Is the rate limit production-grade?

No. It is a reasonable demonstration guard but uses per-instance memory. A real system needs shared durable rate-limit storage.

### Does the compatibility checker cover everything?

No. It checks five explicit rules and reports unknown states. Physical clearances, BIOS support, headers, cables, and many other details still need manufacturer documentation.

### What would you improve next?

Verify every product against official sources, replace representative category photos with properly licensed exact-product images, add automated browser tests, and use durable server-side rate limiting.

## Originality and honesty

Do not claim you wrote or understand code that you cannot explain. The repository’s guideline review found an outdated official Florida page that says the program must be prepared by competitors without help. Ask your adviser for the current rules and AI policy before submission. If assistance is restricted, follow those rules even if that means using this version only to study and rebuilding allowed portions yourselves.
