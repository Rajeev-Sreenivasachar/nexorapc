(function () {
  "use strict";

  const slotsMount = document.getElementById("builder-slots");
  const checksMount = document.getElementById("compatibility-list");
  const savedMount = document.getElementById("saved-builds");
  let currentBuild = window.Nexora.readJson(window.Nexora.BUILD_KEY, {});

  if (!currentBuild || typeof currentBuild !== "object" || Array.isArray(currentBuild)) currentBuild = {};

  function selectedProduct(categoryId) {
    return window.Nexora.getProduct(currentBuild[categoryId]);
  }

  function renderSlots() {
    slotsMount.innerHTML = window.NEXORA_CATEGORIES.map(function (category) {
      const options = window.NEXORA_PRODUCTS.filter(function (product) {
        return product.category === category.id;
      }).map(function (product) {
        const selected = currentBuild[category.id] === product.id ? " selected" : "";
        return `<option value="${product.id}"${selected}>${product.name} — ${window.Nexora.formatMoney(product.price)}</option>`;
      }).join("");

      const chosen = selectedProduct(category.id);
      return `
        <div class="builder-slot">
          <label for="slot-${category.id}">${category.name}</label>
          <select id="slot-${category.id}" data-build-slot="${category.id}"><option value="">Choose a component</option>${options}</select>
          <span class="slot-price">${chosen ? window.Nexora.formatMoney(chosen.price) : "Not selected"}</span>
        </div>`;
    }).join("");
  }

  function checkCompatibility() {
    return window.NexoraCompatibility.checkBuild(currentBuild);
  }

  function renderSummary() {
    const selected = Object.values(currentBuild).map(window.Nexora.getProduct).filter(Boolean);
    const compatibility = checkCompatibility();
    const productsWithoutPrice = selected.filter(function (product) { return product.price === null; });
    const total = selected.reduce(function (sum, product) { return sum + (product.price === null ? 0 : product.price); }, 0);

    document.getElementById("selected-count").textContent = selected.length + " / 8";
    document.getElementById("power-estimate").textContent = selected.length ? compatibility.estimatedDraw + " W" : "—";
    document.getElementById("build-total").textContent = window.Nexora.formatMoney(total) + (productsWithoutPrice.length ? " + unpriced parts" : "");
    document.getElementById("build-price-note").textContent = productsWithoutPrice.length
      ? productsWithoutPrice.length + " selected " + (productsWithoutPrice.length === 1 ? "part has" : "parts have") + " no confirmed reference price, so this total is incomplete."
      : "All selected parts have dated reference prices. Verify them before purchasing.";
    checksMount.innerHTML = compatibility.checks.map(function (check) {
      return `<li class="compatibility-item ${check.status}">${check.message}</li>`;
    }).join("");
    document.getElementById("add-build-cart").disabled = selected.length === 0;
  }

  function saveCurrentState() {
    window.Nexora.writeJson(window.Nexora.BUILD_KEY, currentBuild);
  }

  function renderBuilder() {
    renderSlots();
    renderSummary();
    renderSavedBuilds();
  }

  function getSavedBuilds() {
    const builds = window.Nexora.readJson(window.Nexora.SAVED_BUILDS_KEY, []);
    return Array.isArray(builds) ? builds : [];
  }

  function renderSavedBuilds() {
    const builds = getSavedBuilds();
    if (!builds.length) {
      savedMount.innerHTML = `<p class="muted">No saved builds yet. Choose parts, name the build, and save it here.</p>`;
      return;
    }

    savedMount.innerHTML = builds.map(function (build) {
      const count = Object.values(build.parts).filter(Boolean).length;
      return `<div class="saved-build"><div><strong>${build.name}</strong><small>${count} selected parts · saved ${new Date(build.savedAt).toLocaleDateString()}</small></div><div class="saved-build-actions"><button class="button button-secondary button-small" type="button" data-load-build="${build.id}">Load</button><button class="button button-danger button-small" type="button" data-delete-build="${build.id}">Delete</button></div></div>`;
    }).join("");
  }

  slotsMount.addEventListener("change", function (event) {
    const select = event.target.closest("[data-build-slot]");
    if (!select) return;
    if (select.value) currentBuild[select.dataset.buildSlot] = select.value;
    else delete currentBuild[select.dataset.buildSlot];
    saveCurrentState();
    renderBuilder();
  });

  document.getElementById("reset-build").addEventListener("click", function () {
    currentBuild = {};
    saveCurrentState();
    renderBuilder();
    window.Nexora.showToast("Current build reset.");
  });

  document.getElementById("add-build-cart").addEventListener("click", function () {
    const cart = window.Nexora.getCart();
    Object.values(currentBuild).filter(Boolean).forEach(function (productId) {
      const existing = cart.find(function (item) { return item.id === productId; });
      if (existing) existing.quantity += 1;
      else cart.push({ id: productId, quantity: 1 });
    });
    window.Nexora.saveCart(cart);
    window.Nexora.showToast("Selected build parts added to your cart.");
  });

  document.getElementById("save-build").addEventListener("click", function () {
    const nameInput = document.getElementById("build-name");
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      window.Nexora.showToast("Give the build a name first.");
      return;
    }
    if (!Object.keys(currentBuild).length) {
      window.Nexora.showToast("Select at least one part before saving.");
      return;
    }

    const builds = getSavedBuilds();
    builds.unshift({ id: String(Date.now()), name: name, parts: Object.assign({}, currentBuild), savedAt: new Date().toISOString() });
    window.Nexora.writeJson(window.Nexora.SAVED_BUILDS_KEY, builds.slice(0, 10));
    nameInput.value = "";
    renderSavedBuilds();
    window.Nexora.showToast("Build saved in this browser.");
  });

  savedMount.addEventListener("click", function (event) {
    const loadButton = event.target.closest("[data-load-build]");
    const deleteButton = event.target.closest("[data-delete-build]");
    const builds = getSavedBuilds();
    if (loadButton) {
      const build = builds.find(function (item) { return item.id === loadButton.dataset.loadBuild; });
      if (build) {
        currentBuild = Object.assign({}, build.parts);
        saveCurrentState();
        renderBuilder();
        window.Nexora.showToast("Saved build loaded.");
      }
    }
    if (deleteButton) {
      window.Nexora.writeJson(window.Nexora.SAVED_BUILDS_KEY, builds.filter(function (item) { return item.id !== deleteButton.dataset.deleteBuild; }));
      renderSavedBuilds();
      window.Nexora.showToast("Saved build deleted.");
    }
  });

  renderBuilder();
})();
