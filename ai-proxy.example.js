// Optional secure proxy for Élise d’Or.
// Deploy as a Cloudflare Worker or similar serverless function.
// Set NVIDIA_API_KEY as a private environment variable. Never ship it in HTML or browser JS.

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    if (!isAllowedOrigin(request, env)) {
      return json({ error: "Origin not allowed" }, 403, headers);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, headers);
    }

    if (!env.NVIDIA_API_KEY) {
      return json({ error: "Missing NVIDIA_API_KEY server secret" }, 500, headers);
    }

    const payload = await request.json();
    const safePayload = {
      model: "meta/llama-4-maverick-17b-128e-instruct",
      messages: Array.isArray(payload.messages) ? payload.messages.slice(-10) : [],
      max_tokens: Math.min(Number(payload.max_tokens) || 512, 700),
      temperature: typeof payload.temperature === "number" ? payload.temperature : 0.78,
      top_p: typeof payload.top_p === "number" ? payload.top_p : 0.92,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false
    };

    if (!safePayload.messages.length) {
      return json({ error: "Missing messages" }, 400, headers);
    }

    const upstream = await fetch(NVIDIA_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(safePayload)
    });

    const data = await upstream.json();
    return json(data, upstream.status, headers);
  }
};

function isAllowedOrigin(request, env) {
  if (!env.ALLOWED_ORIGIN) return true;
  return request.headers.get("Origin") === env.ALLOWED_ORIGIN;
}

function corsHeaders(request, env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || request.headers.get("Origin") || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
