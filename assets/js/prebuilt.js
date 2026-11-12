(function () {
  "use strict";

  const systems = Array.isArray(window.NEXORA_PREBUILTS) ? window.NEXORA_PREBUILTS : [];
  const finderCore = window.NEXORA_PREBUILT_CORE;
  const form = document.getElementById("pc-finder-form");
  const results = document.getElementById("finder-results");
  const summary = document.getElementById("finder-summary");
  const resetButton = document.getElementById("finder-reset");
  if (!form || !results || !systems.length || !finderCore) return;

  function money(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

  function selectedValues(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) { return input.value; });
  }

  function card(result, index) {
    const system = result.system;
    const overBudget = system.price > Number(form.elements.budget.value);
    return `<article class="prebuilt-result ${index === 0 ? "best-match" : ""}">
      <div class="prebuilt-result-top"><span class="prebuilt-rank">${index === 0 ? "Best match" : "Alternative " + index}</span><span>${system.id}</span></div>
      <div class="prebuilt-tower" data-accent="${system.accent}" aria-hidden="true"><span></span><i></i><i></i><i></i></div>
      <h3>${system.name}</h3><p class="prebuilt-model">${system.model}</p>
      <strong class="prebuilt-price">${money(system.price)}</strong>
      <p class="prebuilt-budget-note ${overBudget ? "over" : ""}">${overBudget ? "Closest match above your budget" : "Fits your selected budget"}</p>
      <dl><div><dt>CPU</dt><dd>${system.cpu}</dd></div><div><dt>GPU</dt><dd>${system.gpu}</dd></div><div><dt>Memory</dt><dd>${system.ram}</dd></div><div><dt>Storage</dt><dd>${system.storage}</dd></div></dl>
      <ul>${result.reasons.map(function (reason) { return `<li>${reason}</li>`; }).join("")}</ul>
      <p class="prebuilt-source">${system.source} · checked ${system.checkedDate}. Price and availability can change.</p>
      <a class="button ${index === 0 ? "button-primary" : "button-secondary"}" href="${system.sourceUrl}" target="_blank" rel="noopener noreferrer">Check at Best Buy →</a>
    </article>`;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const tasks = selectedValues("task");
    if (!tasks.length) {
      form.querySelector(".finder-error").hidden = false;
      return;
    }
    form.querySelector(".finder-error").hidden = true;
    const answers = {
      tasks: tasks,
      games: form.elements.games.value.trim(),
      coding: form.elements.coding.value,
      resolution: form.elements.resolution.value,
      priority: form.elements.priority.value,
      budget: Number(form.elements.budget.value)
    };
    const choices = finderCore.rankSystems(systems, answers, 3);
    summary.innerHTML = `<span class="eyebrow">Your match</span><h2>${choices[0].system.name}</h2><p>Based on ${tasks.join(", ")}, ${answers.resolution} gaming, and a budget up to ${money(answers.budget)}. Recommendations use fixed rules, not a made-up AI score.</p>`;
    results.innerHTML = choices.map(card).join("");
    document.getElementById("finder-output").hidden = false;
    document.getElementById("finder-output").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  resetButton.addEventListener("click", function () {
    form.reset();
    document.getElementById("finder-output").hidden = true;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
