const requestHistory = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 8;
const ALLOWED_USES = new Set(["gaming", "school", "productivity", "video"]);
const ALLOWED_PERFORMANCE = new Set(["value", "balanced", "performance"]);

const catalog = [
  ["AMD Ryzen 5 7600", "cpu", 199.99, "AM5, DDR5, 65 W"],
  ["Intel Core i5-14600K", "cpu", 289.99, "LGA1700, DDR5, up to 181 W"],
  ["NVIDIA GeForce RTX 4070 SUPER", "gpu", 599.99, "12 GB GDDR6X, 220 W, 650 W recommended PSU"],
  ["AMD Radeon RX 7800 XT", "gpu", 499.99, "16 GB GDDR6, 263 W, 700 W recommended PSU"],
  ["MSI PRO B650-S WiFi", "motherboard", 169.99, "AM5, DDR5, ATX"],
  ["ASUS TUF Gaming Z790-Plus WiFi D4", "motherboard", 229.99, "LGA1700, DDR4, ATX"],
  ["Corsair Vengeance 32 GB DDR5-6000", "ram", 109.99, "32 GB, DDR5"],
  ["Kingston FURY Beast 32 GB DDR4-3200", "ram", 94.99, "32 GB, DDR4"],
  ["Samsung 990 PRO 2 TB", "storage", 179.99, "2 TB, PCIe 4.0 NVMe"],
  ["Kingston NV2 1 TB", "storage", 64.99, "1 TB, PCIe 4.0 NVMe"],
  ["Corsair RM750e", "psu", 119.99, "750 W, 80 PLUS Gold"],
  ["MSI MAG A850GL PCIE5", "psu", 139.99, "850 W, 80 PLUS Gold"],
  ["Corsair 4000D Airflow", "case", 104.99, "ATX / Micro-ATX / Mini-ITX"],
  ["NZXT H5 Flow", "case", 94.99, "ATX / Micro-ATX / Mini-ITX"],
  ["Thermalright Peerless Assassin 120 SE", "cooling", 39.99, "AM5 / LGA1700"],
  ["Corsair H100x RGB Elite", "cooling", 99.99, "AM5 / LGA1700, 240 mm"]
];

function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function isRateLimited(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const clientId = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (requestHistory.get(clientId) || []).filter(function (time) { return now - time < WINDOW_MS; });
  recent.push(now);
  requestHistory.set(clientId, recent);
  return recent.length > MAX_REQUESTS;
}

export default async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });
  if (isRateLimited(request)) return sendJson(response, 429, { error: "Too many requests. Please wait a minute." });
  if (!process.env.GEMINI_API_KEY) return sendJson(response, 503, { error: "Gemini is not configured." });

  const body = request.body && typeof request.body === "object" ? request.body : {};
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
  const budget = Number(profile.budget);

  if (!message || message.length > 1200) return sendJson(response, 400, { error: "Message must be between 1 and 1200 characters." });
  if (!Number.isFinite(budget) || budget < 500 || budget > 5000) return sendJson(response, 400, { error: "Budget must be between 500 and 5000." });
  if (!ALLOWED_USES.has(profile.use) || !ALLOWED_PERFORMANCE.has(profile.performance)) return sendJson(response, 400, { error: "Invalid recommendation preferences." });

  const existingParts = typeof profile.existingParts === "string" ? profile.existingParts.trim().slice(0, 500) : "None listed";
  const prompt = [
    "You are the Nexora PC recommendation assistant for a student demonstration site.",
    "Recommend only products in the provided catalog. Use exact names and listed demo prices. Do not invent specifications, inventory, benchmarks, discounts, or compatibility.",
    "Stay near the budget when possible, explain trade-offs briefly, and note that demo prices are not current market prices.",
    "Check CPU socket, DDR type, ATX case support, cooler socket, and PSU wattage using only the catalog text.",
    "Write a concise plain-text answer suitable for a beginner. Mention exact product names so the website can create links.",
    "User profile: budget $" + budget + ", main use " + profile.use + ", goal " + profile.performance + ", existing parts: " + existingParts + ".",
    "User question: " + message,
    "Catalog: " + JSON.stringify(catalog)
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, 15000);

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const apiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 900 }
      }),
      signal: controller.signal
    });

    if (!apiResponse.ok) {
      console.error("Gemini request failed with status", apiResponse.status);
      return sendJson(response, 502, { error: "The recommendation service is temporarily unavailable." });
    }

    const data = await apiResponse.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(function (part) { return part.text || ""; }).join("").trim();
    if (!reply) return sendJson(response, 502, { error: "The recommendation service returned an empty response." });
    return sendJson(response, 200, { reply: reply.slice(0, 5000) });
  } catch (error) {
    console.error("Gemini request error", error.name);
    return sendJson(response, 502, { error: "The recommendation service is temporarily unavailable." });
  } finally {
    clearTimeout(timeout);
  }
}
