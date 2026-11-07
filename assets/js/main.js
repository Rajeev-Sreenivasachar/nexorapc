(function () {
  "use strict";

  const CART_KEY = "nexora_cart";
  const BUILD_KEY = "nexora_current_build";
  const SAVED_BUILDS_KEY = "nexora_saved_builds";
  const INVENTORY_PUBLIC = false;

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // The site remains usable when storage is blocked or full.
    }
  }

  function formatMoney(value) {
    if (!Number.isFinite(value)) return "Price unavailable";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

  function formatCheckedDate(value) {
    if (!value) return "Not recorded";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function getProduct(productId) {
    return window.NEXORA_PRODUCTS.find(function (product) { return product.id === productId; });
  }

  function getCart() {
    const saved = readJson(CART_KEY, []);
    return Array.isArray(saved) ? saved : [];
  }

  function saveCart(cart) {
    writeJson(CART_KEY, cart);
    updateCartCount();
    window.dispatchEvent(new CustomEvent("nexora:cart-updated"));
  }

  function showToast(message) {
    let toast = document.getElementById("site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(function () { toast.classList.remove("show"); }, 2800);
  }

  function addToCart(productId, quantity) {
    if (!INVENTORY_PUBLIC) {
      showToast("Store inventory is coming soon. Your planning tools still work.");
      return false;
    }
    const product = getProduct(productId);
    const amount = Math.max(1, Number(quantity) || 1);
    if (!product) return false;
    const cart = getCart();
    const existingItem = cart.find(function (item) { return item.id === productId; });
    if (existingItem) existingItem.quantity += amount;
    else cart.push({ id: productId, quantity: amount });
    saveCart(cart);
    showToast(product.name + " added to your cart.");
    return true;
  }

  function updateCartCount() {
    const count = INVENTORY_PUBLIC ? getCart().reduce(function (total, item) {
      return total + (Number(item.quantity) || 0);
    }, 0) : 0;
    document.querySelectorAll("[data-cart-count]").forEach(function (element) { element.textContent = count; });
  }

  function productCard(product) {
    const category = window.NEXORA_CATEGORIES.find(function (item) { return item.id === product.category; });
    return `
      <article class="product-card">
        <a class="product-image-wrap" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${product.name}">
          <span class="image-placeholder" aria-hidden="true"><strong>${category ? category.shortName : "PART"}</strong><small>Image ready</small></span>
          <img class="product-image" data-product-image src="${product.image}" alt="${product.imageAlt}" loading="lazy">
        </a>
        <div class="product-info">
          <div class="product-card-topline"><span class="eyebrow">${category ? category.name : product.category}</span><span class="brand-label">${product.brand}</span></div>
          <h3><a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
          <p>${product.description}</p>
          <div class="product-meta"><span class="demo-price"><small>Reference price</small>${formatMoney(product.price)}</span><span class="stock-label">Checked ${formatCheckedDate(product.priceChecked)}</span></div>
          <div class="product-actions"><a class="button button-secondary button-small" href="product.html?id=${encodeURIComponent(product.id)}">Details</a><button class="button button-primary button-small" type="button" data-add-cart="${product.id}">Add to cart</button></div>
        </div>
      </article>`;
  }

  function renderHeader() {
    const mount = document.querySelector("[data-site-header]");
    if (!mount) return;
    const page = document.body.dataset.page || "";
    const links = [
      ["home", "index.html", "Home"],
      ["shop", "shop.html", "Store"],
      ["builder", "builder.html", "PC Builder"],
      ["reviews", "reviews.html", "Reviews"],
      ["about", "about.html", "About Nexora"],
      ["support", "support.html", "Support"]
    ];
    mount.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <div class="site-header-stack">
        <div class="sale-banner" id="sale-banner">
          <div class="container sale-banner-inner"><span><strong>🦃 THANKSGIVING SALE — 20% OFF!</strong><small>Promotional preview — discount is not active yet.</small></span></div>
        </div>
        <header class="site-header">
          <div class="container nav-shell">
            <a class="logo" href="index.html" aria-label="Nexora home"><img class="logo-mark" src="assets/images/nexora-mark.svg?v=20261106-1" alt="" width="38" height="38"><span class="logo-wordmark">nexora</span></a>
            <nav class="nav-links" id="main-nav" aria-label="Main navigation">
              ${links.map(function (link) {
                const active = page === link[0] ? ' class="active" aria-current="page"' : "";
                return `<a href="${link[1]}"${active}><span>${link[2]}</span></a>`;
              }).join("")}
              <button class="nav-popup-button" type="button" data-open-prebuilt>Prebuilt PCs</button>
            </nav>
            <div class="nav-actions"><button class="icon-button menu-toggle" id="menu-toggle" type="button" aria-label="Toggle navigation" aria-controls="main-nav" aria-expanded="false">Menu</button></div>
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
          <div class="footer-brand"><a class="logo" href="index.html" aria-label="Nexora home"><img class="logo-mark" src="assets/images/nexora-mark.svg?v=20261106-1" alt="" width="38" height="38"><span class="logo-wordmark">nexora</span></a><p>Plan a PC, learn the hardware, and make more confident component decisions.</p></div>
          <div><h2>Explore</h2><a href="shop.html">Store launch</a><a href="builder.html">PC Builder</a><button class="footer-button" type="button" data-open-ai>Ask Nexora AI</button></div>
          <div><h2>Project</h2><a href="about.html">About Nexora</a><a href="reviews.html">Reviews</a><a href="support.html">Support</a></div>
          <div><h2>Information</h2><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="credits.html">Credits</a></div>
        </div>
        <div class="container footer-bottom"><span>© <span data-current-year></span> Nexora</span><span>Student demonstration — no inventory, payments, or real orders</span></div>
      </footer>`;
  }

  function renderGlobalUi() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal-backdrop" id="prebuilt-modal" hidden>
        <section class="prebuilt-modal" role="dialog" aria-modal="true" aria-labelledby="prebuilt-title" aria-describedby="prebuilt-description">
          <button class="modal-close" type="button" data-close-prebuilt aria-label="Close prebuilt PC information">×</button>
          <span class="eyebrow">Nexora prebuilts</span><h2 id="prebuilt-title">A complete PC, without the compatibility homework.</h2>
          <p id="prebuilt-description">Our future prebuilt lineup will focus on balanced parts, clear specifications, and upgrade-friendly systems for gaming, school, and creative work.</p>
          <div class="prebuilt-points"><span>Balanced components</span><span>Clear upgrade paths</span><span>No mystery specifications</span></div>
          <div class="coming-soon-panel"><strong>Prebuilt inventory is coming soon.</strong><p>We are preparing the experience now. No systems are available to purchase yet.</p></div>
          <button class="button button-primary" type="button" disabled>Explore prebuilts — coming soon</button>
        </section>
      </div>`;
    document.body.appendChild(wrapper);
  }

  function setupNavigation() {
    const menuToggle = document.getElementById("menu-toggle");
    const navigation = document.getElementById("main-nav");
    if (menuToggle && navigation) {
      menuToggle.addEventListener("click", function () {
        const isOpen = navigation.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      });
      navigation.addEventListener("click", function (event) {
        if (event.target.closest("a, [data-open-prebuilt]")) {
          navigation.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  function setupPrebuiltModal() {
    const modal = document.getElementById("prebuilt-modal");
    let opener = null;
    function close() {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      if (opener) opener.focus();
    }
    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-open-prebuilt]");
      if (!button) return;
      opener = button;
      modal.hidden = false;
      document.body.classList.add("modal-open");
      modal.querySelector("[data-close-prebuilt]").focus();
    });
    modal.querySelector("[data-close-prebuilt]").addEventListener("click", close);
    modal.addEventListener("click", function (event) { if (event.target === modal) close(); });
    modal.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      const focusable = Array.from(modal.querySelectorAll("button:not(:disabled), a[href]")).filter(function (element) { return !element.hidden; });
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    return close;
  }

  function setupRevealAnimations() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  renderGlobalUi();
  setupNavigation();
  const closePrebuilt = setupPrebuiltModal();
  setupRevealAnimations();
  updateCartCount();

  document.querySelectorAll("[data-current-year]").forEach(function (element) { element.textContent = new Date().getFullYear(); });
  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-add-cart]");
    if (button) addToCart(button.dataset.addCart, Number(button.dataset.quantity) || 1);
  });
  document.addEventListener("error", function (event) {
    if (!event.target.matches || !event.target.matches("[data-product-image]")) return;
    event.target.hidden = true;
    event.target.closest(".product-image-wrap, .product-detail-image")?.classList.add("image-missing");
  }, true);
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    document.getElementById("main-nav")?.classList.remove("open");
    document.getElementById("menu-toggle")?.setAttribute("aria-expanded", "false");
    closePrebuilt();
  });
  window.addEventListener("storage", updateCartCount);
  window.addEventListener("pageshow", updateCartCount);

  window.Nexora = {
    CART_KEY: CART_KEY, BUILD_KEY: BUILD_KEY, SAVED_BUILDS_KEY: SAVED_BUILDS_KEY,
    inventoryPublic: INVENTORY_PUBLIC, readJson: readJson, writeJson: writeJson,
    formatMoney: formatMoney, formatCheckedDate: formatCheckedDate, getProduct: getProduct,
    getCart: getCart, saveCart: saveCart, addToCart: addToCart, showToast: showToast,
    productCard: productCard, updateCartCount: updateCartCount
  };
})();
