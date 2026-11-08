# Nexora product images

Product images belong in `assets/images/products/`.

Every product already has a unique image filename in `assets/data/products.json` and `assets/js/products.js`. For example:

```text
assets/images/products/nx-0001.jpg
assets/images/products/nx-0040.jpg
assets/images/products/nx-0189.jpg
```

Use the exact filename stored in the product's `image` field. You do not need to edit the Shop page after adding the file.

Recommended image setup:

- PNG or WebP with a transparent or plain background
- Square canvas when possible
- At least 800 by 800 pixels
- One accurate image of the named model
- Manufacturer-approved or properly licensed source

All 300 catalog entries currently have a local reference image. `IMAGE_CREDITS.md` lists the audit image-search query used for each product. Before commercial use, confirm the original publisher and reuse rights or replace the file with a manufacturer-approved image.

To replace an image:

1. Find the product in `assets/data/products.json`.
2. Copy the exact filename from its `image` field.
3. Export the replacement as a JPG using that filename.
4. Put it in `assets/images/products/` and refresh the Shop page.
5. Update the matching credit in `IMAGE_CREDITS.md`.

If an image is missing or fails to load, Nexora automatically shows a clean category placeholder instead of a broken-image icon.
