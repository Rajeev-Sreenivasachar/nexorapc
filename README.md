# Nexora

Nexora is a concept hardware parts shop created for FBLA Introduction to Programming that makes hardware decisions easier to understand.

## Current pages

- `index.html` — homepage
- `about.html` — project mission and development team

All previous store, product, cart, builder, review, support, policy, credits, and standalone AI pages remain removed. The Gemini assistant and accessibility settings are available from compact controls on both current pages.

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
│   └── js/
│       ├── main.js
│       ├── assistant.js
│       └── accessibility.js
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

The smoke test checks JavaScript syntax, required files, internal links, asset references, page titles, and the two-page-only project boundary.

## Gemini assistant

The browser sends questions to `/api/chat`. That server-side route reads `GEMINI_API_KEY` from the Vercel environment and calls Gemini without exposing the key in frontend code.

Optional environment variable:

- `GEMINI_MODEL` — overrides the default `gemini-3.8-flash` model.

The assistant provides general PC hardware guidance. It does not represent live Nexora inventory or verified prices.

## Accessibility settings

The bottom-left accessibility button opens controls for contrast, reduced motion, link underlines, text size, color filters, font choice, keyboard focus, spacing, simplified reading, cursor highlighting, and text to speech. Preferences are stored locally in the visitor's browser and can be reset from the panel.

## Deployment

The repository is connected to Vercel. Pushing to `main` triggers the production deployment at [nexorapc.vercel.app](https://nexorapc.vercel.app/).
