const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

module.exports = async function handler(request, response) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowedOrigin(request)) {
    response.status(403).json({ error: "Origin not allowed" });
    return;
  }

  if (!process.env.NVIDIA_API_KEY) {
    response.status(500).json({ error: "Missing NVIDIA_API_KEY environment variable" });
    return;
  }

  const messages = Array.isArray(request.body && request.body.messages) ? request.body.messages.slice(-10) : [];

  if (!messages.length) {
    response.status(400).json({ error: "Missing messages" });
    return;
  }

  try {
    const upstream = await fetch(NVIDIA_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "meta/llama-4-maverick-17b-128e-instruct",
        messages,
        max_tokens: clampNumber(request.body.max_tokens, 64, 700, 512),
        temperature: clampNumber(request.body.temperature, 0, 1.2, 0.78),
        top_p: clampNumber(request.body.top_p, 0.1, 1, 0.92),
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })
    });

    const data = await upstream.json();
    response.status(upstream.status).json(data);
  } catch (error) {
    response.status(502).json({ error: "AI service unavailable" });
  }
};

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function isAllowedOrigin(request) {
  const allowedOrigin = process.env.AI_ALLOWED_ORIGIN;
  if (!allowedOrigin) return true;
  return request.headers.origin === allowedOrigin;
}

function setCorsHeaders(request, response) {
  const allowedOrigin = process.env.AI_ALLOWED_ORIGIN || request.headers.origin || "*";
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Vary", "Origin");
}
