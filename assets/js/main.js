(function () {
  "use strict";

  const CART_KEY = "nexora_cart";
  const BUILD_KEY = "nexora_current_build";
  const SAVED_BUILDS_KEY = "nexora_saved_builds";

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatMoney(value) {
    if (!Number.isFinite(value)) return "Price unavailable";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function formatCheckedDate(value) {
    if (!value) return "Not recorded";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function getProduct(productId) {
    return window.NEXORA_PRODUCTS.find(function (product) {
      return product.id === productId;
    });
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

  function addToCart(productId, quantity) {
    const product = getProduct(productId);
    const amount = Math.max(1, Number(quantity) || 1);
    if (!product) return false;

    const cart = getCart();
    const existingItem = cart.find(function (item) {
      return item.id === productId;
    });

    if (existingItem) {
      existingItem.quantity += amount;
    } else {
      cart.push({ id: productId, quantity: amount });
    }

    saveCart(cart);
    showToast(product.name + " added to your cart.");
    return true;
  }

  function updateCartCount() {
    const count = getCart().reduce(function (total, item) {
      return total + (Number(item.quantity) || 0);
    }, 0);

    document.querySelectorAll("[data-cart-count]").forEach(function (element) {
      element.textContent = count;
    });
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
    showToast.timeoutId = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  function productCard(product) {
    const category = window.NEXORA_CATEGORIES.find(function (item) {
      return item.id === product.category;
    });

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
          <div class="product-meta">
            <span class="demo-price"><small>Reference price</small>${formatMoney(product.price)}</span>
            <span class="stock-label">${product.price === null ? "Check retailer" : "Checked " + formatCheckedDate(product.priceChecked)}</span>
          </div>
          <div class="product-actions">
            <a class="button button-secondary button-small" href="product.html?id=${encodeURIComponent(product.id)}">Details</a>
            <button class="button button-primary button-small" type="button" data-add-cart="${product.id}">Add to cart</button>
          </div>
        </div>
      </article>`;
  }

  function renderHeader() {
    const mount = document.querySelector("[data-site-header]");
    if (!mount) return;

    const page = document.body.dataset.page || "";
    const links = [
      ["home", "index.html", "Home"],
      ["shop", "shop.html", "Shop"],
      ["builder", "builder.html", "PC Builder"],
      ["assistant", "assistant.html", "AI Assistant"],
      ["about", "about.html", "About"],
      ["support", "support.html", "Support"]
    ];

    mount.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <div class="topbar">Reference prices are dated snapshots · verify price and availability with the linked retailer</div>
      <header class="site-header">
        <div class="container nav-shell">
          <a class="logo" href="index.html" aria-label="Nexora home">nexora<span>.</span></a>
          <nav class="nav-links" id="main-nav" aria-label="Main navigation">
            ${links.map(function (link) {
              const active = page === link[0] ? ' class="active" aria-current="page"' : "";
              return `<a href="${link[1]}"${active}>${link[2]}</a>`;
            }).join("")}
          </nav>
          <div class="nav-actions">
            <button class="icon-button" id="search-toggle" type="button" aria-label="Open product search" aria-expanded="false">Search</button>
            <a class="cart-link" href="cart.html" aria-label="Open shopping cart">
              Cart <span data-cart-count>0</span>
            </a>
            <button class="icon-button menu-toggle" id="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">Menu</button>
          </div>
        </div>
        <div class="search-panel" id="search-panel" hidden>
          <form class="container search-form" id="global-search-form">
            <label class="sr-only" for="global-search-input">Search products</label>
            <input id="global-search-input" type="search" placeholder="Search processors, graphics cards, memory…" required>
            <button class="button button-primary" type="submit">Search</button>
          </form>
        </div>
      </header>`;
  }

  function renderFooter() {
    const mount = document.querySelector("[data-site-footer]");
    if (!mount) return;

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand">
            <a class="logo" href="index.html">nexora<span>.</span></a>
            <p>Research PC hardware, compare reference prices, and plan a compatible build with clear data sources.</p>
          </div>
          <div><h2>Build</h2><a href="shop.html">Shop components</a><a href="builder.html">PC Builder</a><a href="assistant.html">AI Assistant</a></div>
          <div><h2>Project</h2><a href="about.html">About Nexora</a><a href="support.html">Support</a><a href="credits.html">Image credits</a></div>
          <div><h2>Information</h2><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="cart.html">Cart</a></div>
        </div>
        <div class="container footer-bottom">
          <span>© <span data-current-year></span> Nexora</span>
          <span>Student demonstration — no inventory claims, payments, or real orders</span>
        </div>
      </footer>`;
  }

  function setupNavigation() {
    const menuToggle = document.getElementById("menu-toggle");
    const navigation = document.getElementById("main-nav");
    const searchToggle = document.getElementById("search-toggle");
    const searchPanel = document.getElementById("search-panel");
    const searchInput = document.getElementById("global-search-input");

    if (menuToggle && navigation) {
      menuToggle.addEventListener("click", function () {
        const isOpen = navigation.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    if (searchToggle && searchPanel) {
      searchToggle.addEventListener("click", function () {
        const willOpen = searchPanel.hidden;
        searchPanel.hidden = !willOpen;
        searchToggle.setAttribute("aria-expanded", String(willOpen));
        if (willOpen) searchInput.focus();
      });
    }

    const searchForm = document.getElementById("global-search-form");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (query) window.location.href = "shop.html?search=" + encodeURIComponent(query);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (navigation) navigation.classList.remove("open");
      if (searchPanel) searchPanel.hidden = true;
      if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
      if (searchToggle) searchToggle.setAttribute("aria-expanded", "false");
    });
  }

  function setupRevealAnimations() {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
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
  updateCartCount();

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-add-cart]");
    if (button) addToCart(button.dataset.addCart, Number(button.dataset.quantity) || 1);
  });

  document.addEventListener("error", function (event) {
    if (!event.target.matches || !event.target.matches("[data-product-image]")) return;
    event.target.hidden = true;
    event.target.closest(".product-image-wrap, .product-detail-image")?.classList.add("image-missing");
  }, true);

  window.addEventListener("storage", updateCartCount);
  window.addEventListener("pageshow", updateCartCount);

  window.Nexora = {
    CART_KEY: CART_KEY,
    BUILD_KEY: BUILD_KEY,
    SAVED_BUILDS_KEY: SAVED_BUILDS_KEY,
    readJson: readJson,
    writeJson: writeJson,
    formatMoney: formatMoney,
    formatCheckedDate: formatCheckedDate,
    getProduct: getProduct,
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    showToast: showToast,
    productCard: productCard,
    updateCartCount: updateCartCount
  };
})();
