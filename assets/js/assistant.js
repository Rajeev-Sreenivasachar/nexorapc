(function () {
  "use strict";

  const log = document.getElementById("chat-log");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const submitButton = document.getElementById("chat-submit");
  const status = document.getElementById("assistant-status");

  function productsMentioned(text) {
    return window.NEXORA_PRODUCTS.filter(function (product) {
      return text.toLowerCase().includes(product.name.toLowerCase());
    }).slice(0, 8);
  }

  function appendMessage(role, text) {
    const message = document.createElement("div");
    message.className = "chat-message " + role;

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = role === "user" ? "You" : "Nexora";

    const copy = document.createElement("span");
    copy.textContent = text;
    message.append(label, copy);

    const matches = productsMentioned(text);
    if (role === "assistant" && matches.length) {
      const links = document.createElement("div");
      links.style.marginTop = "12px";
      matches.forEach(function (product) {
        const link = document.createElement("a");
        link.className = "text-link";
        link.href = "product.html?id=" + encodeURIComponent(product.id);
        link.textContent = "View " + product.name + " →";
        link.style.display = "block";
        links.appendChild(link);
      });
      message.appendChild(links);
    }

    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
  }

  function fallbackRecommendation(profile) {
    const budget = Number(profile.budget);
    function priced(category, filter) {
      return window.NEXORA_PRODUCTS.filter(function (product) {
        return product.category === category && product.price !== null && (!filter || filter(product));
      }).sort(function (a, b) { return a.price - b.price; });
    }

    function nearBudget(category, target, filter) {
      const options = priced(category, filter);
      return options.filter(function (product) { return product.price <= target; }).pop() || options[0];
    }

    const performanceMultiplier = profile.performance === "performance" ? 1.18 : profile.performance === "value" ? 0.82 : 1;
    const supportedSockets = new Set(window.NEXORA_PRODUCTS.filter(function (product) { return product.category === "motherboard"; }).map(function (product) { return product.compatibility.socket; }));
    const cpu = nearBudget("cpu", budget * 0.19 * performanceMultiplier, function (product) {
      return supportedSockets.has(product.compatibility.socket);
    });
    const gpu = nearBudget("gpu", budget * 0.39 * performanceMultiplier);
    const motherboard = nearBudget("motherboard", budget * 0.14, function (product) {
      return product.compatibility.socket === cpu.compatibility.socket;
    });
    const ram = nearBudget("ram", budget * 0.09, function (product) {
      return product.compatibility.memoryType === motherboard.compatibility.memoryType;
    });
    const storage = nearBudget("storage", budget * 0.09);
    const psu = priced("psu", function (product) {
      return product.compatibility.wattage >= (gpu.compatibility.recommendedPsu || 550);
    })[0];
    const computerCase = priced("case", function (product) {
      return product.compatibility.caseSupport.includes(motherboard.compatibility.formFactor);
    })[0];
    const cooler = priced("cooling")[0];
    const parts = [cpu, motherboard, gpu, ram, storage, psu, computerCase, cooler];
    const missingPrice = parts.some(function (product) { return !product || product.price === null; });
    const total = parts.reduce(function (sum, product) { return sum + (product && product.price !== null ? product.price : 0); }, 0);

    return "Rule-based recommendation (Gemini was unavailable):\n\n" +
      parts.filter(Boolean).map(function (product) { return "• " + product.name + " — " + window.Nexora.formatMoney(product.price); }).join("\n") +
      "\n\nEstimated reference total: " + window.Nexora.formatMoney(total) + (missingPrice ? " plus any unavailable prices" : "") + ". " +
      (total <= budget ? "This stays within your approximate budget." : "This is above your budget; lower the GPU or CPU target first, then compare the next cheaper catalog option.") +
      " Prices are dated snapshots. The CPU, motherboard, RAM, case, and PSU metadata pass Nexora’s basic checks; cooler mounting support still needs manufacturer verification.";
  }

  function profileData() {
    return {
      budget: Number(document.getElementById("assistant-budget").value),
      use: document.getElementById("assistant-use").value,
      performance: document.getElementById("assistant-performance").value,
      existingParts: document.getElementById("assistant-existing").value.trim().slice(0, 500)
    };
  }

  appendMessage("assistant", "Tell me what you want the computer to handle. I’ll stay inside Nexora’s catalog and explain the trade-offs.");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    const profile = profileData();
    appendMessage("user", message);
    input.value = "";
    submitButton.disabled = true;
    status.textContent = "Checking the catalog…";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message, profile: profile })
      });
      if (!response.ok) throw new Error("Assistant request failed");
      const data = await response.json();
      if (!data.reply) throw new Error("Assistant response was empty");
      appendMessage("assistant", data.reply);
      status.textContent = "Gemini response · verify specifications before purchasing real parts.";
    } catch (error) {
      appendMessage("assistant", fallbackRecommendation(profile));
      status.textContent = "Gemini unavailable — the response above came from Nexora’s local rule-based recommender, not AI.";
    } finally {
      submitButton.disabled = false;
      input.focus();
    }
  });
})();
