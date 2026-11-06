(function () {
  "use strict";

  const AI_HISTORY_KEY = "nexora_ai_history_v2";
  const Nexora = window.Nexora;
  if (!Nexora) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <button class="ai-launcher" id="ai-launcher" type="button" aria-label="Open Nexora AI assistant" aria-controls="ai-panel" aria-expanded="false"><span aria-hidden="true">N</span><strong>Ask AI</strong></button>
    <section class="ai-panel" id="ai-panel" role="dialog" aria-label="Nexora AI assistant" hidden>
      <header class="ai-panel-header"><div><span class="ai-status-dot" aria-hidden="true"></span><strong>Nexora AI</strong><small>PC guidance, not live inventory data</small></div><button type="button" id="ai-close" aria-label="Close AI assistant">×</button></header>
      <div class="ai-quick-prompts" aria-label="Suggested questions"><button type="button" data-ai-prompt="Help me plan a gaming PC for my budget.">Plan a build</button><button type="button" data-ai-prompt="Explain the difference between a CPU and a GPU.">Explain hardware</button><button type="button" data-ai-prompt="What should I verify before checking PC part compatibility?">Check compatibility</button></div>
      <div class="ai-log" id="ai-log" aria-live="polite" aria-relevant="additions"></div>
      <form class="ai-form" id="ai-form"><label class="sr-only" for="ai-input">Ask Nexora AI a PC question</label><textarea id="ai-input" maxlength="1200" rows="2" required placeholder="Ask about parts, builds, specs, or compatibility…"></textarea><button class="button button-primary" id="ai-submit" type="submit">Send</button></form>
      <div class="ai-disclaimer" id="ai-status">AI can be wrong. Verify prices, availability, and compatibility before buying.</div>
    </section>`;
  document.body.appendChild(wrapper);

  const launcher = document.getElementById("ai-launcher");
  const panel = document.getElementById("ai-panel");
  const closeButton = document.getElementById("ai-close");
  const form = document.getElementById("ai-form");
  const input = document.getElementById("ai-input");
  const submit = document.getElementById("ai-submit");
  const log = document.getElementById("ai-log");
  const status = document.getElementById("ai-status");
  let closeTimer = 0;
  let history = Nexora.readJson(AI_HISTORY_KEY, []);
  if (!Array.isArray(history)) history = [];
  history = history.filter(function (item) { return item && ["user", "assistant"].includes(item.role) && typeof item.text === "string"; }).slice(-12);

  function appendMessage(role, text, save) {
    const message = document.createElement("div");
    message.className = "ai-message " + role;
    const label = document.createElement("span");
    label.textContent = role === "user" ? "You" : "Nexora";
    const copy = document.createElement("p");
    copy.textContent = text;
    message.append(label, copy);
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
    if (save) {
      history.push({ role: role, text: text.slice(0, 5000) });
      history = history.slice(-12);
      Nexora.writeJson(AI_HISTORY_KEY, history);
    }
  }

  if (history.length) history.forEach(function (item) { appendMessage(item.role, item.text, false); });
  else appendMessage("assistant", "hey — ask me about PC parts, build planning, specs, comparisons, or compatibility. i’ll call out anything that still needs real-world verification.", false);

  function open() {
    window.clearTimeout(closeTimer);
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    window.setTimeout(function () { panel.classList.add("open"); input.focus(); }, 10);
  }

  function close() {
    if (panel.hidden) return;
    panel.classList.remove("open");
    launcher.setAttribute("aria-expanded", "false");
    closeTimer = window.setTimeout(function () { panel.hidden = true; launcher.focus(); }, 180);
  }

  launcher.addEventListener("click", function () { if (panel.hidden) open(); else close(); });
  closeButton.addEventListener("click", close);
  document.querySelectorAll("[data-open-ai]").forEach(function (button) { button.addEventListener("click", open); });
  document.querySelectorAll("[data-ai-prompt]").forEach(function (button) {
    button.addEventListener("click", function () { input.value = button.dataset.aiPrompt; input.focus(); });
  });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !panel.hidden) close(); });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    const priorHistory = history.slice(-8);
    appendMessage("user", message, true);
    input.value = "";
    input.disabled = true;
    submit.disabled = true;
    log.setAttribute("aria-busy", "true");
    status.textContent = "Nexora is thinking…";
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message, history: priorHistory }) });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.reply) throw new Error(data.error || "Assistant request failed");
      appendMessage("assistant", data.reply, true);
      status.textContent = "Prices, availability, and compatibility are not live-verified.";
    } catch (error) {
      appendMessage("assistant", "i couldn’t reach the AI service right now. the site is still usable, but this answer needs the Gemini server route and a valid server-side API key.", true);
      status.textContent = "AI unavailable — no answer was generated.";
    } finally {
      input.disabled = false;
      submit.disabled = false;
      log.removeAttribute("aria-busy");
      input.focus();
    }
  });
})();
