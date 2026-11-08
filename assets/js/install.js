(function () {
  "use strict";

  let installPrompt = null;
  const installButtons = Array.from(document.querySelectorAll("[data-install-app]"));
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  function setInstallButtonsVisible(visible) {
    installButtons.forEach(function (button) { button.hidden = !visible; });
  }

  function showInstallHelp() {
    let dialog = document.getElementById("install-help-dialog");
    if (!dialog) {
      dialog = document.createElement("div");
      dialog.id = "install-help-dialog";
      dialog.className = "install-help-backdrop";
      dialog.innerHTML = `
        <section class="install-help" role="dialog" aria-modal="true" aria-labelledby="install-help-title">
          <button class="dialog-close" type="button" data-close-install aria-label="Close install instructions">×</button>
          <img src="assets/images/app-icon-192.png" alt="" width="72" height="72">
          <span class="eyebrow">Install Nexora</span>
          <h2 id="install-help-title">Add Nexora to your device.</h2>
          <p>${isIos ? "Open the Share menu in Safari, then choose Add to Home Screen." : "Open your browser menu and choose Install Nexora or Add to Home screen."}</p>
          <button class="button button-primary" type="button" data-close-install>Got it</button>
        </section>`;
      document.body.appendChild(dialog);
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog || event.target.closest("[data-close-install]")) dialog.remove();
      });
      document.addEventListener("keydown", function closeOnEscape(event) {
        if (event.key !== "Escape" || !document.contains(dialog)) return;
        dialog.remove();
        document.removeEventListener("keydown", closeOnEscape);
      });
    }
    dialog.querySelector("[data-close-install]").focus();
  }

  async function requestInstall() {
    if (!installPrompt) {
      showInstallHelp();
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    setInstallButtonsVisible(false);
  }

  installButtons.forEach(function (button) {
    button.addEventListener("click", requestInstall);
  });

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    installPrompt = event;
    setInstallButtonsVisible(true);
  });

  window.addEventListener("appinstalled", function () {
    installPrompt = null;
    setInstallButtonsVisible(false);
    document.documentElement.classList.add("app-installed");
  });

  if (isStandalone) {
    document.documentElement.classList.add("standalone-app");
    setInstallButtonsVisible(false);
  } else if (isIos) {
    setInstallButtonsVisible(true);
  }

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/service-worker.js").catch(function (error) {
        console.warn("Nexora app service worker could not register.", error);
      });
    });
  }
})();
