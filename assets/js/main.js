(function () {
  "use strict";

  function renderHeader() {
    const mount = document.querySelector("[data-site-header]");
    if (!mount) return;

    const page = document.body.dataset.page || "";
    const links = [
      ["home", "index.html", "Home"],
      ["about", "about.html", "About Nexora"]
    ];

    mount.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <div class="site-header-stack">
        <div class="sale-banner">
          <div class="container sale-banner-inner">
            <span><strong>THANKSGIVING SALE</strong><small>Build Better. Game Bigger.</small></span>
          </div>
        </div>
        <header class="site-header">
          <div class="container nav-shell">
            <a class="logo" href="index.html" aria-label="Nexora home">
              <img class="logo-mark" src="assets/images/nexora-mark.svg?v=20261107-2" alt="" width="38" height="38">
              <span class="logo-wordmark">nexora</span>
            </a>
            <nav class="nav-links" id="main-nav" aria-label="Main navigation">
              ${links.map(function (link) {
                const active = page === link[0] ? ' class="active" aria-current="page"' : "";
                return `<a href="${link[1]}"${active}><span>${link[2]}</span></a>`;
              }).join("")}
            </nav>
            <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Toggle navigation" aria-controls="main-nav" aria-expanded="false">Menu</button>
          </div>
        </header>
      </div>`;
  }

  function renderFooter() {
    const mount = document.querySelector("[data-site-footer]");
    if (!mount) return;

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand">
            <a class="logo" href="index.html" aria-label="Nexora home">
              <img class="logo-mark" src="assets/images/nexora-mark.svg?v=20261107-2" alt="" width="38" height="38">
              <span class="logo-wordmark">nexora</span>
            </a>
            <p>A hardware parts shop experience built for FBLA.</p>
          </div>
          <nav class="footer-links" aria-label="Footer navigation">
            <a href="index.html">Home</a>
            <a href="about.html">About Nexora</a>
          </nav>
        </div>
        <div class="container footer-bottom">
          <span>© <span data-current-year></span> Nexora</span>
          <span>FBLA Introduction to Programming</span>
        </div>
      </footer>`;
  }

  function setupNavigation() {
    const toggle = document.getElementById("menu-toggle");
    const navigation = document.getElementById("main-nav");
    if (!toggle || !navigation) return;

    toggle.addEventListener("click", function () {
      const isOpen = navigation.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    navigation.addEventListener("click", function () {
      navigation.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      navigation.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  function setupRevealAnimations() {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach(function (element) { element.classList.add("visible"); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    elements.forEach(function (element) { observer.observe(element); });
  }

  renderHeader();
  renderFooter();
  setupNavigation();
  setupRevealAnimations();

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });
})();
