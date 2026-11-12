(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NEXORA_PREBUILT_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function gameDemand(gameText) {
    const value = String(gameText || "").toLowerCase();
    if (/cyberpunk|starfield|alan wake|flight simulator|gta|black myth|4k/.test(value)) return 5;
    if (/cod|call of duty|fortnite|apex|elden|forza|helldivers/.test(value)) return 4;
    if (/valorant|minecraft|roblox|league|rocket league|cs2|overwatch/.test(value)) return 2;
    return 3;
  }

  function scoreSystem(system, answers) {
    let score = 0;
    const reasons = [];
    if (system.price <= answers.budget) score += 18; else score -= Math.ceil((system.price - answers.budget) / 100) * 3;
    const budgetUse = system.price / answers.budget;
    if (budgetUse >= 0.72 && budgetUse <= 1) score += 6;
    if (answers.tasks.includes("gaming")) { score += system.gaming * 4; reasons.push(system.gpu + " fits the gaming focus"); }
    if (answers.tasks.includes("coding")) { score += system.coding * (answers.coding === "heavy" ? 5 : answers.coding === "medium" ? 3 : 2); reasons.push(system.cpu + " supports the coding workload"); }
    if (answers.tasks.includes("creation")) { score += system.creation * 4; reasons.push(system.ram + " helps with creative multitasking"); }
    if (answers.tasks.includes("school")) score += system.coding * 2;
    const requiredGaming = Math.max(gameDemand(answers.games), answers.resolution === "4k" ? 5 : answers.resolution === "1440p" ? 4 : 2);
    if (system.gaming >= requiredGaming) score += 10; else score -= (requiredGaming - system.gaming) * 6;
    if (answers.coding === "heavy" && /32GB/.test(system.ram)) score += 7;
    if (answers.priority === "upgradeability") score += system.upgradeability * 2;
    if (answers.priority === "value" && budgetUse <= 0.85) score += 5;
    if (answers.priority === "performance") score += system.gaming + system.coding + system.creation;
    return { system: system, score: score, reasons: reasons.slice(0, 2) };
  }

  function rankSystems(systems, answers, limit) {
    const ranked = systems.map(function (system) { return scoreSystem(system, answers); }).sort(function (a, b) { return b.score - a.score || a.system.price - b.system.price; });
    const withinBudget = ranked.filter(function (entry) { return entry.system.price <= answers.budget; });
    return (withinBudget.length ? withinBudget : ranked).slice(0, limit || 3);
  }

  return { gameDemand, scoreSystem, rankSystems };
});
