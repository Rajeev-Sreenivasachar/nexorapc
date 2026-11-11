# Nexora for Windows

`Nexora.exe` opens the secure live Nexora web app in its own desktop window.

## Requirements

- Windows 10 or Windows 11
- Internet access for the current catalog, ordering app, and Gemini assistant
- Microsoft Edge WebView2 Runtime, which is included with current Windows versions

## Start

1. Extract `Nexora-Windows.zip`.
2. Double-click `Nexora.exe`.

The executable contains no Gemini API key. AI requests still use Nexora's server-side `/api/chat` route. Because the app is an unsigned student build, Windows may show a publisher warning.

## Build from source

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File desktop\build-windows.ps1
```

The script creates `desktop/release/Nexora.exe` and `desktop/release/Nexora-Windows.zip`.
