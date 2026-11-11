"""Native Windows shell for the Nexora web app."""

from __future__ import annotations

import os
import urllib.error
import urllib.request

import webview


APP_URL = os.environ.get("NEXORA_APP_URL", "https://nexorapc.vercel.app/")
OFFLINE_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nexora is offline</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; padding: 24px; background: #000; color: #fff; font-family: Arial, sans-serif; display: grid; place-items: center; }
    main { width: min(520px, 100%); padding: 34px; border: 1px solid #283129; border-radius: 16px; background: #0b0e0c; }
    span { color: #63e68a; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 10px 0 12px; font-size: clamp(34px, 8vw, 54px); line-height: 1; }
    p { color: #aab2ac; line-height: 1.6; }
    button { min-height: 44px; margin-top: 10px; padding: 0 18px; border: 0; border-radius: 8px; background: #63e68a; color: #041709; cursor: pointer; font-weight: 800; }
  </style>
</head>
<body>
  <main>
    <span>Nexora desktop</span>
    <h1>No connection.</h1>
    <p>The desktop app loads the current Nexora catalog, ordering tools, and Gemini assistant from the secure live site. Connect to the internet, then try again.</p>
    <button onclick="location.href='https://nexorapc.vercel.app/'">Try again</button>
  </main>
</body>
</html>
"""


def live_site_available() -> bool:
    request = urllib.request.Request(APP_URL, method="HEAD", headers={"User-Agent": "NexoraDesktop/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            return 200 <= response.status < 400
    except (urllib.error.URLError, TimeoutError, ValueError):
        return False


def main() -> None:
    window_options = {
        "title": "Nexora",
        "width": 1280,
        "height": 820,
        "min_size": (900, 620),
        "background_color": "#000000",
    }
    if live_site_available():
        webview.create_window(url=APP_URL, **window_options)
    else:
        webview.create_window(html=OFFLINE_HTML, **window_options)
    webview.start(debug=False)


if __name__ == "__main__":
    main()
