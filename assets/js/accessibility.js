(function () {
  "use strict";

  const STORAGE_KEY = "nexora_accessibility_v1";
  const systemPrefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const defaults = {
    highContrast: false,
    reducedMotion: Boolean(systemPrefersReducedMotion),
    underlineLinks: false,
    invertColors: false,
    textScale: 100,
    colorblindMode: "none",
    colorblindStrength: 50,
    grayscale: 0,
    saturation: 100,
    contrast: 100,
    fontFamily: "default",
    highlightCursor: false,
    screenReader: false,
    enhancedFocus: false,
    letterSpacing: 0,
    lineHeight: 1.5
  };

  const deficiencyMatrices = {
    protanopia: [0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0],
    deuteranopia: [0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0],
    tritanopia: [0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0]
  };
  const identityMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return Object.assign({}, defaults, saved && typeof saved === "object" ? saved : {});
    } catch (error) {
      return Object.assign({}, defaults);
    }
  }

  let state = loadState();
  let lastFocusedElement = null;
  let closeTimer = 0;

  const root = document.createElement("div");
  root.className = "a11y-root";
  root.innerHTML = `
    <svg class="a11y-filter-definitions" aria-hidden="true" width="0" height="0">
      <filter id="nexora-colorblind-filter" color-interpolation-filters="sRGB">
        <feColorMatrix id="nexora-colorblind-matrix" type="matrix" values="${identityMatrix.join(" ")}"></feColorMatrix>
      </filter>
    </svg>
    <button class="a11y-launcher" id="a11y-launcher" type="button" aria-label="Open accessibility settings" aria-controls="a11y-panel" aria-expanded="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2"></circle><path d="M5 8.5h14M12 6v6m0 0-4 8m4-8 4 8M8 11l-2 5m10-5 2 5"></path></svg>
    </button>
    <div class="a11y-backdrop" id="a11y-backdrop" hidden></div>
    <section class="a11y-panel" id="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-title" hidden>
      <header class="a11y-panel-header">
        <div><span>Site preferences</span><h2 id="a11y-title">Accessibility</h2></div>
        <button type="button" class="a11y-close" id="a11y-close">Close</button>
      </header>
      <div class="a11y-panel-scroll">
        <div class="a11y-setting-list">
          ${toggleRow("highContrast", "High contrast")}
          ${toggleRow("reducedMotion", "Reduced motion")}
          ${toggleRow("underlineLinks", "Underline links")}
          ${toggleRow("invertColors", "Invert colors")}
          ${rangeRow("textScale", "Text scale", 80, 150, 5, "%")}
          ${selectRow("colorblindMode", "Colorblind mode", [["none", "None"], ["protanopia", "Protanopia"], ["deuteranopia", "Deuteranopia"], ["tritanopia", "Tritanopia"]])}
          ${rangeRow("colorblindStrength", "Colorblind strength", 0, 100, 5, "%")}
          ${rangeRow("grayscale", "Grayscale", 0, 100, 5, "%")}
          ${rangeRow("saturation", "Saturation", 0, 200, 5, "%")}
          ${rangeRow("contrast", "Contrast boost", 75, 175, 5, "%")}
          ${selectRow("fontFamily", "Font family", [["default", "Site default"], ["system", "System sans"], ["serif", "Readable serif"], ["mono", "Monospace"]])}
          ${toggleRow("highlightCursor", "Highlight cursor")}
          ${toggleRow("screenReader", "Screen reader optimization", "Reduces decorative content and motion")}
          ${toggleRow("enhancedFocus", "Enhanced keyboard focus", "Thicker outlines for tab navigation")}
          ${rangeRow("letterSpacing", "Letter spacing", 0, 6, 0.5, "px")}
          ${rangeRow("lineHeight", "Line height", 1, 2.2, 0.1, "")}
        </div>
        <section class="a11y-speech" aria-labelledby="a11y-speech-title">
          <h3 id="a11y-speech-title">Text to speech</h3>
          <p>Select text on the page, then ask your browser to read it aloud.</p>
          <div><button type="button" id="a11y-read-selection">Read selection</button><button type="button" id="a11y-stop-speech">Stop</button></div>
        </section>
        <button class="a11y-reset" id="a11y-reset" type="button">Reset all settings</button>
      </div>
      <p class="sr-only" id="a11y-status" aria-live="polite"></p>
    </section>
    <div class="a11y-cursor-ring" id="a11y-cursor-ring" aria-hidden="true"></div>`;
  document.body.appendChild(root);

  const launcher = document.getElementById("a11y-launcher");
  const panel = document.getElementById("a11y-panel");
  const backdrop = document.getElementById("a11y-backdrop");
  const closeButton = document.getElementById("a11y-close");
  const resetButton = document.getElementById("a11y-reset");
  const status = document.getElementById("a11y-status");
  const cursorRing = document.getElementById("a11y-cursor-ring");
  const colorblindMatrix = document.getElementById("nexora-colorblind-matrix");

  function toggleRow(setting, label, description) {
    return `<button class="a11y-toggle" type="button" data-setting-toggle="${setting}" aria-pressed="false">
      <span><strong>${label}</strong>${description ? `<small>${description}</small>` : ""}</span><span class="a11y-toggle-state">Off</span>
    </button>`;
  }

  function rangeRow(setting, label, min, max, step, unit) {
    return `<label class="a11y-range"><span><strong>${label}</strong><output data-setting-output="${setting}"></output></span>
      <input type="range" min="${min}" max="${max}" step="${step}" data-setting-range="${setting}" data-unit="${unit}">
    </label>`;
  }

  function selectRow(setting, label, options) {
    return `<label class="a11y-select"><strong>${label}</strong><select data-setting-select="${setting}">${options.map(function (option) {
      return `<option value="${option[0]}">${option[1]}</option>`;
    }).join("")}</select></label>`;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* Preferences still work for this visit. */ }
  }

  function setBooleanClass(className, enabled) {
    document.documentElement.classList.toggle(className, Boolean(enabled));
  }

  function updateColorblindMatrix() {
    const target = deficiencyMatrices[state.colorblindMode];
    if (!target) {
      colorblindMatrix.setAttribute("values", identityMatrix.join(" "));
      return;
    }
    const strength = Number(state.colorblindStrength) / 100;
    const mixed = identityMatrix.map(function (value, index) {
      return (value + (target[index] - value) * strength).toFixed(4);
    });
    colorblindMatrix.setAttribute("values", mixed.join(" "));
  }

  function applyState() {
    setBooleanClass("a11y-high-contrast", state.highContrast);
    setBooleanClass("a11y-reduced-motion", state.reducedMotion);
    setBooleanClass("a11y-underline-links", state.underlineLinks);
    setBooleanClass("a11y-enhanced-focus", state.enhancedFocus);
    setBooleanClass("a11y-simple-reading", state.screenReader);
    setBooleanClass("a11y-highlight-cursor", state.highlightCursor);

    document.documentElement.dataset.a11yFont = state.fontFamily;
    document.body.classList.toggle("a11y-text-scaled", Number(state.textScale) !== 100);
    document.body.classList.toggle("a11y-custom-spacing", Number(state.letterSpacing) !== 0 || Number(state.lineHeight) !== 1.5);
    document.body.style.setProperty("--a11y-text-zoom", Number(state.textScale) / 100);
    document.body.style.setProperty("--a11y-invert", state.invertColors ? 1 : 0);
    document.body.style.setProperty("--a11y-invert-hue", state.invertColors ? "180deg" : "0deg");
    document.body.style.setProperty("--a11y-grayscale", Number(state.grayscale) / 100);
    document.body.style.setProperty("--a11y-saturation", Number(state.saturation) / 100);
    document.body.style.setProperty("--a11y-contrast", Number(state.contrast) / 100);
    document.body.style.setProperty("--a11y-letter-spacing", Number(state.letterSpacing) + "px");
    document.body.style.setProperty("--a11y-line-height", Number(state.lineHeight));
    document.body.style.setProperty("--a11y-colorblind-filter", "url(#nexora-colorblind-filter)");
    updateColorblindMatrix();
    syncControls();
  }

  function syncControls() {
    root.querySelectorAll("[data-setting-toggle]").forEach(function (button) {
      const enabled = Boolean(state[button.dataset.settingToggle]);
      button.setAttribute("aria-pressed", String(enabled));
      button.querySelector(".a11y-toggle-state").textContent = enabled ? "On" : "Off";
    });
    root.querySelectorAll("[data-setting-range]").forEach(function (input) {
      const setting = input.dataset.settingRange;
      input.value = state[setting];
      const output = root.querySelector(`[data-setting-output="${setting}"]`);
      output.textContent = state[setting] + input.dataset.unit;
    });
    root.querySelectorAll("[data-setting-select]").forEach(function (select) {
      select.value = state[select.dataset.settingSelect];
    });
  }

  function announce(message) {
    status.textContent = "";
    window.setTimeout(function () { status.textContent = message; }, 20);
  }

  function updateSetting(setting, value, message) {
    state[setting] = value;
    applyState();
    saveState();
    announce(message || "Accessibility preference updated.");
  }

  root.querySelectorAll("[data-setting-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      const setting = button.dataset.settingToggle;
      const nextValue = !Boolean(state[setting]);
      updateSetting(setting, nextValue, button.querySelector("strong").textContent + " " + (nextValue ? "on" : "off") + ".");
    });
  });

  root.querySelectorAll("[data-setting-range]").forEach(function (input) {
    input.addEventListener("input", function () {
      updateSetting(input.dataset.settingRange, Number(input.value));
    });
  });

  root.querySelectorAll("[data-setting-select]").forEach(function (select) {
    select.addEventListener("change", function () {
      updateSetting(select.dataset.settingSelect, select.value, select.options[select.selectedIndex].text + " selected.");
    });
  });

  function openPanel() {
    window.clearTimeout(closeTimer);
    lastFocusedElement = document.activeElement;
    panel.hidden = false;
    backdrop.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    document.body.classList.add("a11y-dialog-open");
    window.setTimeout(function () {
      panel.classList.add("open");
      backdrop.classList.add("open");
      closeButton.focus();
    }, 10);
  }

  function closePanel() {
    if (panel.hidden) return;
    panel.classList.remove("open");
    backdrop.classList.remove("open");
    launcher.setAttribute("aria-expanded", "false");
    document.body.classList.remove("a11y-dialog-open");
    closeTimer = window.setTimeout(function () {
      panel.hidden = true;
      backdrop.hidden = true;
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
    }, state.reducedMotion ? 0 : 180);
  }

  function keepFocusInside(event) {
    if (event.key !== "Tab" || panel.hidden) return;
    const focusable = Array.from(panel.querySelectorAll("button, input, select, [tabindex]:not([tabindex='-1'])")).filter(function (element) {
      return !element.disabled && element.offsetParent !== null;
    });
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  launcher.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) closePanel();
    keepFocusInside(event);
  });

  resetButton.addEventListener("click", function () {
    state = Object.assign({}, defaults);
    applyState();
    saveState();
    announce("All accessibility settings reset.");
  });

  document.getElementById("a11y-read-selection").addEventListener("click", function () {
    const selectedText = window.getSelection ? window.getSelection().toString().trim() : "";
    if (!selectedText) {
      announce("Select some page text first.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      announce("Text to speech is not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(selectedText.slice(0, 5000)));
    announce("Reading the selected text.");
  });

  document.getElementById("a11y-stop-speech").addEventListener("click", function () {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    announce("Text to speech stopped.");
  });

  document.addEventListener("pointermove", function (event) {
    if (!state.highlightCursor) return;
    cursorRing.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }, { passive: true });

  applyState();
})();
