# Nexora JavaScript guide

Nexora now uses one small JavaScript file: `assets/js/main.js`.

## What it does

`main.js` has four jobs:

1. Insert the shared header on both pages.
2. Insert the shared footer on both pages.
3. Open and close the mobile navigation menu.
4. Reveal page sections as they enter the viewport.

## Shared header

`renderHeader()` reads the current page from the body:

```html
<body data-page="home">
```

It compares that value with the Home and About navigation records, then adds `aria-current="page"` to the active link.

## Shared footer

`renderFooter()` keeps the footer identical across both pages. The current year is added with JavaScript so it stays up to date.

## Mobile navigation

`setupNavigation()` listens for clicks on the Menu button. It toggles the `.open` class on the navigation and updates `aria-expanded` for screen readers. Pressing Escape closes the menu.

## Reveal animation

`setupRevealAnimations()` uses `IntersectionObserver` to add `.visible` when an element enters the screen. If the visitor prefers reduced motion, the sections appear immediately without animation.

## Adding another page later

When the team is ready to add a new page:

1. Create the HTML file with `data-site-header`, `main-content`, and `data-site-footer` landmarks.
2. Add the versioned `style.css` and `main.js` references.
3. Add its navigation record inside `renderHeader()` only if it belongs in the main navigation.
4. Add only the CSS and JavaScript that page actually needs.
5. Update `tests/smoke-test.mjs` and run `npm test`.

The goal of this reset is simple: new features should not leave dead pages, broken links, or unused code behind.
