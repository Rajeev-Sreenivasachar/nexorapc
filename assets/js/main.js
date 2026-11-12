(function () {
  "use strict";

  function renderHeader() {
    const mount = document.querySelector("[data-site-header]");
    if (!mount) return;

    const page = document.body.dataset.page || "";
    const links = [
      ["home", "index.html", "Home"],
      ["shop", "shop.html", "Shop"],
      ["prebuilt", "prebuilt.html", "PC Finder"],
      ["about", "about.html", "About Nexora"]
    ];

    mount.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <div class="site-header-stack">
        <div class="sale-banner">
          <div class="container sale-banner-inner">
            <span><strong>THANKSGIVING SALE</strong><small>15% off every item in your demo cart.</small></span>
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
            <div class="nav-actions">
              <a class="nav-cart" href="shop.html?cart=open" data-nav-cart aria-label="Open cart">Cart <span data-cart-count>0</span></a>
              <button class="app-install-button" type="button" data-install-app hidden>Install app</button>
              <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Toggle navigation" aria-controls="main-nav" aria-expanded="false">Menu</button>
            </div>
          </div>
        </header>
      </div>`;
  }

  function renderMobileAppBar() {
    const page = document.body.dataset.page || "";
    const tabs = [
      ["home", "index.html", "Home", '<path d="M4 11.5 12 5l8 6.5V20h-5v-6H9v6H4z"/>'],
      ["shop", "shop.html", "Shop", '<path d="M5 8h14l-1 12H6zM8 8V7a4 4 0 0 1 8 0v1"/>'],
      ["prebuilt", "prebuilt.html", "Finder", '<path d="M4 7h16v11H4zM8 4v3m8-3v3M8 12h8m-8 3h5"/>'],
      ["about", "about.html", "About", '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8h.01"/>']
    ];
    const bar = document.createElement("nav");
    bar.className = "mobile-app-bar";
    bar.setAttribute("aria-label", "App navigation");
    bar.innerHTML = tabs.map(function (tab) {
      const active = page === tab[0] ? ' class="active" aria-current="page"' : "";
      return `<a href="${tab[1]}"${active}><svg viewBox="0 0 24 24" aria-hidden="true">${tab[3]}</svg><span>${tab[2]}</span></a>`;
    }).join("") + `<button type="button" data-install-app hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14"/></svg><span>Install</span></button>`;
    document.body.appendChild(bar);
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
            <a href="shop.html">Shop</a>
            <a href="prebuilt.html">PC Finder</a>
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

  function updateSharedCartCount() {
    let cart = [];
    try {
      const saved = JSON.parse(localStorage.getItem("nexora_cart_v1") || "[]");
      if (Array.isArray(saved)) cart = saved;
    } catch (error) { /* Cart count can safely fall back to zero. */ }
    const quantity = cart.reduce(function (total, item) { return total + (Number(item.quantity) || 0); }, 0);
    document.querySelectorAll("[data-cart-count]").forEach(function (element) { element.textContent = quantity; });
  }

  function setupSharedCart() {
    updateSharedCartCount();
    window.addEventListener("nexora:cart-changed", updateSharedCartCount);
    document.addEventListener("click", function (event) {
      const cartLink = event.target.closest("[data-nav-cart]");
      if (!cartLink || document.body.dataset.page !== "shop" || !window.NEXORA_ORDERING) return;
      event.preventDefault();
      window.NEXORA_ORDERING.openCart();
    });
  }

  renderHeader();
  renderFooter();
  renderMobileAppBar();
  setupNavigation();
  setupRevealAnimations();
  setupSharedCart();

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });
})();
