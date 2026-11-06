const requestHistory = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 8;
const MAX_HISTORY_MESSAGES = 8;

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

function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_HISTORY_MESSAGES).flatMap(function (item) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.text !== "string") return [];
    const text = item.text.trim().slice(0, 1200);
    if (!text) return [];
    return [{ role: item.role === "assistant" ? "model" : "user", parts: [{ text: text }] }];
  });
}

async function readRequestBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string") {
    try { return JSON.parse(request.body); } catch (error) { return {}; }
  }

  let raw = "";
  try {
    for await (const chunk of request) {
      raw += chunk.toString("utf8");
      if (raw.length > 20000) return {};
    }
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });
  if (isRateLimited(request)) return sendJson(response, 429, { error: "Too many requests. Please wait a minute." });
  if (!process.env.GEMINI_API_KEY) return sendJson(response, 503, { error: "Gemini is not configured." });

  const body = await readRequestBody(request);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1200) return sendJson(response, 400, { error: "Message must be between 1 and 1200 characters." });

  const systemInstruction = [
    "You are Nexora AI, the embedded PC hardware assistant for Nexora, a student-built PC shopping and planning demonstration.",
    "Help beginners and enthusiasts with component recommendations, build planning, hardware specifications, CPU and GPU comparisons, compatibility checks, and other PC questions.",
    "The Nexora storefront inventory is currently unavailable and marked Coming Soon. Never claim a product is in stock, for sale, discounted, or available through Nexora.",
    "The Thanksgiving 20% off banner is a design placeholder only. Never describe that discount as active.",
    "Do not invent current prices, stock, benchmark results, or compatibility. Clearly say when price, availability, BIOS support, physical clearance, power requirements, or compatibility has not been verified.",
    "For compatibility questions, ask for exact model numbers when needed and remind the visitor to verify the motherboard support list, case clearance, PSU connectors and capacity, RAM support, and cooler mounting hardware.",
    "Prefer concise, practical plain text. Do not use markdown tables. Keep most answers under 350 words unless the visitor asks for detail."
  ].join(" ");
  const contents = sanitizeHistory(body.history);
  contents.push({ role: "user", parts: [{ text: message }] });

  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, 18000);
  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const apiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: contents,
        generationConfig: { temperature: 0.35, maxOutputTokens: 900 }
      }),
      signal: controller.signal
    });
    if (!apiResponse.ok) {
      console.error("Gemini request failed with status", apiResponse.status);
      return sendJson(response, 502, { error: "The AI service is temporarily unavailable." });
    }
    const data = await apiResponse.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(function (part) { return part.text || ""; }).join("").trim();
    if (!reply) return sendJson(response, 502, { error: "The AI service returned an empty response." });
    return sendJson(response, 200, { reply: reply.slice(0, 5000) });
  } catch (error) {
    console.error("Gemini request error", error.name);
    return sendJson(response, 502, { error: "The AI service is temporarily unavailable." });
  } finally {
    clearTimeout(timeout);
  }
}
