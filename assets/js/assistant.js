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
    const performanceBuild = budget >= 1700 || profile.performance === "performance";
    const valueBuild = budget < 1100 || profile.performance === "value";
    const cpu = performanceBuild ? window.Nexora.getProduct("intel-core-i5-14600k") : window.Nexora.getProduct("amd-ryzen-5-7600");
    const motherboard = cpu.compatibility.socket === "AM5" ? window.Nexora.getProduct("msi-pro-b650-s-wifi") : window.Nexora.getProduct("asus-tuf-z790-plus-wifi");
    const gpu = performanceBuild ? window.Nexora.getProduct("amd-radeon-rx-7800-xt") : window.Nexora.getProduct("nvidia-rtx-4070-super");
    const ram = cpu.compatibility.socket === "LGA1700" ? window.Nexora.getProduct("kingston-fury-beast-32gb-ddr4") : window.Nexora.getProduct("corsair-vengeance-32gb-ddr5");
    const storage = valueBuild ? window.Nexora.getProduct("kingston-nv2-1tb") : window.Nexora.getProduct("samsung-990-pro-2tb");
    const psu = performanceBuild ? window.Nexora.getProduct("msi-mag-a850gl") : window.Nexora.getProduct("corsair-rm750e");
    const computerCase = window.Nexora.getProduct("corsair-4000d-airflow");
    const cooler = window.Nexora.getProduct("thermalright-peerless-assassin-120-se");
    const parts = [cpu, motherboard, gpu, ram, storage, psu, computerCase, cooler];
    const total = parts.reduce(function (sum, product) { return sum + product.price; }, 0);

    return "Rule-based recommendation (Gemini was unavailable):\n\n" +
      parts.map(function (product) { return "• " + product.name + " — " + window.Nexora.formatMoney(product.price); }).join("\n") +
      "\n\nEstimated demo total: " + window.Nexora.formatMoney(total) + ". " +
      (total <= budget ? "This stays within your approximate budget." : "This is above your budget, so start by choosing the Kingston NV2 and the lower-cost performance option.") +
      " The CPU, motherboard, RAM, case, cooler, and PSU metadata pass Nexora’s basic checks. Review exact dimensions and manufacturer documentation before buying real hardware.";
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
