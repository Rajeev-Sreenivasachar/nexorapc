# Nexora

Nexora is a student-built PC technology project that makes hardware decisions easier to understand.

## Current pages

- `index.html` — homepage
- `about.html` — project mission and development team

All previous store, product, cart, builder, review, support, policy, credits, and AI pages have been removed. Their page-specific JavaScript, server routes, catalog data, and unused CSS were removed with them.

## Project structure

```text
├── index.html
├── about.html
├── assets/
│   ├── css/style.css
│   ├── images/
│   │   ├── favicon.svg
│   │   ├── nexora-mark.svg
│   │   └── home/
│   └── js/main.js
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

The smoke test checks JavaScript syntax, required files, internal links, asset references, page titles, and the two-page-only project boundary.

## Deployment

The repository is connected to Vercel. Pushing to `main` triggers the production deployment at [nexorapc.vercel.app](https://nexorapc.vercel.app/).
