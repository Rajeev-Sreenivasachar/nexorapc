# Nexora product image guide

Nexora keeps product image paths inside `assets/js/products.js`. Every product points to its own PNG filename inside:

```text
assets/images/products/
```

## Add an image

1. Open `assets/js/products.js`.
2. Search for the product ID or product name.
3. Find its `image` value. Example:

```javascript
image: "assets/images/products/amd-ryzen-7-9700x.png"
```

4. Rename your image to exactly match the filename at the end of that path.
5. Put the file in `assets/images/products/`.
6. Refresh the page. No HTML or JavaScript change is needed.

Use the existing filename instead of inventing a second name. Product IDs and image paths are unique.

## Recommended image format

- PNG is the expected format.
- Use a transparent or plain dark background when possible.
- Aim for a square image around 1200 × 1200 pixels.
- Keep the full component visible with some space around it.
- Optimize the file before committing it; around 500 KB or less is a useful target.
- Only use images you have permission to use. Record required attribution in `credits.html`.

## Missing images

Missing files do not show a broken-image icon. Nexora hides the failed image and displays a dark category placeholder. That means you can add images gradually without changing the catalog code.

## Replace an image

Replace the existing file while keeping the same filename. If the browser still shows the old version, hard-refresh the page to clear its cached copy.

